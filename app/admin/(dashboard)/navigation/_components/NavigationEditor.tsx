"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "react-hot-toast";
import { Save, RotateCcw, Plus, Layout, ListTree, Monitor, Type, Bold, Italic, TextQuote, ChevronDown } from "lucide-react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

import { NavItem, DEFAULT_NAV_STRUCTURE } from "@/lib/navigation-defaults";
import { SortableNavItem } from "./SortableNavItem";
import { NavItemDialog } from "./NavItemDialog";
import { updateTeamNavigationConfig, updateUserNavigationConfig, resetNavigationConfig } from "@/actions/navigation/update-navigation-config";
import DynamicModuleMenu from "../../../../(routes)/components/dynamic-navigation/DynamicModuleMenu";
import { cn } from "@/lib/utils";

interface Props {
    initialStructure: NavItem[];
    initialTitleFont?: string;
    initialTitleFontSize?: string;
    initialTitleFontWeight?: string;
    initialTitleFontStyle?: string;
    initialItemFont?: string;
    initialItemFontSize?: string;
    initialItemFontWeight?: string;
    initialItemFontStyle?: string;
    modules: any;
    dict: any;
    features: string[];
    isPartnerAdmin: boolean;
    isAdmin: boolean;
    teamRole: string;
}

const AVAILABLE_FONTS = [
    "Inter",
    "Roboto",
    "Montserrat",
    "Poppins",
    "Outfit",
    "Geist",
    "Open Sans",
    "Lato",
    "Lexend",
    "Ubuntu",
    "Plus Jakarta Sans",
    "Public Sans"
];

