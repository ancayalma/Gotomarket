
"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Home,
    Users,
    Headset,
    Building2,
    Mail,
    Wrench,
    Globe,
    Calendar,
    Shield
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemedLogo } from "@/components/ThemedLogo";

import MenuItem from "../menu-items/MenuItem";
import ExpandableMenuItem, { SubMenuItemType } from "../menu-items/ExpandableMenuItem";
import HubLabel from "../menu-items/HubLabel";
import { NavItem, NavItemType } from "@/lib/navigation-defaults";
import { getIcon } from "./icon-map";

// ─── Types ───────────────────────────────────────────────
type Props = {
    navStructure: NavItem[];
    modules: any; // Used for permission checks
    dict: any;    // Translations
    features: string[]; // Enabled features
    isPartnerAdmin: boolean;
    teamRole?: string;
    serviceBadge?: number; // Count for service cases
    isImpersonating?: boolean;
    impersonatedTeamName?: string;
    titleFont?: string;
    titleFontSize?: string;
    titleFontWeight?: string;
    titleFontStyle?: string;
    itemFont?: string;
    itemFontSize?: string;
    itemFontWeight?: string;
    itemFontStyle?: string;
};

const sidebarVariants = {
    expanded: {
        width: "12.5rem",
        transition: { type: "spring", stiffness: 200, damping: 25 } as const,
    },
    collapsed: {
        width: "4.5rem",
        transition: { type: "spring", stiffness: 200, damping: 25 } as const,
    },
};

const logoVariants = {
    expanded: { opacity: 1, x: 0, display: "block" as const },
    collapsed: { opacity: 0, x: -10, transitionEnd: { display: "none" as const } },
};

const compactLogoVariants = {
    expanded: { opacity: 0, x: -10, display: "none" as const },
    collapsed: { opacity: 1, x: 0, display: "block" as const },
};

