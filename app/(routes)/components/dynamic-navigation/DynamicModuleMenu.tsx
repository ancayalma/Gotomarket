
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
    Shield,
    Sparkles,
    CreditCard,
    Eye,
    EyeOff
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemedLogo } from "@/components/ThemedLogo";

import MenuItem from "../menu-items/MenuItem";
import ExpandableMenuItem, { SubMenuItemType } from "../menu-items/ExpandableMenuItem";
import HubLabel from "../menu-items/HubLabel";
import { NavItem, NavItemType } from "@/lib/navigation-defaults";
import { getIcon } from "./icon-map";
import { BillingModal } from "@/components/modals/BillingModal";
import { Button } from "@/components/ui/button";

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
    planSlug?: string;
    titleFont?: string;
    titleFontSize?: string;
    titleFontWeight?: string;
    titleFontStyle?: string;
    itemFont?: string;
    itemFontSize?: string;
    itemFontWeight?: string;
    itemFontStyle?: string;
    impersonationContext?: string;
};

const sidebarVariants = {
    expanded: {
        width: "13rem",
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
    planSlug = "FREE",
    titleFont,
    titleFontSize,
    titleFontWeight,
    titleFontStyle,
    itemFont,
    itemFontSize,
    itemFontWeight,
    itemFontStyle,
    impersonationContext
}: Props) => {
    // ... hooks ...
    const [open, setOpen] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [isBillingOpen, setIsBillingOpen] = useState(false);
    const pathname = usePathname();

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

    const [showAllModules, setShowAllModules] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const persisted = localStorage.getItem("sidebar-open");
            if (persisted !== null) setOpen(persisted === "true");
            
            const persistedShowAll = localStorage.getItem("sidebar-show-all");
            if (persistedShowAll !== null) setShowAllModules(persistedShowAll === "true");
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

    const toggleShowAll = () => {
        const next = !showAllModules;
        setShowAllModules(next);
        try { localStorage.setItem("sidebar-show-all", String(next)); } catch (_) { }
    };

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
        if (showAllModules) return true;
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

        const isLocked = !checkPermission(item);

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
                    // Kept for Framer Motion typings, removed inline CSS vars because they are now injected via global root logic in SideBar
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
                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider truncate">
                                            {impersonationContext === "COMPANY_MODE" ? "Company Mode" : impersonationContext === "DEPARTMENT_MODE" ? "Department Mode" : "God Mode"}
                                        </p>
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
                    <div className="mt-auto px-2 pb-4 space-y-2">
                        {(planSlug === "STARTER" || planSlug === "FREE" || planSlug === "GROWTH" || planSlug === "INDIVIDUAL_BASIC") && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                    "flex flex-col gap-1",
                                    !open ? "items-center" : ""
                                )}
                            >
                                <Button
                                    onClick={() => setIsBillingOpen(true)}
                                    variant="ghost"
                                    className={cn(
                                        "w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all font-black uppercase italic tracking-tighter shadow-lg shadow-primary/5",
                                        !open ? "p-0 h-10 w-10 rounded-xl" : "h-11 justify-start px-4 text-xs"
                                    )}
                                >
                                    <Sparkles className={cn("w-4 h-4", open ? "mr-2" : "")} />
                                    {open && "Upgrade"}
                                </Button>
                            </motion.div>
                        )}

                        <motion.div
                            animate={{ opacity: open ? 1 : 0 }}
                            className="flex justify-center shrink-0 mt-2"
                        >
                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                                v{process.env.NEXT_PUBLIC_APP_VERSION}
                            </span>
                        </motion.div>

                        <motion.div className="flex justify-center shrink-0 pt-2 border-t border-border/10">
                            <button
                                onClick={toggleShowAll}
                                className={cn(
                                    "flex flex-col items-center justify-center p-1.5 transition-colors gap-1",
                                    "text-muted-foreground hover:text-foreground"
                                )}
                                title={showAllModules ? "Hide locked modules" : "Show all modules"}
                            >
                                {showAllModules ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {open && (
                                    <span className="text-[8px] uppercase tracking-widest font-semibold opacity-70">
                                        {showAllModules ? "Hide Locked" : "Show All"}
                                    </span>
                                )}
                            </button>
                        </motion.div>
                    </div>

                </motion.div>
            </div>

            {/* ═══════════════ MODALS ═══════════════ */}
            <BillingModal
                isOpen={isBillingOpen}
                onClose={() => setIsBillingOpen(false)}
            />

            {/* ═══════════════ MOBILE BOTTOM NAV ═══════════════ */}
            {(() => {
                const flatItems = navStructure
                    .flatMap(item => (item.type === 'group' ? (item.children || []) : [item]))
                    .filter(isVisible)
                    .filter(item => item.href && item.href !== '#');

                // Find the active item that has children (popout sub-items)
                const activeParentWithChildren = flatItems.find(item =>
                    item.children && item.children.length > 0 && pathname.startsWith(item.href || "")
                );

                return (
                    <>
                        {/* Layer 2 — Dynamic sub-nav from popout children */}
                        {activeParentWithChildren && activeParentWithChildren.children && (
                            <div className="md:hidden fixed bottom-[52px] left-0 right-0 z-[90]">
                                <div className="bg-background/80 backdrop-blur-xl border-t border-white/10 rounded-t-2xl flex flex-row items-center gap-1 p-1 overflow-x-auto no-scrollbar shadow-2xl">
                                    {activeParentWithChildren.children.filter(isVisible).map((child) => {
                                        const childHref = child.href || "#";
                                        const isChildActive = childHref.includes("?")
                                            ? pathname + window.location.search === childHref
                                            : pathname.startsWith(childHref);
                                        return (
                                            <a
                                                key={child.id}
                                                href={childHref}
                                                className={cn(
                                                    "flex flex-col items-center justify-center min-w-[48px] py-1.5 px-2 rounded-xl transition-colors duration-200 gap-0.5 shrink-0 relative",
                                                    isChildActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary"
                                                )}
                                            >
                                                {child.iconName && React.createElement(getIcon(child.iconName), { className: "w-4 h-4" })}
                                                <span className="uppercase tracking-wider truncate max-w-[56px]"
                                                    style={{
                                                        fontFamily: 'var(--nav-item-font)',
                                                        fontSize: 'calc(var(--nav-item-size) * 0.5)',
                                                        fontWeight: 'var(--nav-item-weight)',
                                                        fontStyle: 'var(--nav-item-style)',
                                                        lineHeight: '1.2'
                                                    }}>
                                                    {child.label.split(' ')[0]}
                                                </span>
                                                {isChildActive && (
                                                    <div className="absolute top-0 w-6 h-0.5 bg-primary rounded-b-full" />
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Layer 1 — Primary nav */}
                        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100]">
                            <div className="bg-background/80 backdrop-blur-xl border-t border-white/10 rounded-t-2xl flex flex-row items-center px-2 py-1 gap-1 shadow-2xl overflow-x-auto no-scrollbar">
                                {flatItems.map((item) => {
                                    const hasSubNav = !!(item.children && item.children.length > 0);

                                    return (
                                        <MenuItem
                                            key={item.id}
                                            href={item.href || "#"}
                                            icon={getIcon(item.iconName)}
                                            title={item.label}
                                            isOpen={false}
                                            isActive={pathname.startsWith(item.href || "")}
                                            isMobile
                                            hasSubNav={hasSubNav}
                                        />
                                    );
                                })}

                                {/* Always show settings link if Admin */}
                                {isPartnerAdmin && !navStructure.some(i => i.href === "/platform") && (
                                    <MenuItem href="/platform" icon={Globe} title="Platform" isOpen={false} isActive={pathname.includes("/platform")} isMobile />
                                )}
                            </div>
                        </div>
                    </>
                );
            })()}

        </>
    );
};

export default DynamicModuleMenu;
