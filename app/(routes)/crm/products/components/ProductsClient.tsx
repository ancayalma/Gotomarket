"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Package,
    Layers,
    MoreHorizontal,
    Edit,
    Trash,
    Loader2,
    Settings2,
    Filter,
    Tags,
    Info,
    History,
    FileText,
    Boxes,
    BarChart3,
    CheckCircle2,
    Smartphone,
    Monitor,
    Hash,
    ChevronDown,
    DollarSign,
    Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct, deleteProduct, importFromSurge, importFromShopify, importFromWooCommerce, exportToSurge, getSurgeTaxCatalog, getEnabledIntegrations } from "@/actions/crm/products";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ProductBundleManager from "./ProductBundleManager";
import {
    CloudDownload,
    RefreshCcw,
    ArrowUpRight,
    Activity,
    ShoppingBag,
    Store,
    Save
} from "lucide-react";

interface ProductsClientProps {
    initialProducts: any[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
    const [products, setProducts] = useState(initialProducts);

    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [bundleProduct, setBundleProduct] = useState<any>(null);
    const [isImporting, setIsImporting] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [enabledIntegrations, setEnabledIntegrations] = useState({ surge: false, shopify: false, woocommerce: false });
    const [editProduct, setEditProduct] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        description: "",
        price: "",
        costPrice: "",
        taxRate: "0",
        category: "",
        brand: "",
        model: "",
        stock: "0",
        weight: "",
        width: "",
        height: "",
        length: "",
        isDigital: false,
        tags: "",
        taxable: true,
        jurisdictionCode: "",
        imageUrl: "",
        shippingEnabled: false,
        shippingConfig: {
            enabled: true,
            weightLbs: 0,
            dimensions: { length: 0, width: 0, height: 0, unit: "in" },
            shippingClass: "standard",
            allowedMethods: ["standard"],
            methodPricing: { "standard": 0 } as Record<string, number>,
            freeShippingThreshold: 0,
            handlingTimeDays: 1,
            originCountry: "US",
            domesticOnly: false,
            requiresSignature: false,
            insuranceRequired: false
        }
    });

    const [taxCatalog, setTaxCatalog] = useState<{ jurisdictions: any[] }>({ jurisdictions: [] });

    useEffect(() => {
        const fetchTax = async () => {
            const data = await getSurgeTaxCatalog();
            setTaxCatalog(data);
        };
        fetchTax();
    }, []);

    useEffect(() => {
        const fetchIntegrations = async () => {
            const data = await getEnabledIntegrations();
            setEnabledIntegrations(data);
        };
        fetchIntegrations();
    }, []);

    const [activeTab, setActiveTab] = useState("basic");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    // Filter states
    const [filters, setFilters] = useState({
        category: "all",
        brand: "all",
        minPrice: "",
        maxPrice: "",
        stockStatus: "all", // all, in-stock, out-of-stock
        type: "all" // all, physical, digital
    });

    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = filters.category === "all" || p.category === filters.category;
        const matchesBrand = filters.brand === "all" || p.brand === filters.brand;

        const price = p.price || 0;
        const matchesMinPrice = !filters.minPrice || price >= parseFloat(filters.minPrice);
        const matchesMaxPrice = !filters.maxPrice || price <= parseFloat(filters.maxPrice);

        const matchesStock = filters.stockStatus === "all" ||
            (filters.stockStatus === "in-stock" && (p.stock || 0) > 0) ||
            (filters.stockStatus === "out-of-stock" && (p.stock || 0) <= 0);

        const matchesType = filters.type === "all" ||
            (filters.type === "digital" && p.isDigital) ||
            (filters.type === "physical" && !p.isDigital);

        return matchesSearch && matchesCategory && matchesBrand && matchesMinPrice && matchesMaxPrice && matchesStock && matchesType;
    });

    const resetFilters = () => {
        setFilters({
            category: "all",
            brand: "all",
            minPrice: "",
            maxPrice: "",
            stockStatus: "all",
            type: "all"
        });
    };

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload?context=generic", {
            method: "POST",
            body: formData,
        });

        if (!uploadRes.ok) {
            throw new Error("Failed to upload image");
        }
        const data = await uploadRes.json();
        return data.document.document_file_url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let finalImageUrl = formData.imageUrl;
            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            const res = await createProduct({
                ...formData,
                price: parseFloat(formData.price) || 0,
                costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
                taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
                stock: parseInt(formData.stock) || 0,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                width: formData.width ? parseFloat(formData.width) : undefined,
                height: formData.height ? parseFloat(formData.height) : undefined,
                length: formData.length ? parseFloat(formData.length) : undefined,
                tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
                imageUrl: finalImageUrl || undefined,
                shippingEnabled: formData.shippingEnabled,
                shippingConfig: formData.shippingEnabled ? { ...formData.shippingConfig, enabled: true } : undefined
            });
            if (res.success) {
                toast.success("Product created successfully");
                setIsModalOpen(false);
                setFormData({
                    name: "",
                    sku: "",
                    description: "",
                    price: "",
                    costPrice: "",
                    taxRate: "0",
                    category: "",
                    brand: "",
                    model: "",
                    stock: "0",
                    weight: "",
                    width: "",
                    height: "",
                    length: "",
                    isDigital: false,
                    tags: "",
                    taxable: true,
                    jurisdictionCode: "",
                    imageUrl: "",
                    shippingEnabled: false,
                    shippingConfig: {
                        enabled: true,
                        weightLbs: 0,
                        dimensions: { length: 0, width: 0, height: 0, unit: "in" },
                        shippingClass: "standard",
                        allowedMethods: ["standard"],
                        methodPricing: { "standard": 0 } as Record<string, number>,
                        freeShippingThreshold: 0,
                        handlingTimeDays: 1,
                        originCountry: "US",
                        domesticOnly: false,
                        requiresSignature: false,
                        insuranceRequired: false
                    }
                });
                setImageFile(null);
                router.refresh();
            } else {
                toast.error("Failed to create product");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlatformImport = async (platform: string) => {
        setIsImporting(platform);
        try {
            let res;
            switch (platform) {
                case "surge":
                    res = await importFromSurge();
                    break;
                case "shopify":
                    res = await importFromShopify();
                    break;
                case "woocommerce":
                    res = await importFromWooCommerce();
                    break;
                default:
                    return;
            }
            if (res.success) {
                toast.success(`Imported ${res.importedCount} new products, updated ${res.updatedCount} existing.`);
                setIsImportModalOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || `Failed to import from ${platform}`);
            }
        } catch (error) {
            toast.error("Something went wrong with the import");
        } finally {
            setIsImporting(null);
        }
    };

    const openEditModal = (product: any) => {
        setEditProduct(product);
        setEditFormData({
            name: product.name || "",
            sku: product.sku || "",
            description: product.description || "",
            price: product.price?.toString() || "0",
            costPrice: product.costPrice?.toString() || "",
            taxRate: product.taxRate?.toString() || "0",
            category: product.category || "",
            brand: product.brand || "",
            model: product.model || "",
            stock: product.stock?.toString() || "0",
            weight: product.weight?.toString() || "",
            width: product.width?.toString() || "",
            height: product.height?.toString() || "",
            length: product.length?.toString() || "",
            isDigital: product.isDigital || false,
            imageUrl: product.imageUrl || "",
            tags: (product.tags || []).join(", "),
            taxable: product.taxable ?? true,
            jurisdictionCode: product.jurisdictionCode || "",
            attributes: product.attributes || {},
            currency: product.currency || "USD",
            ownerWallet: product.ownerWallet || "",
            isBook: product.isBook || false,
            allowDownload: product.allowDownload || false,
            drmEnabled: product.drmEnabled || false,
            isSubscription: product.isSubscription || false,
            industryPack: product.industryPack || "",
            shippingEnabled: product.shippingEnabled || false,
            shippingConfig: product.shippingConfig || {
                enabled: true,
                weightLbs: 0,
                dimensions: { length: 0, width: 0, height: 0, unit: "in" },
                shippingClass: "standard",
                allowedMethods: ["standard"],
                methodPricing: { "standard": 0 } as Record<string, number>,
                freeShippingThreshold: 0,
                handlingTimeDays: 1,
                originCountry: "US",
                domesticOnly: false,
                requiresSignature: false,
                insuranceRequired: false
            }
        });
        setEditImageFile(null);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProduct) return;
        setIsEditing(true);
        try {
            let finalImageUrl = editFormData.imageUrl;
            if (editImageFile) {
                finalImageUrl = await uploadImage(editImageFile);
            }

            const updateData: any = {
                name: editFormData.name,
                sku: editFormData.sku,
                description: editFormData.description || undefined,
                price: parseFloat(editFormData.price) || 0,
                costPrice: editFormData.costPrice ? parseFloat(editFormData.costPrice) : undefined,
                taxRate: editFormData.taxRate ? parseFloat(editFormData.taxRate) : undefined,
                category: editFormData.category || undefined,
                brand: editFormData.brand || undefined,
                model: editFormData.model || undefined,
                stock: parseInt(editFormData.stock) || 0,
                weight: editFormData.weight ? parseFloat(editFormData.weight) : undefined,
                width: editFormData.width ? parseFloat(editFormData.width) : undefined,
                height: editFormData.height ? parseFloat(editFormData.height) : undefined,
                length: editFormData.length ? parseFloat(editFormData.length) : undefined,
                isDigital: editFormData.isDigital || false,
                imageUrl: finalImageUrl || undefined,
                tags: editFormData.tags ? editFormData.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
                taxable: editFormData.taxable ?? true,
                jurisdictionCode: editFormData.jurisdictionCode || undefined,
                // Surge-specific fields
                attributes: editFormData.attributes || undefined,
                industryPack: editFormData.industryPack || undefined,
                currency: editFormData.currency || "USD",
                ownerWallet: editFormData.ownerWallet || undefined,
                isBook: editFormData.isBook || false,
                allowDownload: editFormData.allowDownload || false,
                drmEnabled: editFormData.drmEnabled || false,
                isSubscription: editFormData.isSubscription || false,
                shippingEnabled: editFormData.shippingEnabled,
                shippingConfig: editFormData.shippingEnabled ? { ...editFormData.shippingConfig, enabled: true } : undefined,
            };
            const res = await updateProduct(editProduct.id, updateData);
            if (res.success) {
                const syncMsg = res.syncedTo && res.syncedTo.length > 0
                    ? ` Auto-synced to ${res.syncedTo.join(", ")}.`
                    : "";
                toast.success(`Product updated successfully.${syncMsg}`);
                setIsEditModalOpen(false);
                setEditProduct(null);
                router.refresh();
            } else {
                toast.error("Failed to update product");
            }
        } catch (error) {
            console.error("[EDIT_PRODUCT_ERROR]", error);
            toast.error("Something went wrong");
        } finally {
            setIsEditing(false);
        }
    };

    const handleExportToSurge = async (productId: string) => {
        setIsExporting(productId);
        try {
            const res = await exportToSurge(productId);
            if (res.success) {
                toast.success("Product successfully exported/updated in Surge");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to export to Surge");
            }
        } catch (error) {
            toast.error("Something went wrong with the export");
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative w-96 max-w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products by name, SKU or brand..."
                            className="pl-3 h-10 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary transition-colors text-left"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2 h-10 border-primary/20 hover:bg-primary/5 transition-colors">
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Advanced Filters</span>
                                {(filters.category !== "all" || filters.brand !== "all" || filters.minPrice || filters.maxPrice || filters.stockStatus !== "all" || filters.type !== "all") && (
                                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                                        !
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80 p-4 border-primary/10 bg-background/95 backdrop-blur-md">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <Filter className="h-3.5 w-3.5 text-primary" /> Filter Options
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs hover:text-primary">
                                        Reset
                                    </Button>
                                </div>
                                <Separator />

                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Category</Label>
                                        <select
                                            value={filters.category}
                                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                            className="w-full bg-muted/30 border border-primary/10 rounded-md p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map(c => <option key={c} value={String(c)}>{String(c)}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Brand</Label>
                                        <select
                                            value={filters.brand}
                                            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                                            className="w-full bg-muted/30 border border-primary/10 rounded-md p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="all">All Brands</option>
                                            {brands.map(b => <option key={b} value={String(b)}>{String(b)}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Price Range</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                <Input
                                                    placeholder="Min"
                                                    className="pl-6 h-8 text-xs"
                                                    value={filters.minPrice}
                                                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                                />
                                            </div>
                                            <span className="text-muted-foreground">-</span>
                                            <div className="relative flex-1">
                                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                <Input
                                                    placeholder="Max"
                                                    className="pl-6 h-8 text-xs"
                                                    value={filters.maxPrice}
                                                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Stock</Label>
                                            <select
                                                value={filters.stockStatus}
                                                onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                                                className="w-full bg-muted/30 border border-primary/10 rounded-md p-1.5 text-sm"
                                            >
                                                <option value="all">Any</option>
                                                <option value="in-stock">In Stock</option>
                                                <option value="out-of-stock">Out of Stock</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Type</Label>
                                            <select
                                                value={filters.type}
                                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                                className="w-full bg-muted/30 border border-primary/10 rounded-md p-1.5 text-sm"
                                            >
                                                <option value="all">Any</option>
                                                <option value="physical">Physical</option>
                                                <option value="digital">Digital</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="gap-2 text-primary hover:bg-primary/5 hover:text-primary transition-colors h-10"
                            >
                                <CloudDownload className="h-4 w-4" />
                                Import Products
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] border-primary/20 bg-background/95 backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Import Products</DialogTitle>
                                <DialogDescription>Select an e-commerce platform to import products from.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-3 py-4">
                                {!enabledIntegrations.surge && !enabledIntegrations.shopify && !enabledIntegrations.woocommerce && (
                                    <div className="text-center py-8 space-y-3">
                                        <Package className="h-12 w-12 mx-auto text-muted-foreground/40" />
                                        <p className="text-muted-foreground">No e-commerce integrations configured.</p>
                                        <Button variant="outline" size="sm" onClick={() => window.open("/admin/integrations", "_blank")} className="border-primary/20">
                                            <Settings2 className="h-4 w-4 mr-2" />
                                            Set Up Integrations
                                        </Button>
                                    </div>
                                )}

                                {enabledIntegrations.surge && (
                                    <button
                                        onClick={() => handlePlatformImport("surge")}
                                        disabled={!!isImporting}
                                        className="flex items-center gap-4 p-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors text-left group disabled:opacity-50"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            {isImporting === "surge" ? <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" /> : <Image src="/Surge32.png" alt="Surge" width={24} height={24} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">BasaltSURGE</p>
                                            <p className="text-xs text-muted-foreground">Import from your Surge inventory</p>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                    </button>
                                )}

                                {enabledIntegrations.shopify && (
                                    <button
                                        onClick={() => handlePlatformImport("shopify")}
                                        disabled={!!isImporting}
                                        className="flex items-center gap-4 p-4 rounded-lg border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors text-left group disabled:opacity-50"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                            {isImporting === "shopify" ? <Loader2 className="h-5 w-5 text-green-400 animate-spin" /> : <ShoppingBag className="h-5 w-5 text-green-500" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Shopify</p>
                                            <p className="text-xs text-muted-foreground">Import from your Shopify store</p>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                    </button>
                                )}

                                {enabledIntegrations.woocommerce && (
                                    <button
                                        onClick={() => handlePlatformImport("woocommerce")}
                                        disabled={!!isImporting}
                                        className="flex items-center gap-4 p-4 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors text-left group disabled:opacity-50"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                            {isImporting === "woocommerce" ? <Loader2 className="h-5 w-5 text-purple-400 animate-spin" /> : <Box className="h-5 w-5 text-purple-500" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">WooCommerce</p>
                                            <p className="text-xs text-muted-foreground">Import from your WooCommerce store</p>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                    </button>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 w-full md:w-auto h-10 px-6">
                                <Plus className="h-4 w-4" />
                                Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl">
                            <form onSubmit={handleSubmit} className="flex flex-col h-[85vh] sm:h-auto max-h-[90vh]">
                                <div className="px-6 py-4 border-b border-primary/10">
                                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">Add New Product</DialogTitle>
                                    <DialogDescription>
                                        Define a new item for your sales catalog. Toggle between Basic and Advanced for detail control.
                                    </DialogDescription>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                                        <div className="px-6 py-2 bg-muted/30">
                                            <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-primary/10">
                                                <TabsTrigger value="basic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                    Basic Info
                                                </TabsTrigger>
                                                <TabsTrigger value="advanced" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                    Advanced Details
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <ScrollArea className="flex-1 px-6 py-4">
                                            <TabsContent value="basic" className="mt-0 space-y-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                                                        <Package className="h-3.5 w-3.5 text-primary" /> Product Name
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        placeholder="e.g. Premium Basalt Core"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                        className="bg-muted/10 border-primary/10 focus:border-primary"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="sku" className="text-sm font-semibold flex items-center gap-2">
                                                            <Hash className="h-3.5 w-3.5 text-primary" /> SKU
                                                        </Label>
                                                        <Input
                                                            id="sku"
                                                            placeholder="BSLT-001"
                                                            value={formData.sku}
                                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="price" className="text-sm font-semibold flex items-center gap-2">
                                                            <BarChart3 className="h-3.5 w-3.5 text-primary" /> Base Price ($)
                                                        </Label>
                                                        <Input
                                                            id="price"
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={formData.price}
                                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                                                        <Boxes className="h-3.5 w-3.5 text-primary" /> Category
                                                    </Label>
                                                    <Input
                                                        id="category"
                                                        placeholder="e.g. Hardware, Software, Service"
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                                                        <FileText className="h-3.5 w-3.5 text-primary" /> Description
                                                    </Label>
                                                    <Textarea
                                                        id="description"
                                                        placeholder="Detailed product information..."
                                                        className="min-h-[100px] resize-none"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="imageUpload" className="text-sm font-semibold flex items-center gap-2">
                                                        <Box className="h-3.5 w-3.5 text-primary" /> Product Image
                                                    </Label>
                                                    <div className="flex flex-col gap-2">
                                                        {formData.imageUrl && !imageFile && (
                                                            <div className="w-20 h-20 rounded-md overflow-hidden border border-primary/10 bg-muted">
                                                                <img src={formData.imageUrl?.match(/s3|ovh\.us/) ? `/api/images/presign?url=${encodeURIComponent(formData.imageUrl)}` : formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                            </div>
                                                        )}
                                                        {imageFile && (
                                                            <div className="w-20 h-20 rounded-md overflow-hidden border border-primary/10 bg-muted">
                                                                <img src={URL.createObjectURL(imageFile)} alt="Local Preview" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <Input
                                                            id="imageUpload"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files.length > 0) {
                                                                    setImageFile(e.target.files[0]);
                                                                    // Clear existing URL if uploading a new file
                                                                    setFormData({ ...formData, imageUrl: "" });
                                                                } else {
                                                                    setImageFile(null);
                                                                }
                                                            }}
                                                            className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                                        />
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="advanced" className="mt-0 space-y-6">
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <Settings2 className="h-4 w-4" /> Identity & Branding
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="brand">Brand</Label>
                                                            <Input
                                                                id="brand"
                                                                placeholder="BasaltHQ"
                                                                value={formData.brand}
                                                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="model">Model Number</Label>
                                                            <Input
                                                                id="model"
                                                                placeholder="v2-pro"
                                                                value={formData.model}
                                                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-2">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <BarChart3 className="h-4 w-4" /> Financials & Stock
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="costPrice">Cost Price ($)</Label>
                                                            <Input
                                                                id="costPrice"
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.costPrice}
                                                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                                            <Input
                                                                id="taxRate"
                                                                type="number"
                                                                step="0.1"
                                                                value={formData.taxRate}
                                                                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="stock">Initial Stock</Label>
                                                            <Input
                                                                id="stock"
                                                                type="number"
                                                                value={formData.stock}
                                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-2">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <Boxes className="h-4 w-4" /> Physical Attributes
                                                    </h3>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="weight">Weight (kg)</Label>
                                                            <Input
                                                                id="weight"
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.weight}
                                                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="width">Width (cm)</Label>
                                                            <Input
                                                                id="width"
                                                                type="number"
                                                                step="0.1"
                                                                value={formData.width}
                                                                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="height">Height (cm)</Label>
                                                            <Input
                                                                id="height"
                                                                type="number"
                                                                step="0.1"
                                                                value={formData.height}
                                                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="length">Length (cm)</Label>
                                                            <Input
                                                                id="length"
                                                                type="number"
                                                                step="0.1"
                                                                value={formData.length}
                                                                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-2">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <Tags className="h-4 w-4" /> Additional Properties
                                                    </h3>
                                                    <div className="flex items-center justify-between p-3 rounded-lg border border-primary/10 bg-muted/5">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-base">Digital Product</Label>
                                                            <p className="text-xs text-muted-foreground">This product has no physical delivery</p>
                                                        </div>
                                                        <Switch
                                                            checked={formData.isDigital}
                                                            onCheckedChange={(checked) => setFormData({ ...formData, isDigital: checked })}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="tags">Tags (comma separated)</Label>
                                                        <Input
                                                            id="tags"
                                                            placeholder="featured, hot, limited-edition"
                                                            value={formData.tags}
                                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="space-y-4 pt-2">
                                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4" /> Taxation (Surge)
                                                        </h3>
                                                        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/10 bg-muted/5">
                                                            <div className="space-y-0.5">
                                                                <Label className="text-base">Taxable Item</Label>
                                                                <p className="text-xs text-muted-foreground">Enable tax calculation for this product</p>
                                                            </div>
                                                            <Switch
                                                                checked={formData.taxable}
                                                                onCheckedChange={(checked) => setFormData({ ...formData, taxable: checked })}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="jurisdictionCode">Tax Jurisdiction</Label>
                                                            <select
                                                                id="jurisdictionCode"
                                                                value={formData.jurisdictionCode}
                                                                onChange={(e) => setFormData({ ...formData, jurisdictionCode: e.target.value })}
                                                                className="w-full bg-muted/30 border border-primary/10 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                            >
                                                                <option value="">Select Jurisdiction (Optional)</option>
                                                                {taxCatalog.jurisdictions?.map((j: any) => (
                                                                    <option key={j.code} value={j.code}>
                                                                        {j.displayName} ({j.rate * 100}%)
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Shipping Configuration (Add) */}
                                                <div className="space-y-4 pt-4 border-t border-primary/10">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                            <Package className="h-4 w-4" /> Fulfillment & Shipping
                                                        </h3>
                                                        <Switch checked={formData.shippingEnabled} onCheckedChange={(c) => setFormData({ ...formData, shippingEnabled: c })} />
                                                    </div>

                                                    {formData.shippingEnabled && (
                                                        <div className="grid gap-4 p-4 border border-primary/10 rounded-lg bg-muted/5">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Physical Weight (lbs)</Label>
                                                                    <Input type="number" step="0.01" value={formData.shippingConfig.weightLbs} onChange={(e) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, weightLbs: parseFloat(e.target.value) || 0 } })} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Shipping Class</Label>
                                                                    <select value={formData.shippingConfig.shippingClass} onChange={(e) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, shippingClass: e.target.value } })} className="w-full bg-muted/30 border border-primary/10 rounded-md p-1.5 text-sm">
                                                                        <option value="standard">Standard</option>
                                                                        <option value="oversized">Oversized</option>
                                                                        <option value="fragile">Fragile</option>
                                                                        <option value="hazardous">Hazardous</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Length ({formData.shippingConfig.dimensions.unit})</Label>
                                                                    <Input type="number" step="0.1" value={formData.shippingConfig.dimensions.length} onChange={(e) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, dimensions: { ...formData.shippingConfig.dimensions, length: parseFloat(e.target.value) || 0 } } })} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Width ({formData.shippingConfig.dimensions.unit})</Label>
                                                                    <Input type="number" step="0.1" value={formData.shippingConfig.dimensions.width} onChange={(e) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, dimensions: { ...formData.shippingConfig.dimensions, width: parseFloat(e.target.value) || 0 } } })} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Height ({formData.shippingConfig.dimensions.unit})</Label>
                                                                    <Input type="number" step="0.1" value={formData.shippingConfig.dimensions.height} onChange={(e) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, dimensions: { ...formData.shippingConfig.dimensions, height: parseFloat(e.target.value) || 0 } } })} />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Allowed Methods (hold Ctrl to select multiple)</Label>
                                                                <select multiple value={formData.shippingConfig.allowedMethods} onChange={(e) => {
                                                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                                    const newPricing = { ...formData.shippingConfig.methodPricing };
                                                                    selected.forEach(s => { if (newPricing[s] === undefined) newPricing[s] = 0; });
                                                                    setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, allowedMethods: selected, methodPricing: newPricing } })
                                                                }} className="w-full bg-muted/30 border border-primary/10 rounded-md p-1.5 text-sm h-24">
                                                                    <option value="standard">Standard</option>
                                                                    <option value="express">Express</option>
                                                                    <option value="overnight">Overnight</option>
                                                                    <option value="freight">Freight</option>
                                                                </select>
                                                            </div>

                                                            {formData.shippingConfig.allowedMethods.length > 0 && (
                                                                <div className="space-y-2 p-3 bg-background/50 rounded-md border border-primary/10">
                                                                    <Label className="text-xs font-semibold">Method Pricing Overrides ($)</Label>
                                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                                        {formData.shippingConfig.allowedMethods.map((method: string) => (
                                                                            <div key={method} className="flex items-center gap-2">
                                                                                <Label className="text-xs w-20 capitalize">{method}</Label>
                                                                                <Input type="number" step="0.01" className="h-8 text-xs flex-1" value={formData.shippingConfig.methodPricing[method] || 0} onChange={(e) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, methodPricing: { ...formData.shippingConfig.methodPricing, [method]: parseFloat(e.target.value) || 0 } } })} />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Free Shipping Min Total ($)</Label>
                                                                    <Input type="number" step="0.01" value={formData.shippingConfig.freeShippingThreshold} onChange={(e) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, freeShippingThreshold: parseFloat(e.target.value) || 0 } })} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Handling Time (Days)</Label>
                                                                    <Input type="number" step="1" value={formData.shippingConfig.handlingTimeDays} onChange={(e) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, handlingTimeDays: parseInt(e.target.value) || 0 } })} />
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Switch checked={formData.shippingConfig.domesticOnly} onCheckedChange={(v) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, domesticOnly: v } })} />
                                                                    <Label className="text-xs text-muted-foreground">Domestic Only</Label>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Switch checked={formData.shippingConfig.requiresSignature} onCheckedChange={(v) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, requiresSignature: v } })} />
                                                                    <Label className="text-xs text-muted-foreground">Signature Req.</Label>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Switch checked={formData.shippingConfig.insuranceRequired} onCheckedChange={(v) => setFormData({ ...formData, shippingConfig: { ...formData.shippingConfig, insuranceRequired: v } })} />
                                                                    <Label className="text-xs text-muted-foreground">Insurance Req.</Label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                            </TabsContent>
                                        </ScrollArea>
                                    </Tabs>
                                </div>

                                <DialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsModalOpen(false)}
                                        className="hover:bg-primary/5"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[120px]"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Save Product
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead>Bundles</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                                        No products found. Start by adding one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <TableRow key={product.id} className="group transition-colors hover:bg-muted/50">
                                        <TableCell>
                                            {product.imageUrl ? (
                                                <div className="w-10 h-10 rounded-md overflow-hidden border border-primary/10 bg-muted">
                                                    <img src={product.imageUrl?.match(/s3|ovh\.us/) ? `/api/images/presign?url=${encodeURIComponent(product.imageUrl)}` : product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 transition-colors">
                                                    <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-foreground tracking-tight">{product.name}</span>
                                                    {product.brand && (
                                                        <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                                                            {product.brand}
                                                        </span>
                                                    )}
                                                    {product.surge_id && (
                                                        <Badge variant="outline" className="text-[9px] h-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 gap-1 px-1">
                                                            <Image src="/Surge32.png" alt="" width={10} height={10} className="rounded-sm" /> Surge
                                                        </Badge>
                                                    )}
                                                    {product.shopify_id && (
                                                        <Badge variant="outline" className="text-[9px] h-4 bg-green-500/10 text-green-400 border-green-500/20 gap-1 px-1">
                                                            <ShoppingBag className="h-2 w-2" /> Shopify
                                                        </Badge>
                                                    )}
                                                    {product.woo_id && (
                                                        <Badge variant="outline" className="text-[9px] h-4 bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1 px-1">
                                                            <Store className="h-2 w-2" /> Woo
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{product.description || "No description"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{product.sku}</code>
                                        </TableCell>
                                        <TableCell>
                                            {product.category ? (
                                                <Badge variant="outline" className="font-medium">{product.category}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Uncategorized</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => setBundleProduct(product)}
                                            >
                                                <Layers className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-medium underline decoration-dotted underline-offset-4">{product.bundles?.length || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2" onClick={() => setBundleProduct(product)}>
                                                        <Layers className="h-3.5 w-3.5" /> Manage Bundle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2" onClick={() => openEditModal(product)}>
                                                        <Edit className="h-3.5 w-3.5" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2" onClick={() => handleExportToSurge(product.id)} disabled={isExporting === product.id}>
                                                        {isExporting === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                                                        {product.surge_id ? "Sync to Surge" : "Export to Surge"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {product.surge_id ? (
                                                        <>
                                                            <DropdownMenuItem className="gap-2 text-orange-400" onClick={() => {
                                                                if (confirm(`Remove "${product.name}" from CRM only? It will remain on Surge and can be re-imported.`)) {
                                                                    deleteProduct(product.id, false).then((res: any) => {
                                                                        if (res.success) {
                                                                            toast.success("Removed from CRM (still on Surge)");
                                                                            router.refresh();
                                                                        } else {
                                                                            toast.error(res.error || "Failed to delete");
                                                                        }
                                                                    });
                                                                }
                                                            }}>
                                                                <Trash className="h-3.5 w-3.5" /> Remove from CRM
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => {
                                                                if (confirm(`Permanently delete "${product.name}" from both CRM and Surge?`)) {
                                                                    deleteProduct(product.id, true).then((res: any) => {
                                                                        if (res.success) {
                                                                            toast.success(`Product deleted${res.deletedFromSurge ? " from CRM & Surge" : ""}`);
                                                                            router.refresh();
                                                                        } else {
                                                                            toast.error(res.error || "Failed to delete");
                                                                        }
                                                                    });
                                                                }
                                                            }}>
                                                                <Trash className="h-3.5 w-3.5" /> Delete Everywhere
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => {
                                                            if (confirm(`Delete "${product.name}"?`)) {
                                                                deleteProduct(product.id, false).then((res: any) => {
                                                                    if (res.success) {
                                                                        toast.success("Product deleted");
                                                                        router.refresh();
                                                                    } else {
                                                                        toast.error(res.error || "Failed to delete");
                                                                    }
                                                                });
                                                            }
                                                        }}>
                                                            <Trash className="h-3.5 w-3.5" /> Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {bundleProduct && (
                <ProductBundleManager
                    product={bundleProduct}
                    allProducts={products}
                    onClose={() => setBundleProduct(null)}
                />
            )}

            {/* Edit Product Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) setEditProduct(null); }}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl">
                    <form onSubmit={handleEditSubmit} className="flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-primary/10">
                            <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                                Edit Product
                            </DialogTitle>
                            <DialogDescription>
                                Update details below. Changes auto-sync to all connected platforms.
                            </DialogDescription>
                            <div className="flex items-center gap-2 mt-1">
                                {editProduct?.surge_id && <Badge variant="outline" className="text-[9px] h-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 gap-1 px-1"><Image src="/Surge32.png" alt="" width={10} height={10} className="rounded-sm" /> Surge</Badge>}
                                {editProduct?.shopify_id && <Badge variant="outline" className="text-[9px] h-4 bg-green-500/10 text-green-400 border-green-500/20 gap-1 px-1"><ShoppingBag className="h-2 w-2" /> Shopify</Badge>}
                                {editProduct?.woo_id && <Badge variant="outline" className="text-[9px] h-4 bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1 px-1"><Store className="h-2 w-2" /> Woo</Badge>}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>SKU</Label>
                                    <Input value={editFormData.sku} onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={3} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Price ($)</Label>
                                    <Input type="number" step="0.01" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cost Price ($)</Label>
                                    <Input type="number" step="0.01" value={editFormData.costPrice} onChange={(e) => setEditFormData({ ...editFormData, costPrice: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Stock</Label>
                                    <Input type="number" value={editFormData.stock} onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <select
                                        value={editFormData.category}
                                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                        className="w-full bg-muted/30 border border-primary/10 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="">Select category</option>
                                        <option value="Physical Goods">Physical Goods</option>
                                        <option value="Digital Goods">Digital Goods</option>
                                        <option value="Professional Services">Professional Services</option>
                                        <option value="Subscription">Subscription</option>
                                        <option value="Food & Beverage">Food & Beverage</option>
                                        <option value="Apparel & Fashion">Apparel & Fashion</option>
                                        <option value="Health & Beauty">Health & Beauty</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Home & Garden">Home & Garden</option>
                                        <option value="Software & SaaS">Software & SaaS</option>
                                        <option value="Education & Training">Education & Training</option>
                                        <option value="Art & Design">Art & Design</option>
                                        <option value="Consulting">Consulting</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Input value={editFormData.brand} onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Model</Label>
                                    <Input value={editFormData.model} onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Weight</Label>
                                    <Input type="number" step="0.01" value={editFormData.weight} onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Width</Label>
                                    <Input type="number" step="0.01" value={editFormData.width} onChange={(e) => setEditFormData({ ...editFormData, width: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Height</Label>
                                    <Input type="number" step="0.01" value={editFormData.height} onChange={(e) => setEditFormData({ ...editFormData, height: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Length</Label>
                                    <Input type="number" step="0.01" value={editFormData.length} onChange={(e) => setEditFormData({ ...editFormData, length: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Product Image</Label>
                                <div className="flex gap-3 items-start flex-col">
                                    {editFormData.imageUrl && !editImageFile && (
                                        <div className="w-20 h-20 rounded-md overflow-hidden border border-primary/10 bg-muted shrink-0">
                                            <img src={editFormData.imageUrl?.match(/s3|ovh\.us/) ? `/api/images/presign?url=${encodeURIComponent(editFormData.imageUrl)}` : editFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </div>
                                    )}
                                    {editImageFile && (
                                        <div className="w-20 h-20 rounded-md overflow-hidden border border-primary/10 bg-muted shrink-0">
                                            <img src={URL.createObjectURL(editImageFile)} alt="Local Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="grid gap-2 mt-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setEditImageFile(e.target.files[0]);
                                                setEditFormData({ ...editFormData, imageUrl: "" });
                                            } else {
                                                setEditImageFile(null);
                                            }
                                        }}
                                        className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                    />
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground w-16">Or URL:</span>
                                        <Input
                                            value={editFormData.imageUrl}
                                            onChange={(e) => {
                                                setEditFormData({ ...editFormData, imageUrl: e.target.value });
                                                setEditImageFile(null); // URL overrides local file
                                            }}
                                            placeholder="https://example.com/product-image.jpg"
                                            className="flex-1 h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tags (comma separated)</Label>
                                <Input value={editFormData.tags} onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })} placeholder="e.g. featured, sale" />
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Switch checked={editFormData.taxable} onCheckedChange={(v) => setEditFormData({ ...editFormData, taxable: v })} />
                                    <Label className="text-xs">Taxable</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={editFormData.isDigital} onCheckedChange={(v) => setEditFormData({ ...editFormData, isDigital: v })} />
                                    <Label className="text-xs">Digital Product</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={editFormData.isSubscription} onCheckedChange={(v) => setEditFormData({ ...editFormData, isSubscription: v })} />
                                    <Label className="text-xs">Subscription</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={editFormData.isBook} onCheckedChange={(v) => setEditFormData({ ...editFormData, isBook: v })} />
                                    <Label className="text-xs">Book</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={editFormData.allowDownload} onCheckedChange={(v) => setEditFormData({ ...editFormData, allowDownload: v })} />
                                    <Label className="text-xs">Download</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={editFormData.drmEnabled} onCheckedChange={(v) => setEditFormData({ ...editFormData, drmEnabled: v })} />
                                    <Label className="text-xs">DRM</Label>
                                </div>
                            </div>

                            {/* Shipping Configuration (Edit) */}
                            <div className="space-y-4 pt-4 border-t border-primary/10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Package className="h-4 w-4" /> Fulfillment & Shipping
                                    </h3>
                                    <Switch checked={editFormData.shippingEnabled} onCheckedChange={(c) => setEditFormData({ ...editFormData, shippingEnabled: c })} />
                                </div>

                                {editFormData.shippingEnabled && (
                                    <div className="grid gap-4 p-4 border border-primary/10 rounded-lg bg-muted/5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Physical Weight (lbs)</Label>
                                                <Input type="number" step="0.01" value={editFormData.shippingConfig.weightLbs} onChange={(e) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, weightLbs: parseFloat(e.target.value) || 0 } })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Shipping Class</Label>
                                                <select value={editFormData.shippingConfig.shippingClass} onChange={(e) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, shippingClass: e.target.value } })} className="w-full bg-muted/30 border border-primary/10 rounded-md p-1.5 text-sm">
                                                    <option value="standard">Standard</option>
                                                    <option value="oversized">Oversized</option>
                                                    <option value="fragile">Fragile</option>
                                                    <option value="hazardous">Hazardous</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Length ({editFormData.shippingConfig.dimensions.unit})</Label>
                                                <Input type="number" step="0.1" value={editFormData.shippingConfig.dimensions.length} onChange={(e) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, dimensions: { ...editFormData.shippingConfig.dimensions, length: parseFloat(e.target.value) || 0 } } })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Width ({editFormData.shippingConfig.dimensions.unit})</Label>
                                                <Input type="number" step="0.1" value={editFormData.shippingConfig.dimensions.width} onChange={(e) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, dimensions: { ...editFormData.shippingConfig.dimensions, width: parseFloat(e.target.value) || 0 } } })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Height ({editFormData.shippingConfig.dimensions.unit})</Label>
                                                <Input type="number" step="0.1" value={editFormData.shippingConfig.dimensions.height} onChange={(e) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, dimensions: { ...editFormData.shippingConfig.dimensions, height: parseFloat(e.target.value) || 0 } } })} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs">Allowed Methods (hold Ctrl to select multiple)</Label>
                                            <select multiple value={editFormData.shippingConfig.allowedMethods} onChange={(e) => {
                                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                const newPricing = { ...editFormData.shippingConfig.methodPricing };
                                                selected.forEach(s => { if (newPricing[s] === undefined) newPricing[s] = 0; });
                                                setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, allowedMethods: selected, methodPricing: newPricing } })
                                            }} className="w-full bg-muted/30 border border-primary/10 rounded-md p-1.5 text-sm h-24">
                                                <option value="standard">Standard</option>
                                                <option value="express">Express</option>
                                                <option value="overnight">Overnight</option>
                                                <option value="freight">Freight</option>
                                            </select>
                                        </div>

                                        {editFormData.shippingConfig.allowedMethods.length > 0 && (
                                            <div className="space-y-2 p-3 bg-background/50 rounded-md border border-primary/10">
                                                <Label className="text-xs font-semibold">Method Pricing Overrides ($)</Label>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {editFormData.shippingConfig.allowedMethods.map((method: string) => (
                                                        <div key={method} className="flex items-center gap-2">
                                                            <Label className="text-xs w-20 capitalize">{method}</Label>
                                                            <Input type="number" step="0.01" className="h-8 text-xs flex-1" value={editFormData.shippingConfig.methodPricing[method] || 0} onChange={(e) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, methodPricing: { ...editFormData.shippingConfig.methodPricing, [method]: parseFloat(e.target.value) || 0 } } })} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Free Shipping Min Total ($)</Label>
                                                <Input type="number" step="0.01" value={editFormData.shippingConfig.freeShippingThreshold} onChange={(e) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, freeShippingThreshold: parseFloat(e.target.value) || 0 } })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Handling Time (Days)</Label>
                                                <Input type="number" step="1" value={editFormData.shippingConfig.handlingTimeDays} onChange={(e) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, handlingTimeDays: parseInt(e.target.value) || 0 } })} />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 mt-2">
                                            <div className="flex items-center gap-2">
                                                <Switch checked={editFormData.shippingConfig.domesticOnly} onCheckedChange={(v) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, domesticOnly: v } })} />
                                                <Label className="text-xs text-muted-foreground">Domestic Only</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch checked={editFormData.shippingConfig.requiresSignature} onCheckedChange={(v) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, requiresSignature: v } })} />
                                                <Label className="text-xs text-muted-foreground">Signature Req.</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch checked={editFormData.shippingConfig.insuranceRequired} onCheckedChange={(v) => setEditFormData({ ...editFormData, shippingConfig: { ...editFormData.shippingConfig, insuranceRequired: v } })} />
                                                <Label className="text-xs text-muted-foreground">Insurance Req.</Label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Industry Pack & Currency & Wallet */}
                            {editProduct?.surge_id && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Industry Pack</Label>
                                        <select
                                            value={editFormData.industryPack || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, industryPack: e.target.value })}
                                            className="w-full bg-muted/30 border border-primary/10 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="">Select industry pack</option>
                                            <option value="general">General</option>
                                            <option value="restaurant">Restaurant</option>
                                            <option value="retail">Retail</option>
                                            <option value="hotel">Hotel</option>
                                            <option value="freelancer">Freelancer</option>
                                            <option value="publishing">Publishing</option>
                                        </select>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Change the industry pack to reclassify this item. Fields below will update accordingly.</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Currency</Label>
                                            <select
                                                value={editFormData.currency || "USD"}
                                                onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                                                className="w-full bg-muted/30 border border-primary/10 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="USD">USD — US Dollar</option>
                                                <option value="EUR">EUR — Euro</option>
                                                <option value="GBP">GBP — British Pound</option>
                                                <option value="CAD">CAD — Canadian Dollar</option>
                                                <option value="AUD">AUD — Australian Dollar</option>
                                                <option value="JPY">JPY — Japanese Yen</option>
                                                <option value="MXN">MXN — Mexican Peso</option>
                                                <option value="BRL">BRL — Brazilian Real</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Owner Wallet <span className="text-[10px] text-muted-foreground">(Admin Override)</span></Label>
                                            <Input
                                                value={editFormData.ownerWallet || ""}
                                                onChange={(e) => setEditFormData({ ...editFormData, ownerWallet: e.target.value })}
                                                placeholder="0x..."
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Freelancer-Specific Fields */}
                                    {editFormData.industryPack === "freelancer" && (
                                        <div className="border border-primary/10 rounded-lg overflow-hidden">
                                            <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">Freelancer-Specific Fields</span>
                                                    <Badge variant="outline" className="text-[9px] h-4 bg-amber-500/10 text-amber-400 border-amber-500/20 px-1.5">Freelancer</Badge>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Synced from Surge</span>
                                            </div>
                                            <div className="px-4 py-3 space-y-4">
                                                {/* Pricing section */}
                                                <div className="border border-primary/5 rounded-md p-3 space-y-3">
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing</span>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Pricing Type</Label>
                                                        <select
                                                            value={editFormData.attributes?.pricingType || ""}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                attributes: { ...editFormData.attributes, pricingType: e.target.value }
                                                            })}
                                                            className="w-full bg-muted/30 border border-primary/10 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        >
                                                            <option value="">Select pricing type</option>
                                                            <option value="hourly">Hourly</option>
                                                            <option value="fixed">Fixed Price</option>
                                                            <option value="milestone">Milestone</option>
                                                            <option value="retainer">Retainer</option>
                                                        </select>
                                                    </div>
                                                    {editFormData.attributes?.pricingType === "hourly" && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Hourly Rate</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={editFormData.attributes?.pricingAmount ?? ""}
                                                                    onChange={(e) => setEditFormData({
                                                                        ...editFormData,
                                                                        attributes: { ...editFormData.attributes, pricingAmount: parseFloat(e.target.value) || 0 }
                                                                    })}
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Minimum Hours</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={editFormData.attributes?.minimumHours ?? ""}
                                                                    onChange={(e) => setEditFormData({
                                                                        ...editFormData,
                                                                        attributes: { ...editFormData.attributes, minimumHours: parseFloat(e.target.value) || 0 }
                                                                    })}
                                                                    placeholder="e.g., 2"
                                                                    className="h-8 text-sm"
                                                                />
                                                                <span className="text-[10px] text-muted-foreground">Minimum billable hours per session</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Service details */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Delivery Time</Label>
                                                        <Input
                                                            value={editFormData.attributes?.deliveryTime ?? ""}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                attributes: { ...editFormData.attributes, deliveryTime: e.target.value }
                                                            })}
                                                            placeholder="e.g., 5-7 days"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Revisions Included</Label>
                                                        <Input
                                                            type="number"
                                                            value={editFormData.attributes?.revisionsIncluded ?? ""}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                attributes: { ...editFormData.attributes, revisionsIncluded: parseInt(e.target.value) || 0 }
                                                            })}
                                                            placeholder="e.g., 3"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Skill Level</Label>
                                                        <select
                                                            value={editFormData.attributes?.skillLevel || ""}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                attributes: { ...editFormData.attributes, skillLevel: e.target.value }
                                                            })}
                                                            className="w-full bg-muted/30 border border-primary/10 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-8"
                                                        >
                                                            <option value="">Select skill level</option>
                                                            <option value="beginner">Beginner</option>
                                                            <option value="intermediate">Intermediate</option>
                                                            <option value="expert">Expert</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Service Category</Label>
                                                        <Input
                                                            value={editFormData.attributes?.serviceCategory ?? ""}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                attributes: { ...editFormData.attributes, serviceCategory: e.target.value }
                                                            })}
                                                            placeholder="e.g., Web Development, Graphic Design"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Deliverables list builder */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs">Deliverables</Label>
                                                        <span className="text-[10px] text-muted-foreground">{(editFormData.attributes?.deliverables || []).length} items</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="What will be delivered? (press Enter)"
                                                            className="h-8 text-sm flex-1"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                                    if (val) {
                                                                        setEditFormData({
                                                                            ...editFormData,
                                                                            attributes: {
                                                                                ...editFormData.attributes,
                                                                                deliverables: [...(editFormData.attributes?.deliverables || []), val]
                                                                            }
                                                                        });
                                                                        (e.target as HTMLInputElement).value = "";
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Button type="button" variant="outline" size="sm" className="h-8 px-2"
                                                            onClick={() => {
                                                                const input = document.getElementById("deliverable-input") as HTMLInputElement;
                                                                if (input?.value?.trim()) {
                                                                    setEditFormData({
                                                                        ...editFormData,
                                                                        attributes: {
                                                                            ...editFormData.attributes,
                                                                            deliverables: [...(editFormData.attributes?.deliverables || []), input.value.trim()]
                                                                        }
                                                                    });
                                                                    input.value = "";
                                                                }
                                                            }}>+</Button>
                                                    </div>
                                                    {(editFormData.attributes?.deliverables || []).length > 0 ? (
                                                        <div className="space-y-1">
                                                            {(editFormData.attributes?.deliverables || []).map((item: string, i: number) => (
                                                                <div key={i} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1 text-sm">
                                                                    <span>{item}</span>
                                                                    <button type="button" className="text-red-400 hover:text-red-300 text-xs" onClick={() => {
                                                                        const updated = [...(editFormData.attributes?.deliverables || [])];
                                                                        updated.splice(i, 1);
                                                                        setEditFormData({ ...editFormData, attributes: { ...editFormData.attributes, deliverables: updated } });
                                                                    }}>✕</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">No deliverables yet. Add items above.</span>}
                                                </div>

                                                {/* Requirements list builder */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs">Requirements</Label>
                                                        <span className="text-[10px] text-muted-foreground">{(editFormData.attributes?.requirements || []).length} items</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="What's needed from client? (press Enter)"
                                                            className="h-8 text-sm flex-1"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                                    if (val) {
                                                                        setEditFormData({
                                                                            ...editFormData,
                                                                            attributes: {
                                                                                ...editFormData.attributes,
                                                                                requirements: [...(editFormData.attributes?.requirements || []), val]
                                                                            }
                                                                        });
                                                                        (e.target as HTMLInputElement).value = "";
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Button type="button" variant="outline" size="sm" className="h-8 px-2"
                                                            onClick={() => { /* handled by Enter key */ }}>+</Button>
                                                    </div>
                                                    {(editFormData.attributes?.requirements || []).length > 0 ? (
                                                        <div className="space-y-1">
                                                            {(editFormData.attributes?.requirements || []).map((item: string, i: number) => (
                                                                <div key={i} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1 text-sm">
                                                                    <span>{item}</span>
                                                                    <button type="button" className="text-red-400 hover:text-red-300 text-xs" onClick={() => {
                                                                        const updated = [...(editFormData.attributes?.requirements || [])];
                                                                        updated.splice(i, 1);
                                                                        setEditFormData({ ...editFormData, attributes: { ...editFormData.attributes, requirements: updated } });
                                                                    }}>✕</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">No requirements yet. Add items above.</span>}
                                                </div>

                                                {/* Add-ons list builder */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs">Add-ons</Label>
                                                    </div>
                                                    {(editFormData.attributes?.addOns || []).length > 0 ? (
                                                        <div className="space-y-1">
                                                            {(editFormData.attributes?.addOns || []).map((item: string, i: number) => (
                                                                <div key={i} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1 text-sm">
                                                                    <span>{item}</span>
                                                                    <button type="button" className="text-red-400 hover:text-red-300 text-xs" onClick={() => {
                                                                        const updated = [...(editFormData.attributes?.addOns || [])];
                                                                        updated.splice(i, 1);
                                                                        setEditFormData({ ...editFormData, attributes: { ...editFormData.attributes, addOns: updated } });
                                                                    }}>✕</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">No add-ons yet.</span>}
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Add-on name (press Enter)"
                                                            className="h-8 text-sm flex-1"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                                    if (val) {
                                                                        setEditFormData({
                                                                            ...editFormData,
                                                                            attributes: {
                                                                                ...editFormData.attributes,
                                                                                addOns: [...(editFormData.attributes?.addOns || []), val]
                                                                            }
                                                                        });
                                                                        (e.target as HTMLInputElement).value = "";
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs px-3">+ Add</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Generic attributes for non-freelancer packs */}
                                    {editFormData.industryPack && editFormData.industryPack !== "freelancer" && editProduct?.attributes && Object.keys(editProduct.attributes as Record<string, unknown>).length > 0 && (
                                        <div className="border border-primary/10 rounded-lg overflow-hidden">
                                            <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">
                                                        {editFormData.industryPack ? `${editFormData.industryPack.charAt(0).toUpperCase() + editFormData.industryPack.slice(1)}-Specific Fields` : "Platform Attributes"}
                                                    </span>
                                                    {editFormData.industryPack && (
                                                        <Badge variant="outline" className="text-[9px] h-4 bg-amber-500/10 text-amber-400 border-amber-500/20 px-1.5 capitalize">
                                                            {editFormData.industryPack}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Synced from Surge</span>
                                            </div>
                                            <div className="px-4 py-3 grid grid-cols-2 gap-3">
                                                {Object.entries(editFormData.attributes || {}).map(([key, value]) => (
                                                    <div key={key} className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                                        </Label>
                                                        <Input
                                                            value={String(value ?? "")}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                attributes: { ...editFormData.attributes, [key]: e.target.value }
                                                            })}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Totals section */}
                                    {editProduct?.surge_id && (
                                        <div className="border border-primary/10 rounded-lg overflow-hidden">
                                            <div className="px-4 py-2.5 bg-muted/30">
                                                <span className="text-sm font-semibold">Totals</span>
                                            </div>
                                            <div className="px-4 py-3 space-y-2">
                                                {!editFormData.jurisdictionCode && (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Please set tax domain to calculate taxes</span>
                                                )}
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Price (before taxes/fees)</span>
                                                    <span>${(parseFloat(editFormData.price) || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tax</span>
                                                    <span>${((parseFloat(editFormData.price) || 0) * (parseFloat(editFormData.taxRate) || 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Processing Fee (2.50%)</span>
                                                    <span>${((parseFloat(editFormData.price) || 0) * 0.025).toFixed(2)}</span>
                                                </div>
                                                <div className="border-t border-primary/10 pt-2 flex justify-between text-sm font-semibold">
                                                    <span>Total (after taxes & fees)</span>
                                                    <span>${(
                                                        (parseFloat(editFormData.price) || 0) +
                                                        ((parseFloat(editFormData.price) || 0) * (parseFloat(editFormData.taxRate) || 0) / 100) +
                                                        ((parseFloat(editFormData.price) || 0) * 0.025)
                                                    ).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>)}
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="hover:bg-primary/5">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isEditing} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[140px]">
                                {isEditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save & Sync
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
