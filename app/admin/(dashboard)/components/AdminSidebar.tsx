
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Package,
    ChevronLeft,
    ChevronRight,
    Mail,
    MessageSquare,
    Bot,
    Building2,
    Shield,
    Database,
    Layout,
    Zap,
    Receipt,
    BarChart,
    Key,
} from "lucide-react";

interface AdminSidebarProps {
    showModules?: boolean;
}

export default function AdminSidebar({ showModules = false }: AdminSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("admin-sidebar-collapsed");
        if (stored) {
            setIsCollapsed(stored === "true");
        }
    }, []);

    // Dispatch event when mobile expansion changes
    useEffect(() => {
        const event = new CustomEvent('crm-layer2-change', { detail: { expanded: isMobileExpanded } });
        window.dispatchEvent(event);
    }, [isMobileExpanded]);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("admin-sidebar-collapsed", String(newState));
    };

    const navItems = [
        { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
        { label: "Object Manager", href: "/admin/objects", icon: Database },
        { label: "Email Settings", href: "/admin/settings", icon: Mail },
        { label: "Brand Identity", href: "/admin/brand", icon: Building2 },
        { label: "SMS Config", href: "/admin/sms-config", icon: MessageSquare },
        { label: "AI Settings", href: "/admin/ai-settings", icon: Bot },
        { label: "AI Usage", href: "/admin/ai-usage", icon: BarChart },
        { label: "Navigation", href: "/admin/navigation", icon: Layout },
        { label: "Integrations", href: "/admin/integrations", icon: Zap },
        { label: "Billing", href: "/admin/billing", icon: Receipt },
        { label: "API & Webhooks", href: "/admin/api-keys", icon: Key },
        ...(showModules ? [{ label: "Modules", href: "/admin/modules", icon: Package }] : []),
    ];

    if (!isMounted) return null;

    // Determine the label to show at the bottom
    const activeItem = navItems.find(item =>
        item.exact
            ? pathname === item.href
            : pathname.includes(item.href)
    );
    const currentLabel = hoveredLabel || activeItem?.label || "";

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                className={cn(
                    "hidden md:flex shrink-0 relative group z-20 transition-colors duration-300",
                    isCollapsed ? "w-11" : "w-48"
                )}
            >
                {/* Sidebar content */}
                <div
                    className={cn(
                        "relative flex flex-col bg-muted/10 border-r border-border/50 py-4 gap-1 transition-colors duration-300 overflow-hidden h-full w-full",
                        isCollapsed ? "items-center" : "px-2"
                    )}
                >
                    <div className="flex-1 w-full flex flex-col gap-1 overflow-y-auto no-scrollbar">
                        {navItems.map((item) => {
                            const isActive = item.exact
                                ? pathname === item.href
                                : pathname.includes(item.href);

                            const microLabel = item.label === "Overview" ? "Home" : item.label.split(' ')[0];

                            return (
                                <button
                                    key={item.label}
                                    onClick={() => router.push(item.href)}
                                    onMouseEnter={() => setHoveredLabel(item.label)}
                                    onMouseLeave={() => setHoveredLabel(null)}
                                    className={cn(
                                        "flex items-center transition-colors duration-200 text-left w-full relative",
                                        isCollapsed
                                            ? "h-10 w-10 justify-center mx-auto rounded-xl hover:bg-white/5 group/btn"
                                            : "gap-3 px-4 py-2 text-sm font-medium",
                                        isActive
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    {/* Active indicator bar */}
                                    {isActive && (
                                        <div className={cn(
                                            "absolute bg-primary transition-colors duration-300",
                                            isCollapsed
                                                ? "left-0 top-2 bottom-2 w-0.5 rounded-r-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                                                : "right-0 top-0 bottom-0 w-1"
                                        )} />
                                    )}

                                    <item.icon className={cn("shrink-0 transition-transform duration-200", isCollapsed ? "w-5 h-5" : "w-4 h-4", isCollapsed && "group-hover/btn:scale-110")} />

                                    {!isCollapsed && (
                                        <span className="whitespace-nowrap uppercase tracking-normal leading-normal"
                                            style={{
                                                fontFamily: 'var(--nav-item-font)',
                                                fontSize: '11px',
                                                fontWeight: 'var(--nav-item-weight)',
                                                fontStyle: 'var(--nav-item-style)', overflow: 'visible'
                                            }}
                                        >{item.label}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Vertical Label at bottom (Collapsed) */}
                    {isCollapsed && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none pb-4">
                            <span
                                className={cn(
                                    "uppercase tracking-normal whitespace-nowrap [writing-mode:vertical-rl] rotate-180 transition-colors duration-300",
                                    currentLabel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                                    hoveredLabel ? "text-primary scale-105" : "text-primary/70"
                                )}
                                style={{
                                    fontFamily: 'var(--nav-item-font)',
                                    fontSize: 'calc(var(--nav-item-size) * 0.75)',
                                    fontWeight: 'var(--nav-item-weight)',
                                    fontStyle: 'var(--nav-item-style)', overflow: 'visible'
                                }}
                            >
                                {currentLabel === "Overview" ? "Admin Panel" : currentLabel}
                            </span>
                        </div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-6 bg-background/60 backdrop-blur-xl border border-primary/20 rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100]"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-primary" /> : <ChevronLeft className="w-4 h-4 text-primary" />}
                </button>
            </div>

            {/* Mobile Admin Sub-Nav (Layer 2 — Floating Pill) */}
            <div className="md:hidden fixed bottom-[52px] left-0 right-0 z-[90]">
                <div
                    className="bg-background/80 backdrop-blur-xl border-t border-white/10 rounded-t-2xl flex flex-row items-center gap-1 p-1 overflow-x-auto no-scrollbar shadow-2xl"
                    onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                >
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.includes(item.href);

                        return (
                            <button
                                key={item.label}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isMobileExpanded) {
                                        setIsMobileExpanded(true);
                                        return;
                                    }
                                    router.push(item.href);
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[48px] py-1.5 px-2 rounded-xl transition-colors duration-200 gap-0.5 shrink-0",
                                    isActive
                                        ? "bg-primary/20 text-primary"
                                        : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn(
                                    "uppercase tracking-wider truncate max-w-[56px] transition-all duration-200",
                                    isMobileExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
                                )}
                                style={{
                                    fontFamily: 'var(--nav-item-font)',
                                    fontSize: 'calc(var(--nav-item-size) * 0.5)',
                                    fontWeight: 'var(--nav-item-weight)',
                                    fontStyle: 'var(--nav-item-style)',
                                    lineHeight: '1.2'
                                }}>
                                    {item.label.split(' ')[0]}
                                </span>

                                {isActive && (
                                    <div className="absolute top-0 w-6 h-0.5 bg-primary rounded-b-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
