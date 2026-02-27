import jsPDF from "jspdf";
import { format } from "date-fns";

interface QuoteLineItem {
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
}

interface QuoteData {
    quoteNumber: string;
    title: string;
    createdAt: string | Date;
    expirationDate?: string | Date | null;
    accountName?: string;
    contactName?: string;
    totalAmount: number;
    taxRate?: number;
    taxAmount?: number;
    subtotal: number;
    items: QuoteLineItem[];
    notes?: string;
    terms?: string;
    payerMemo?: string;
    customerAddress?: string;
    companyName?: string;
    logoUrl?: string;
}

const COLORS = {
    black: [24, 24, 27] as [number, number, number],
    darkGray: [63, 63, 70] as [number, number, number],
    medGray: [113, 113, 122] as [number, number, number],
    lightGray: [161, 161, 170] as [number, number, number],
    veryLight: [228, 228, 231] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    accent: [99, 102, 241] as [number, number, number],      // indigo-500
    accentLight: [165, 180, 252] as [number, number, number], // indigo-300
};

function setColor(doc: jsPDF, color: [number, number, number]) {
    doc.setTextColor(color[0], color[1], color[2]);
}

function drawLine(doc: jsPDF, y: number, x1 = 20, x2 = 190) {
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.3);
    doc.line(x1, y, x2, y);
}

export function generateQuotePDF(quote: QuoteData): jsPDF {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageW = 210;
    const pageH = 297;
    let y = 20;

    // Watermark (Light Opacity Emboss)
    try {
        // @ts-ignore - setGState exists in jsPDF
        doc.saveGraphicsState();
        // @ts-ignore
        doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
        doc.addImage('/BasaltCRM.png', 'PNG', (pageW - 150) / 2, (pageH - 150) / 2, 150, 150);
        // @ts-ignore
        doc.restoreGraphicsState();
    } catch (e) {
        console.warn("Watermark image not found or failed to load");
    }

    // Header bar
    doc.setFillColor(COLORS.black[0], COLORS.black[1], COLORS.black[2]);
    doc.rect(0, 0, pageW, 44, "F");

    // Surge Icon (Premium branding)
    try {
        doc.addImage('/Surge32.png', 'PNG', 12, 11, 8, 8);
    } catch (e) {
        console.warn("Surge icon not found");
    }

    // Brand
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    setColor(doc, COLORS.white);
    const title = quote.companyName ? `${quote.companyName.toUpperCase()} TEAM PROPOSAL` : "CRM PROPOSAL";
    doc.text(title, 22, 18);

    // Dynamic Team Logo (if available)
    if (quote.logoUrl) {
        try {
            // Position logo at top-right
            doc.addImage(quote.logoUrl, 'PNG', pageW - 40, 5, 15, 15);
        } catch (e) {
            console.error("Failed to add team logo to PDF", e);
        }
    }

    // Label
    doc.setFontSize(10);
    setColor(doc, COLORS.accentLight);
    doc.text("SALES QUOTE", 22, 28);

    // Number
    doc.setFontSize(11);
    setColor(doc, COLORS.lightGray);
    doc.text(quote.quoteNumber, pageW - 20, 18, { align: "right" });

    // Date
    doc.setFontSize(8);
    setColor(doc, COLORS.medGray);
    doc.text(
        `Issued: ${format(new Date(quote.createdAt), "MMMM d, yyyy")}`,
        pageW - 20, 26, { align: "right" }
    );
    if (quote.expirationDate) {
        doc.text(
            `Expires: ${format(new Date(quote.expirationDate), "MMMM d, yyyy")}`,
            pageW - 20, 31, { align: "right" }
        );
    }

    y = 56;

    // Prepared For
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.medGray);
    doc.text("PREPARED FOR", 20, y);
    doc.text("QUOTE TITLE", 110, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setColor(doc, COLORS.black);
    doc.text(quote.accountName || quote.contactName || "Valued Client", 20, y);
    doc.text(quote.title, 110, y);

    if (quote.customerAddress) {
        y += 5;
        doc.setFontSize(8);
        setColor(doc, COLORS.darkGray);
        const splitAddress = doc.splitTextToSize(quote.customerAddress, 80);
        doc.text(splitAddress, 20, y);
        y += (splitAddress.length * 4);
    } else {
        y += 15;
    }

    // Items table
    drawLine(doc, y);
    y += 6;

    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 3, 170, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(doc, COLORS.medGray);
    doc.text("DESCRIPTION", 22, y + 2);
    doc.text("QTY", 120, y + 2, { align: "right" });
    doc.text("UNIT PRICE", 150, y + 2, { align: "right" });
    doc.text("TOTAL", 188, y + 2, { align: "right" });

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    quote.items.forEach((item) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        setColor(doc, COLORS.darkGray);
        doc.text(item.name.substring(0, 50), 22, y);
        doc.text(String(item.quantity), 120, y, { align: "right" });
        doc.text(`$${item.unitPrice.toFixed(2)}`, 150, y, { align: "right" });
        setColor(doc, COLORS.black);
        doc.text(`$${item.totalPrice.toFixed(2)}`, 188, y, { align: "right" });
        y += 6;
    });

    y += 4;
    drawLine(doc, y);
    y += 8;

    // Totals
    const totalsX = 130;
    const valX = 188;
    doc.setFontSize(9);

    // Subtotal
    setColor(doc, COLORS.medGray);
    doc.text("Subtotal", totalsX, y);
    setColor(doc, COLORS.darkGray);
    doc.text(`$${quote.subtotal.toFixed(2)}`, valX, y, { align: "right" });
    y += 6;

    // Tax
    if (quote.taxRate && quote.taxRate > 0) {
        setColor(doc, COLORS.medGray);
        doc.text(`Tax (${quote.taxRate}%)`, totalsX, y);
        setColor(doc, COLORS.darkGray);
        const taxVal = quote.taxAmount || (quote.subtotal * (quote.taxRate / 100));
        doc.text(`$${taxVal.toFixed(2)}`, valX, y, { align: "right" });
        y += 6;
    }

    // Total
    drawLine(doc, y - 1, totalsX, valX);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setColor(doc, COLORS.accent);
    doc.text("Quote Total", totalsX, y);
    doc.text(`$${quote.totalAmount.toFixed(2)}`, valX, y, { align: "right" });

    y += 20;

    // Notes
    if (quote.notes || quote.terms) {
        if (y > 230) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        setColor(doc, COLORS.medGray);
        doc.text("TERMS & NOTES", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setColor(doc, COLORS.darkGray);
        const splitNotes = doc.splitTextToSize(quote.notes || quote.terms || "", 170);
        doc.text(splitNotes, 20, y);
    }

    // Footer
    const footerY = 280;
    doc.setFontSize(7);
    setColor(doc, COLORS.lightGray);
    doc.text("Generated via BasaltCRM Platform Proposal Tool", 20, footerY);
    doc.text(format(new Date(), "PPpp"), pageW - 20, footerY, { align: "right" });

    return doc;
}
