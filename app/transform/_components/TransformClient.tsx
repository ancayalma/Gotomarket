"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, ChevronRight, CheckCircle2, AlertCircle, Loader2, Play, Download, Settings, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Step = "SELECT_TOOL" | "UPLOAD" | "ANALYZING" | "REVIEW" | "PROCESSING" | "DONE";
type TransformType = "EXCEL" | "MARKDOWN" | "JSON" | "TEXT";

export function TransformClient() {
    const [step, setStep] = useState<Step>("SELECT_TOOL");
    const [transformType, setTransformType] = useState<TransformType>("EXCEL");
    const [saveHistory, setSaveHistory] = useState<boolean>(false);
    const [file, setFile] = useState<File | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [dataType, setDataType] = useState<"FORM_FIELDS" | "TABULAR" | "MIXED" | null>(null);
    const [boundingBoxes, setBoundingBoxes] = useState<any[]>([]);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    const onDrop = async (acceptedFiles: File[]) => {
        const selected = acceptedFiles[0];
        if (!selected) return;
        if (selected.type.includes("image")) {
            setFile(selected);
            setNumPages(1);
            const arrayBuffer = await selected.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:${selected.type};base64,${base64}`;
            setPreviewImages([dataUrl]);
            setStep("REVIEW");
            return;
        }

        if (selected.type !== "application/pdf") {
            toast.error("Please upload a valid PDF or Image file.");
            return;
        }

        setFile(selected);
        setStep("ANALYZING");

        try {
            // Dynamically import pdfjs-dist to prevent "DOMMatrix is not defined" SSR errors
            const pdfjsLib = await import("pdfjs-dist");
            // Use the correct mjs extension for version 5.x from unpkg
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

            const arrayBuffer = await selected.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pages = pdf.numPages;
            setNumPages(pages);

            if (pages > 200) {
                toast.error("Document is too large (max 200 pages). Please contact us for custom processing.");
                setStep("UPLOAD");
                setFile(null);
                return;
            }

            // Extract first 1 or 2 pages as images for preview
            const images: string[] = [];
            const pagesToExtract = Math.min(2, pages);
            
            // Track first page dimensions for bounding box math
            let firstPageWidth = 0;
            let firstPageHeight = 0;
            
            for (let i = 1; i <= pagesToExtract; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // Good balance of quality/size
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (context) {
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    if (i === 1) {
                        firstPageWidth = viewport.width;
                        firstPageHeight = viewport.height;
                    }
                    await page.render({ canvasContext: context, viewport, canvas: canvas as any }).promise;
                    images.push(canvas.toDataURL("image/jpeg", 0.8));
                }
            }
            
            setPreviewImages(images);

            // Call Preview API — send image dimensions so AI can return pixel coords
            const response = await fetch("/api/transform/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ images, imageWidth: firstPageWidth, imageHeight: firstPageHeight }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate preview. The vision model may have timed out.");
            }

            const data = await response.json();
            setDataType(data.dataType || "TABULAR");

            if (data.dataType === "FORM_FIELDS" || (!data.tables?.length && data.formFields?.length)) {
                // Map to a table of Field/Value
                const formRows = (data.formFields || []).map((f: any) => ({
                    "Field Name": f.label,
                    "Value": f.value
                }));
                setParsedData(formRows);
                setHeaders(["Field Name", "Value"]);
            } else if (data.tables && data.tables.length > 0) {
                const table = data.tables[0];
                const flattenedRows = table.rows.map((row: any) => {
                    const flatObj: any = {};
                    if (row.cells && Array.isArray(row.cells)) {
                        row.cells.forEach((cell: any) => {
                            if (cell.header) flatObj[cell.header] = cell.value || "";
                        });
                    }
                    return flatObj;
                });
                setParsedData(flattenedRows);
                
                const keys = new Set<string>();
                table.rows.forEach((row: any) => {
                    row.cells?.forEach((cell: any) => {
                        if (cell.header) keys.add(cell.header);
                    });
                });
                setHeaders(Array.from(keys));
            } else {
                setParsedData([]);
                setHeaders([]);
            }

            setBoundingBoxes(data.boundingBoxes || []);
            
            setStep("REVIEW");

        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze PDF. Please try again.");
            setStep("UPLOAD");
            setFile(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 
            "application/pdf": [".pdf"],
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"]
        },
        maxFiles: 1,
    });

    const handleProcess = async () => {
        if (!file) return;
        setStep("PROCESSING");
        try {
            // If it's over 5 pages, we need to create a checkout session
            if (numPages > 5) {
                const res = await fetch("/api/transform/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pages: numPages, fileName: file.name, type: transformType })
                });
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                    return;
                }
            }

            // Otherwise, process free tier
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", transformType);
            formData.append("saveHistory", saveHistory ? "true" : "false");
            
            const processRes = await fetch("/api/transform/process", {
                method: "POST",
                body: formData,
            });

            if (!processRes.ok) {
                const err = await processRes.json();
                throw new Error(err.error || "Failed to process PDF.");
            }

            // Stream download
            const blob = await processRes.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            
            let ext = ".xlsx";
            if (transformType === "MARKDOWN") ext = ".md";
            if (transformType === "JSON") ext = ".json";
            if (transformType === "TEXT") ext = ".txt";

            a.download = `${file.name.replace(".pdf", "").replace(".png", "").replace(".jpg", "")}_extracted${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setStep("DONE");
            toast.success("Document processed successfully!");
        } catch (error: any) {
            toast.error(error.message);
            setStep("REVIEW");
        }
    };

    const handleCellChange = (rowIndex: number, colKey: string, val: string) => {
        const newData = [...parsedData];
        newData[rowIndex][colKey] = val;
        setParsedData(newData);
    };

    return (
        <div className="w-full flex flex-col relative min-h-[500px]">
            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-8 mb-8 border-b border-white/10 pb-6">
                {[
                    { id: "SELECT_TOOL", label: "Select Tool" },
                    { id: "UPLOAD", label: "Upload" },
                    { id: "REVIEW", label: "Review" },
                    { id: "DONE", label: "Export" }
                ].map((s, i) => (
                    <div key={s.id} className={`flex items-center space-x-2 ${step === s.id ? "text-white" : "text-white/40"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            step === s.id ? "bg-orange-500 text-white" : "bg-white/10"
                        }`}>
                            {i + 1}
                        </div>
                        <span className="text-sm font-medium">{s.label}</span>
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === "SELECT_TOOL" && (
                    <motion.div
                        key="select_tool"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {[
                            { id: "EXCEL", title: "Tabular Extraction", desc: "Dense ledgers to Excel (.xlsx)", cost: "$0.05/page" },
                            { id: "MARKDOWN", title: "Layout to Markdown", desc: "Reports to clean Markdown (.md)", cost: "$0.02/page" },
                            { id: "JSON", title: "Receipts to JSON", desc: "Invoices to API-ready JSON", cost: "$0.02/doc" },
                            { id: "TEXT", title: "Handwriting & OCR", desc: "Whiteboards & notes to Text (.txt)", cost: "$0.01/image" }
                        ].map((t) => (
                            <div 
                                key={t.id}
                                onClick={() => { setTransformType(t.id as TransformType); setStep("UPLOAD"); }}
                                className="p-6 border border-white/10 bg-white/5 rounded-xl hover:bg-white/10 hover:border-orange-500/50 cursor-pointer transition-all group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/0 via-orange-500/0 to-orange-500/0 group-hover:to-orange-500/10 transition-all"></div>
                                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-orange-400">{t.title}</h3>
                                <p className="text-sm text-white/50 mb-4">{t.desc}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium px-2 py-1 bg-black/50 rounded text-white/70">{t.cost}</span>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-orange-400" />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {step === "UPLOAD" && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        {...(getRootProps() as any)}
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-16 cursor-pointer transition-colors ${
                            isDragActive ? "border-orange-500 bg-orange-500/5" : "border-white/20 bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                    >
                        <input {...getInputProps()} />
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <UploadCloud className="w-8 h-8 text-white/60" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Drop your File here</h3>
                        <p className="text-white/40 text-sm max-w-sm text-center">
                            Supports PDFs, invoices, and images (PNG, JPG, WEBP).
                        </p>
                    </motion.div>
                )}

                {step === "ANALYZING" && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-6" />
                        <h3 className="text-xl font-semibold mb-2">Vision AI is Analyzing...</h3>
                        <p className="text-white/40 text-sm">Identifying layout, tables, and extraction points on the first {numPages > 1 ? "2 pages" : "page"}.</p>
                    </motion.div>
                )}

                {step === "REVIEW" && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Preview Area (Left) */}
                            <div className="flex flex-col border border-white/10 rounded-xl bg-black/50 overflow-hidden relative group">
                                <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                    <div className="flex items-center space-x-2 text-sm text-white/60">
                                        <FileText className="w-4 h-4" />
                                        <span>Sample Page 1 Annotations</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs">Edit Zones</Button>
                                </div>
                                <div className="relative p-4 bg-zinc-950 flex items-center justify-center overflow-auto h-[800px]">
                                    {previewImages.length > 0 && (
                                        <div className="relative inline-block">
                                            <img src={previewImages[0]} alt="Page 1 Preview" className="max-h-[750px] w-auto block" />
                                            {/* Bounding Box Overlays — pure CSS percentages */}
                                            <style>{`
                                                @keyframes lens-marquee {
                                                    0% { transform: translateX(0%); }
                                                    100% { transform: translateX(-50%); }
                                                }
                                            `}</style>
                                            {boundingBoxes.map((box, i) => (
                                                <div
                                                    key={`box_${i}`}
                                                    className="absolute border-[3px] border-orange-500 bg-orange-500/15 group/box cursor-pointer hover:bg-orange-500/30 hover:border-orange-400 transition-all shadow-[0_0_6px_rgba(249,115,22,0.4)]"
                                                    style={{
                                                        left: `${box.x}%`,
                                                        top: `${box.y}%`,
                                                        width: `${box.width}%`,
                                                        height: `${box.height}%`,
                                                    }}
                                                >
                                                    {/* Hover-activated label inside the box */}
                                                    <div className="absolute inset-0 flex items-center overflow-hidden opacity-0 group-hover/box:opacity-100 transition-opacity duration-200 bg-orange-500/85 backdrop-blur-sm z-40">
                                                        <div
                                                            className="whitespace-nowrap text-white text-[11px] font-bold px-2 tracking-wide"
                                                            style={{
                                                                animation: box.label.length > 20 ? 'lens-marquee 10s linear infinite' : 'none',
                                                            }}
                                                        >
                                                            {box.label}
                                                            {box.label.length > 20 && <span className="px-8">{box.label}</span>}
                                                        </div>
                                                    </div>
                                                    {/* Delete button — top-right corner on hover */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setBoundingBoxes(boundingBoxes.filter((_, idx) => idx !== i)); }}
                                                        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] leading-none flex items-center justify-center opacity-0 group-hover/box:opacity-100 transition-opacity z-50 hover:bg-red-400"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Data Table Preview (Right) */}
                            <div className="flex flex-col border border-white/10 rounded-xl bg-black/50 overflow-hidden">
                                <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                    <div className="flex items-center space-x-2 text-sm text-white/60">
                                        <TableProperties className="w-4 h-4" />
                                        <span>Parsed Data Preview</span>
                                    </div>
                                    <span className="text-xs text-white/40">Editable</span>
                                </div>
                                <div className="p-0 overflow-auto h-[800px]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs uppercase bg-white/5 text-white/60 sticky top-0 z-10">
                                            <tr>
                                                {headers.map((h, i) => (
                                                    <th key={i} className="px-4 py-3 font-medium border-b border-white/10">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.map((row, rIdx) => (
                                                <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                    {headers.map((h, cIdx) => (
                                                        <td key={cIdx} className="px-2 py-1">
                                                            <input
                                                                type="text"
                                                                className="w-full bg-transparent border border-transparent hover:border-white/20 focus:border-orange-500 focus:bg-black/50 rounded px-2 py-1 text-sm outline-none transition-all"
                                                                value={row[h] || ""}
                                                                onChange={(e) => handleCellChange(rIdx, h, e.target.value)}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {parsedData.length === 0 && (
                                                <tr>
                                                    <td colSpan={headers.length} className="px-4 py-8 text-center text-white/40 italic">
                                                        No data rows identified.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Save to Vault Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl mt-6">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">Save to Basalt Vault</span>
                                <span className="text-xs text-white/50">Store the original and extracted results securely in your CRM history.</span>
                            </div>
                            <div 
                                onClick={() => setSaveHistory(!saveHistory)}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${saveHistory ? 'bg-orange-500' : 'bg-white/20'}`}
                            >
                                <motion.div 
                                    className="w-4 h-4 bg-white rounded-full"
                                    animate={{ x: saveHistory ? 24 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </div>
                        </div>

                        {/* Footer Action / Checkout */}
                        <div className="pt-6 mt-4">
                            {numPages > 5 && process.env.NEXT_PUBLIC_LENS_TEST !== 'true' ? (
                                <div className="p-6 rounded-xl border border-orange-500/30 bg-orange-500/5 backdrop-blur-sm flex items-center justify-between shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertCircle className="w-4 h-4 text-orange-400" />
                                            <span className="font-semibold text-orange-400">Production Volume</span>
                                        </div>
                                        <p className="text-sm text-white/60">
                                            This document has <strong className="text-white">{numPages}</strong> pages. Processing requires a one-time fee.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Cost</span>
                                            <span className="text-2xl font-bold tracking-tight text-white">${(numPages * 0.05).toFixed(2)}</span>
                                        </div>
                                        <Button 
                                            onClick={handleProcess}
                                            size="lg"
                                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
                                        >
                                            Pay & Process <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-white">Free Tier Eligible</span>
                                            <span className="text-xs text-white/50">{numPages} pages (Limit: 5)</span>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleProcess}
                                        className="bg-white text-black hover:bg-white/90 font-medium"
                                    >
                                        Process Document <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {step === "PROCESSING" && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-6" />
                        <h3 className="text-xl font-semibold mb-2">Processing Full Document...</h3>
                        <p className="text-white/40 text-sm">Please keep this window open while we stream the conversion.</p>
                    </motion.div>
                )}

                {step === "DONE" && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Processing Complete</h3>
                        <p className="text-white/40 text-sm mb-8 text-center">Your Excel file has been generated and should start downloading automatically.</p>
                        
                        <Button variant="outline" onClick={() => { setStep("UPLOAD"); setFile(null); }}>
                            Process Another Document
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