// ─── Component ───────────────────────────────────────────
const DynamicModuleMenu = ({
    navStructure,
    modules,
    dict,
    features,
    isPartnerAdmin,
    teamRole = "MEMBER",
    serviceBadge = 0,
    isImpersonating = false,
    impersonatedTeamName,
    titleFont,
    titleFontSize,
    titleFontWeight,
    titleFontStyle,
    itemFont,
    itemFontSize,
    itemFontWeight,
    itemFontStyle
}: Props) => {
    // ... hooks ...
    const [open, setOpen] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true);
        try {
            const persisted = localStorage.getItem("sidebar-open");
            if (persisted !== null) setOpen(persisted === "true");
        } catch (_) { }

        // Load fonts if they are custom
        const fontsToLoad = [titleFont, itemFont].filter(Boolean) as string[];
        if (fontsToLoad.length > 0) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            const fontQuery = fontsToLoad.map(f => f.replace(/\s+/g, "+")).join("&family=");
            link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
            document.head.appendChild(link);
        }
    }, [titleFont, itemFont]);

    const toggleSidebar = () => {
        const next = !open;
        setOpen(next);
        try { localStorage.setItem("sidebar-open", String(next)); } catch (_) { }
    };
    // ...

    // (Inside the motion.div, after logo)
    // ─── Impersonation Indicator ───
    const handleSwitchBack = async () => {
        try {
            const { switchTeam } = await import("@/actions/teams/switch-team");
            const res = await switchTeam(null);
            if (res.success) {
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
        }
    };
    // ...

    // ─── Permission Logic ───
    const hasFeature = (f?: string) => !f || features.includes("all") || features.includes(f);
    const hasModule = (n?: string) => !n || modules.find((m: any) => m.name === n && m.enabled);
    const checkRole = (minRole?: string) => {
        if (!minRole) return true;
        if (minRole === "MEMBER") return true;
        if (minRole === "ADMIN") return teamRole !== "MEMBER"; // Simplified typical check
        if (minRole === "PARTNER_ADMIN" || minRole === "PLATFORM_ADMIN") return isPartnerAdmin;
        return false;
    };

    const checkPermission = (item: NavItem) => {
        if (item.permissions) {
            if (item.permissions.module && !hasModule(item.permissions.module)) return false;
            if (item.permissions.feature && !hasFeature(item.permissions.feature)) return false;
            if (item.permissions.minRole && !checkRole(item.permissions.minRole)) return false;
        }
        return true;
    };

    const isVisible = (item: NavItem) => {
        if (item.hidden) return false;
        // If it's premium, we show it (locked) even if they don't have permission
        if (item.isPremium) return true;
        return checkPermission(item);
    };

    // ─── Active Logic ───
    const isPath = (pattern: RegExp) => pattern.test(pathname);
    const checkActive = (item: NavItem): boolean => {
        if (!item.href) return false;
        // Specialized logic for "Messages" vs "Forms"
        if (item.href === "/messages") return isPath(/^\/([a-z]{2}\/)?messages\/?$/);

        // Generic logic
        // If exact match (dashboard)
        if (item.href === "/dashboard") return pathname === "/dashboard" || pathname.endsWith("/dashboard");

        // If prefix match
        return pathname.startsWith(item.href);
    };

    // ─── Renderer ───
    const renderItem = (item: NavItem) => {
        // Force certain items to have no flyout children as per design
        if (
            item.id === "nav_contracts" ||
            item.href === "/crm/contracts" ||
            item.id === "nav_projects" ||
            item.href === "/projects" ||
            item.id === "nav_invoices" ||
            item.href === "/invoice" ||
            item.id === "nav_command" ||
            item.href === "/crm/sales-command" ||
            item.id === "nav_leads" ||
            item.href === "/crm/leads"
        ) {
            item = { ...item, children: undefined };
        }

        // Remove hidden/redundant children specifically from Admin flyout
        if (item.id === "nav_admin") {
            item = {
                ...item,
                children: item.children?.filter(child => child.id !== "sub_admin_platform")
            };
        }

        if (!isVisible(item)) return null;


        const hasAccess = checkPermission(item);
        const isLocked = item.isPremium && !hasAccess;

        if (item.type === "group") {
            // Group header + Children
            const visibleChildren = item.children?.filter(isVisible);
            if (!visibleChildren || visibleChildren.length === 0) return null;

            return (
                <React.Fragment key={item.id}>
                    <HubLabel label={item.label} isOpen={open} />
                    {item.children?.map(renderItem)}
                </React.Fragment>
            );
        }

        if (item.children && item.children.length > 0) {
            // Expandable Item
            const visibleChildren = item.children.filter(isVisible);
            if (visibleChildren.length === 0 && (!item.href || item.href === "#")) return null;

            // Map visible children to SubMenuItemType
            const subItems: SubMenuItemType[] = visibleChildren.map(child => ({
                label: child.label,
                href: child.href || "#",
                icon: child.iconName ? getIcon(child.iconName) : undefined
            }));

            // Check if any child is active to activate parent (or parent itself)
            const isActive = checkActive(item) || visibleChildren.some(child => child.href && pathname.startsWith(child.href));

            return (
                <ExpandableMenuItem
                    key={item.id}
                    href={item.href || "#"}
                    icon={getIcon(item.iconName)}
                    title={item.label}
                    isOpen={open}
                    isActive={isActive}
                    items={subItems}
                    badge={item.badge === "serviceBadge" ? serviceBadge : undefined}
                    isLocked={isLocked}
                />
            );
        }

        // Standard Item
        return (
            <MenuItem
                key={item.id}
                href={isLocked ? "#" : (item.href || "#")}
                icon={getIcon(item.iconName)}
                title={item.label}
                isOpen={open}
                isActive={checkActive(item)}
                isLocked={isLocked}
            />
        );
    };

    if (!isMounted) return null;

    return (
        <>
            <div className="hidden md:block h-screen sticky top-0 z-[100]">
                <motion.div
                    data-sidebar
                    initial={open ? "expanded" : "collapsed"}
                    animate={open ? "expanded" : "collapsed"}
                    variants={sidebarVariants}
                    style={{
                        // @ts-ignore
                        "--nav-title-font": titleFont ? `'${titleFont}', sans-serif` : "inherit",
                        "--nav-title-size": titleFontSize || "10px",
                        "--nav-title-weight": titleFontWeight || "900",
                        "--nav-title-style": titleFontStyle || "normal",
                        "--nav-item-font": itemFont ? `'${itemFont}', sans-serif` : "inherit",
                        "--nav-item-size": itemFontSize || "18px",
                        "--nav-item-weight": itemFontWeight || "900",
                        "--nav-item-style": itemFontStyle || "normal",
                    }}
                    className={cn(
                        "relative h-full flex flex-col border-r border-primary/20 shadow-xl group",
                        "bg-gradient-to-b from-background/95 via-background/90 to-background/95",
                        "backdrop-blur-xl"
                    )}
                >
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-50" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                    </div>

                    {/* ─── Logo ─── */}
                    <div className="flex items-center justify-center h-16 relative shrink-0 overflow-hidden">
                        <motion.div variants={logoVariants} className="absolute left-3">
                            <ThemedLogo variant="wide" className="h-9 w-auto object-contain" />
                        </motion.div>
                        <motion.div variants={compactLogoVariants} className="absolute">
                            <ThemedLogo variant="compact" className="h-8 w-auto object-contain" />
                        </motion.div>
                    </div>

                    {/* ─── Impersonation Indicator ─── */}
                    {isImpersonating && (
                        <div className={cn(
                            "mx-2 mb-2 p-2 rounded-xl border border-amber-500/20 bg-amber-500/5 transition-colors overflow-hidden shrink-0",
                            !open ? "px-1" : "px-2"
                        )}>
                            <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                {open && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider truncate">God Mode</p>
                                        <p className="text-[9px] text-muted-foreground truncate">{impersonatedTeamName}</p>
                                    </div>
                                )}
                            </div>
                            {open && (
                                <button
                                    onClick={handleSwitchBack}
                                    className="mt-2 w-full py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[9px] font-bold uppercase transition-colors"
                                >
                                    Return to Home
                                </button>
                            )}
                        </div>
                    )}

                    {/* ─── Toggle Button ─── */}
                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "absolute -right-3 top-16 z-[100]",
                            "h-6 w-6 rounded-full flex items-center justify-center",
                            "bg-primary text-primary-foreground shadow-md transition-colors duration-200",
                            "opacity-0 group-hover:opacity-100",
                            "hover:scale-110 focus:outline-none ring-2 ring-background"
                        )}
                    >
                        {open ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>

                    {/* ─── Content ─── */}
                    <div
                        className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar"
                    >
                        <div className="flex flex-col gap-0.5 px-1.5">
                            {navStructure.map(renderItem)}
                        </div>
                    </div>

                    {/* ─── Footer ─── */}
                    <motion.div
                        animate={{ opacity: open ? 1 : 0 }}
                        className="p-3 flex justify-center shrink-0"
                    >
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                            v{process.env.NEXT_PUBLIC_APP_VERSION}
                        </span>
                    </motion.div>

                </motion.div>
            </div>

            {/* ═══════════════ MOBILE BOTTOM NAV ═══════════════ */}
            <div className="md:hidden fixed bottom-1 left-0 right-0 z-[100] px-4">
                <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-row items-center justify-between px-2 py-1 gap-1 shadow-2xl">
                    {/* Render first 5 visible hub items or root items */}
                    {navStructure
                        .flatMap(item => (item.type === 'group' ? (item.children || []) : [item]))
                        .filter(isVisible)
                        .filter(item => item.href && item.href !== '#')
                        .slice(0, 5)
                        .map((item) => {
                            const hasAccess = checkPermission(item);
                            const isLocked = item.isPremium && !hasAccess;

                            return (
                                <MenuItem
                                    key={item.id}
                                    href={isLocked ? "#" : (item.href || "#")}
                                    icon={getIcon(item.iconName)}
                                    title={item.label}
                                    isOpen={false}
                                    isActive={pathname.startsWith(item.href || "")}
                                    isMobile
                                    isLocked={isLocked}
                                />
                            );
                        })}

                    {/* Always show settings link if Admin */}
                    {isPartnerAdmin && !navStructure.some(i => i.href === "/partners") && (
                        <MenuItem href="/partners" icon={Globe} title="Platform" isOpen={false} isActive={pathname.includes("/partners")} isMobile />
                    )}
                </div>
            </div>

        </>
    );
};

export default DynamicModuleMenu;