export function NavigationEditor({
    initialStructure,
    initialTitleFont,
    initialTitleFontSize,
    initialTitleFontWeight,
    initialTitleFontStyle,
    initialItemFont,
    initialItemFontSize,
    initialItemFontWeight,
    initialItemFontStyle,
    modules,
    dict,
    features,
    isPartnerAdmin,
    isAdmin,
    teamRole
}: Props) {
    // Helper to merge new defaults into stored config and ensure no duplicates
    const mergeDefaultItems = (current: NavItem[], defaults: NavItem[]): NavItem[] => {
        try {
            const merged = JSON.parse(JSON.stringify(current));
            const existingIds = new Set<string>();
            const idToNode = new Map<string, NavItem>();

            const register = (item: NavItem) => {
                existingIds.add(item.id);
                idToNode.set(item.id, item);
                if (item.children) item.children.forEach(register);
            };

            const scan = (items: NavItem[]) => {
                items.forEach(item => {
                    existingIds.add(item.id);
                    idToNode.set(item.id, item);
                    if (item.children) scan(item.children);
                });
            };
            scan(merged);

            const scanDefaults = (items: NavItem[], parentId: string | null) => {
                items.forEach(dItem => {
                    if (!existingIds.has(dItem.id)) {
                        // Create a clean copy without children first, to avoid double-adding children later during recursion
                        const newItem = { ...dItem, children: [] };
                        if (parentId === null) {
                            merged.push(newItem);
                            register(newItem);
                        } else {
                            const parent = idToNode.get(parentId);
                            if (parent) {
                                parent.children = parent.children || [];
                                parent.children.push(newItem);
                                register(newItem);
                            }
                        }
                    }

                    if (dItem.children) {
                        scanDefaults(dItem.children, dItem.id);
                    }
                });
            };
            scanDefaults(defaults, null);
            return merged;
        } catch (e) {
            return defaults;
        }
    };

    // Global items deduplication helper (for safety)
    const deduplicateStructure = (items: NavItem[]): NavItem[] => {
        const seen = new Set<string>();
        const process = (list: NavItem[]): NavItem[] => {
            const result: NavItem[] = [];
            list.forEach(item => {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    const processedItem = { ...item };
                    if (item.children) {
                        processedItem.children = process(item.children);
                    }
                    result.push(processedItem);
                }
            });
            return result;
        };
        return process(items);
    };

    const [structure, setStructure] = useState<NavItem[]>(() =>
        deduplicateStructure(mergeDefaultItems(initialStructure || DEFAULT_NAV_STRUCTURE, DEFAULT_NAV_STRUCTURE))
    );
    const [titleFont, setTitleFont] = useState(initialTitleFont || "Montserrat");
    const [titleFontSize, setTitleFontSize] = useState(initialTitleFontSize || "10px");
    const [titleFontWeight, setTitleFontWeight] = useState(initialTitleFontWeight || "900");
    const [titleFontStyle, setTitleFontStyle] = useState(initialTitleFontStyle || "normal");

    const [itemFont, setItemFont] = useState(initialItemFont || "Inter");
    const [itemFontSize, setItemFontSize] = useState(initialItemFontSize || "18px");
    const [itemFontWeight, setItemFontWeight] = useState(initialItemFontWeight || "900");
    const [itemFontStyle, setItemFontStyle] = useState(initialItemFontStyle || "normal");
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [scope, setScope] = useState<"USER" | "TEAM">(isAdmin ? "TEAM" : "USER");
    const [isTypographyCollapsed, setIsTypographyCollapsed] = useState(false);

    // Confirmation states
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    // Preload all fonts for the dropdowns
    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        const fontQuery = AVAILABLE_FONTS.map(f => f.replace(/\s+/g, "+")).join("&family=");
        link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
        document.head.appendChild(link);
    }, []);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NavItem | null>(null);
    const [activeParentId, setActiveParentId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ─── Tree Helpers ───
    const findAndReplace = (items: NavItem[], id: string, newData: NavItem): NavItem[] => {
        return items.map(item => {
            if (item.id === id) return { ...item, ...newData };
            if (item.children) return { ...item, children: findAndReplace(item.children, id, newData) };
            return item;
        });
    };

    const findAndDelete = (items: NavItem[], id: string): NavItem[] => {
        return items
            .filter(item => item.id !== id)
            .map(item => ({
                ...item,
                children: item.children ? findAndDelete(item.children, id) : undefined
            }));
    };

    const findAndAddChild = (items: NavItem[], parentId: string, newItem: NavItem): NavItem[] => {
        return items.map(item => {
            if (item.id === parentId) {
                return {
                    ...item,
                    children: [...(item.children || []), newItem]
                };
            }
            if (item.children) {
                return {
                    ...item,
                    children: findAndAddChild(item.children, parentId, newItem)
                };
            }
            return item;
        });
    };

    // ─── Actions ───
    const handleEdit = (item: NavItem) => {
        setEditingItem(item);
        setActiveParentId(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            setStructure(prev => findAndDelete(prev, deleteConfirmId));
            toast.success("Item removed locally");
            setDeleteConfirmId(null);
        }
    };

    const handleToggleVisibility = (id: string) => {
        const toggleVisibilityInTree = (items: NavItem[]): NavItem[] => {
            return items.map(item => {
                if (item.id === id) {
                    return { ...item, hidden: !item.hidden };
                }
                if (item.children) {
                    return { ...item, children: toggleVisibilityInTree(item.children) };
                }
                return item;
            });
        };
        setStructure(prev => toggleVisibilityInTree(prev));
    };

    const handleAddChild = (parentId: string) => {
        setEditingItem(null);
        setActiveParentId(parentId);
        setIsDialogOpen(true);
    };

    const handleAddNewSection = () => {
        setEditingItem(null);
        setActiveParentId(null);
        setIsDialogOpen(true);
    };

    const onDialogSave = (data: NavItem) => {
        if (editingItem) {
            // Update
            setStructure(prev => findAndReplace(prev, editingItem.id, data));
            toast.success("Item updated");
        } else if (activeParentId) {
            // Add Child
            const newItem = { ...data, id: `nav_${Math.random().toString(36).substr(2, 9)}` };
            setStructure(prev => findAndAddChild(prev, activeParentId, newItem));
            toast.success("Sub-item added");
        } else {
            // Add Root
            const newItem = { ...data, id: `nav_${Math.random().toString(36).substr(2, 9)}` };
            setStructure(prev => [...prev, newItem]);
            toast.success("New section added");
        }
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                if (scope === "TEAM") {
                    await updateTeamNavigationConfig(
                        structure,
                        titleFont,
                        itemFont,
                        titleFontSize,
                        titleFontWeight,
                        titleFontStyle,
                        itemFontSize,
                        itemFontWeight,
                        itemFontStyle
                    );
                } else {
                    await updateUserNavigationConfig(
                        structure,
                        titleFont,
                        itemFont,
                        titleFontSize,
                        titleFontWeight,
                        titleFontStyle,
                        itemFontSize,
                        itemFontWeight,
                        itemFontStyle
                    );
                }
                toast.success(`Navigation saved for ${scope.toLowerCase()}`);
            } catch (error: any) {
                toast.error(error.message || "Failed to save");
            }
        });
    };

    const handleReset = () => {
        setIsResetConfirmOpen(true);
    };

    const confirmReset = () => {
        startTransition(async () => {
            try {
                await resetNavigationConfig(scope);
                setStructure(DEFAULT_NAV_STRUCTURE);
                setTitleFont("Montserrat");
                setTitleFontSize("10px");
                setTitleFontWeight("900");
                setTitleFontStyle("normal");
                setItemFont("Inter");
                setItemFontSize("18px");
                setItemFontWeight("900");
                setItemFontStyle("normal");
                toast.success(`${scope} navigation reset`);
                setIsResetConfirmOpen(false);
            } catch (error: any) {
                toast.error("Failed to reset");
            }
        });
    };

    // Flatten the structure for DnD
    const flatItems = React.useMemo(() => {
        const flattened: (NavItem & { depth: number; parentId: string | null })[] = [];

        const flattenRecursive = (items: NavItem[], depth: number, parentId: string | null) => {
            items.forEach(item => {
                flattened.push({ ...item, depth, parentId });
                if (item.children) {
                    flattenRecursive(item.children, depth + 1, item.id);
                }
            });
        };

        flattenRecursive(structure, 0, null);
        return flattened;
    }, [structure]);

    const itemsIds = React.useMemo(() => flatItems.map(i => i.id), [flatItems]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;
        if (active.id === over.id) return;

        const oldIndex = flatItems.findIndex(i => i.id === active.id);
        const newIndex = flatItems.findIndex(i => i.id === over.id);

        const rebuiltStructure: NavItem[] = [];

        let currentGroup: NavItem | null = null;
        let lastDepth1Item: NavItem | null = null;

        const newFlatOrder = arrayMove(flatItems, oldIndex, newIndex);

        newFlatOrder.forEach((item) => {
            const { depth: oldDepth, parentId: oldParentId, ...cleanItemProps } = item;
            // Ensure children array exists and is initially empty for rebuilt structure
            const cleanItem = { ...cleanItemProps, children: [] };

            // Logic:
            // Group/Separator -> Depth 0
            if (item.type === "group" || item.type === "separator") {
                rebuiltStructure.push(cleanItem);
                currentGroup = cleanItem;
                lastDepth1Item = null; // Reset depth 1 context
            } else {
                // Determine hierarchy
                // If it was a sub-item (Depth >= 2) and we have a valid parent item
                if (oldDepth >= 2 && lastDepth1Item) {
                    lastDepth1Item.children!.push(cleanItem);
                } else {
                    // Depth 1 (or fallback for orphaned sub-items)
                    if (currentGroup) {
                        currentGroup.children!.push(cleanItem);
                    } else {
                        // Orphan at root
                        rebuiltStructure.push(cleanItem);
                    }
                    // Updates lastDepth1Item context for subsequent items
                    lastDepth1Item = cleanItem;
                }
            }
        });

        setStructure(deduplicateStructure(rebuiltStructure));
    };

    // ─── Render ───
    return (
        <div className="flex flex-col gap-6 h-full font-sans">
            {/* Merged Header & Actions Card */}
            <div className="flex flex-col gap-6 p-6 rounded-3xl bg-[#18181b]/50 border border-primary/20 backdrop-blur-xl shadow-2xl">
                {/* Header section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-inner">
                            <Layout className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Navigation Manager</h1>
                            <p className="text-sm text-muted-foreground font-medium">Customize sidebar categories, items, and typography</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {isAdmin && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">Editor Scope</label>
                                <select
                                    value={scope}
                                    onChange={(e) => setScope(e.target.value as any)}
                                    className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-primary font-bold focus:outline-none focus:ring-2 ring-primary/50 cursor-pointer hover:bg-primary/10 transition-all"
                                >
                                    <option value="TEAM" className="bg-[#18181b]">Team Default (Global)</option>
                                    <option value="USER" className="bg-[#18181b]">Personal Override</option>
                                </select>
                            </div>
                        )}

                        {!isAdmin && (
                            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 text-[10px] text-primary font-black uppercase tracking-widest shadow-inner">
                                Personal View
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-auto">
                            <button
                                onClick={handleReset}
                                disabled={isPending}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/5 hover:bg-red-500/10 text-primary/70 hover:text-red-400 border border-primary/20 transition-all text-xs font-black uppercase tracking-wider"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> {isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                {/* Typography controls integrated into the main card */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => setIsTypographyCollapsed(!isTypographyCollapsed)}
                            className="flex items-center gap-3 group/typo cursor-pointer text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 group-hover/typo:bg-primary/20 transition-all">
                                <Type className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Typography & Branding</h2>
                                    <ChevronDown className={cn("w-5 h-5 text-amber-500 transition-transform duration-300", isTypographyCollapsed && "-rotate-90")} />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-bold">Premium font customization for your sidebar</p>
                            </div>
                        </button>

                        {/* View Toggle */}
                        <div className="flex bg-primary/5 rounded-xl p-1 border border-primary/20 shadow-inner">
                            <button
                                onClick={() => setViewMode("edit")}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                    viewMode === "edit" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
                                )}
                            >
                                <ListTree className="w-3.5 h-3.5" /> Editor
                            </button>
                            <button
                                onClick={() => setViewMode("preview")}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                    viewMode === "preview" ? "bg-primary text-primary-foreground shadow-lg" : "text-primary/60 hover:text-primary"
                                )}
                            >
                                <Monitor className="w-3.5 h-3.5" /> Live Preview
                            </button>
                        </div>
                    </div>

                    <div className={cn(
                        "grid grid-cols-1 xl:grid-cols-2 gap-6 transition-all duration-300 overflow-hidden",
                        isTypographyCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[1000px] opacity-100"
                    )}>
                        {/* Menu Titles (Group Labels) */}
                        <div className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group/card hover:bg-white/[0.07] transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/10 shadow-inner">
                                        <TextQuote className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[2px] text-primary/70">Menu Category Labels</h3>
                                </div>
                                <div className="flex flex-col items-end pr-2">
                                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-40 mb-1">Preview</span>
                                    <span
                                        className="text-2xl font-black bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent leading-tight pr-4"
                                        style={{
                                            fontFamily: titleFont,
                                            fontWeight: titleFontWeight,
                                            fontStyle: titleFontStyle
                                        }}
                                    >
                                        {titleFont}
                                    </span>
                                </div>
                            </div>

                            {/* Massive background text */}
                            <div
                                className="absolute -bottom-8 -right-8 text-8xl font-black text-white/[0.03] select-none pointer-events-none transition-all duration-700 blur-[3px] group-hover/card:blur-[1px] group-hover/card:text-white/[0.06] uppercase italic"
                                style={{ fontFamily: titleFont }}
                            >
                                {titleFont}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-wider font-black text-muted-foreground ml-1">Font Family</label>
                                    <select
                                        value={titleFont}
                                        onChange={(e) => setTitleFont(e.target.value)}
                                        className="w-full bg-[#0c0c0e]/80 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 ring-primary/50 transition-all font-sans appearance-none cursor-pointer hover:border-primary/40"
                                        style={{ fontFamily: titleFont }}
                                    >
                                        {AVAILABLE_FONTS.map(font => (
                                            <option key={font} value={font} className="bg-[#18181b]" style={{ fontFamily: font }}>{font}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-wider font-black text-muted-foreground ml-1">Font Size</label>
                                    <select
                                        value={titleFontSize}
                                        onChange={(e) => setTitleFontSize(e.target.value)}
                                        className="w-full bg-[#0c0c0e]/80 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 ring-primary/50 transition-all cursor-pointer hover:border-primary/40"
                                    >
                                        {["8px", "9px", "10px", "11px", "12px", "13px"].map(size => (
                                            <option key={size} value={size} className="bg-[#18181b]">{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 relative z-10">
                                <button
                                    onClick={() => setTitleFontWeight(titleFontWeight === "900" ? "400" : "900")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 transition-all text-[10px] font-black uppercase tracking-widest",
                                        titleFontWeight === "900" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-black/20 text-muted-foreground hover:bg-white/5"
                                    )}
                                >
                                    <Bold className="w-3 h-3" /> Bold
                                </button>
                                <button
                                    onClick={() => setTitleFontStyle(titleFontStyle === "italic" ? "normal" : "italic")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 transition-all text-[10px] font-black uppercase tracking-widest",
                                        titleFontStyle === "italic" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-black/20 text-muted-foreground hover:bg-white/5"
                                    )}
                                >
                                    <Italic className="w-3 h-3" /> Italic
                                </button>
                            </div>
                        </div>

                        {/* Navigation Items */}
                        <div className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group/card hover:bg-white/[0.07] transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/10 shadow-inner">
                                        <Layout className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[2px] text-primary/70">Navigation Items</h3>
                                </div>
                                <div className="flex flex-col items-end pr-2">
                                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-40 mb-1">Preview</span>
                                    <span
                                        className="text-2xl font-black bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent leading-tight pr-4"
                                        style={{
                                            fontFamily: itemFont,
                                            fontWeight: itemFontWeight,
                                            fontStyle: itemFontStyle
                                        }}
                                    >
                                        {itemFont}
                                    </span>
                                </div>
                            </div>

                            {/* Massive background text */}
                            <div
                                className="absolute -bottom-8 -right-8 text-8xl font-black text-white/[0.03] select-none pointer-events-none transition-all duration-700 blur-[3px] group-hover/card:blur-[1px] group-hover/card:text-white/[0.06] uppercase italic"
                                style={{ fontFamily: itemFont }}
                            >
                                {itemFont}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-wider font-black text-muted-foreground ml-1">Font Family</label>
                                    <select
                                        value={itemFont}
                                        onChange={(e) => setItemFont(e.target.value)}
                                        className="w-full bg-[#0c0c0e]/80 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 ring-primary/50 transition-all font-sans appearance-none cursor-pointer hover:border-primary/40"
                                        style={{ fontFamily: itemFont }}
                                    >
                                        {AVAILABLE_FONTS.map(font => (
                                            <option key={font} value={font} className="bg-[#18181b]" style={{ fontFamily: font }}>{font}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-wider font-black text-muted-foreground ml-1">Font Size</label>
                                    <select
                                        value={itemFontSize}
                                        onChange={(e) => setItemFontSize(e.target.value)}
                                        className="w-full bg-[#0c0c0e]/80 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 ring-primary/50 transition-all cursor-pointer hover:border-primary/40"
                                    >
                                        {["12px", "14px", "16px", "18px", "20px", "22px"].map(size => (
                                            <option key={size} value={size} className="bg-[#18181b]">{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 relative z-10">
                                <button
                                    onClick={() => setItemFontWeight(itemFontWeight === "900" ? "400" : "900")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 transition-all text-[10px] font-black uppercase tracking-widest",
                                        itemFontWeight === "900" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-black/20 text-muted-foreground hover:bg-white/5"
                                    )}
                                >
                                    <Bold className="w-3 h-3" /> Bold
                                </button>
                                <button
                                    onClick={() => setItemFontStyle(itemFontStyle === "italic" ? "normal" : "italic")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 transition-all text-[10px] font-black uppercase tracking-widest",
                                        itemFontStyle === "italic" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-black/20 text-muted-foreground hover:bg-white/5"
                                    )}
                                >
                                    <Italic className="w-3 h-3" /> Italic
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tree Content Area */}
            <div className="flex-1 min-h-0 flex gap-6 overflow-hidden mt-2">
                <div className={cn(
                    "flex-1 overflow-y-auto p-2 custom-scrollbar transition-all duration-300",
                    viewMode === "preview" && "opacity-0 scale-95 pointer-events-none"
                )}>
                    <div className="max-w-4xl mx-auto space-y-4 pb-20">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={itemsIds}
                                strategy={verticalListSortingStrategy}
                            >
                                <div
                                    className="space-y-2 p-1"
                                    style={{
                                        // @ts-ignore
                                        "--nav-title-font": titleFont || "inherit",
                                        "--nav-title-size": titleFontSize || "10px",
                                        "--nav-title-weight": titleFontWeight || "900",
                                        "--nav-title-style": titleFontStyle || "normal",
                                        "--nav-item-font": itemFont || "inherit",
                                        "--nav-item-size": itemFontSize || "18px",
                                        "--nav-item-weight": itemFontWeight || "900",
                                        "--nav-item-style": itemFontStyle || "normal",
                                    }}
                                >
                                    {flatItems.map((item) => (
                                        <SortableNavItem
                                            key={item.id}
                                            item={item}
                                            depth={item.depth}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleVisibility={handleToggleVisibility}
                                            onAddChild={handleAddChild}
                                        />
                                    ))}
                                </div>
                            </SortableContext>

                            <DragOverlay>
                                {activeId ? (
                                    <div className="w-full opacity-80 backdrop-blur-md">
                                        <SortableNavItem item={flatItems.find(i => i.id === activeId)!} />
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>

                        <button
                            onClick={handleAddNewSection}
                            className="w-full py-6 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary/60 hover:text-primary transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest"
                        >
                            <Plus className="w-5 h-5" /> Add New Section
                        </button>
                    </div>
                </div>

                {/* NavItem Dialog */}
                <NavItemDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={onDialogSave}
                    item={editingItem}
                />

                {/* Live Preview Persistent Sidebar */}
                {viewMode === "preview" && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="relative w-full max-w-6xl h-full bg-[#18181b] rounded-[40px] border border-primary/20 shadow-2xl overflow-hidden flex">
                            <div className="w-[12.5rem] bg-black/40 border-r border-primary/10">
                                <DynamicModuleMenu
                                    navStructure={structure}
                                    titleFont={titleFont}
                                    titleFontSize={titleFontSize}
                                    titleFontWeight={titleFontWeight}
                                    titleFontStyle={titleFontStyle}
                                    itemFont={itemFont}
                                    itemFontSize={itemFontSize}
                                    itemFontWeight={itemFontWeight}
                                    itemFontStyle={itemFontStyle}
                                    modules={modules}
                                    dict={dict}
                                    features={features}
                                    isPartnerAdmin={isPartnerAdmin}
                                    teamRole={teamRole}
                                />
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                    <div className="grid grid-cols-10 h-full w-full">
                                        {Array.from({ length: 100 }).map((_, i) => (
                                            <div key={i} className="border border-white/[0.1]" />
                                        ))}
                                    </div>
                                </div>

                                <Monitor className="w-24 h-24 text-primary/20 mb-8 animate-pulse" />
                                <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-[4px]">Live Sidebar Preview</h2>
                                <p className="text-muted-foreground max-w-lg text-sm leading-relaxed font-medium">
                                    Witness your customizations in real-time. This is exactly how the sidebar will manifest for your users.
                                    Toggle back to the editor to refine further.
                                </p>
                                <button
                                    onClick={() => setViewMode("edit")}
                                    className="mt-10 px-8 py-3 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary font-black uppercase tracking-widest border border-primary/20 transition-all shadow-xl shadow-primary/5"
                                >
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modals */}
                <ConfirmModal
                    isOpen={!!deleteConfirmId}
                    onClose={() => setDeleteConfirmId(null)}
                    onConfirm={confirmDelete}
                    title="Remove Item?"
                    description="This will permanently remove this item and all its children from your navigation configuration."
                />

                <ConfirmModal
                    isOpen={isResetConfirmOpen}
                    onClose={() => setIsResetConfirmOpen(false)}
                    onConfirm={confirmReset}
                    title="Reset Navigation?"
                    description={`This will erase all your custom categories and font choices, and restore the ${scope.toLowerCase()} navigation to its system defaults.`}
                />
            </div>
        </div>
    );
}
