"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FolderKanban,
    Folder,
    ListTodo,
    FileText,
    BarChart2,
    CalendarDays,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export default function ProjectsSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("projects-sidebar-collapsed");
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
        localStorage.setItem("projects-sidebar-collapsed", String(newState));
    };

    const navItems = [
        { label: "Overview", href: "/projects", icon: FolderKanban },
        { label: "Tasks", href: "/projects/tasks", icon: ListTodo },
    ];

    if (!isMounted) return null;

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                className={cn(
                    "hidden md:flex shrink-0 relative group z-20",
                    isCollapsed ? "w-16" : "w-48"
                )}
            >
                {/* Sidebar content */}
                <div
                    className={cn(
                        "flex flex-col bg-muted/10 border-r border-border/50 py-4 gap-1 transition-colors duration-300 overflow-y-auto h-full w-full",
                        isCollapsed ? "items-center" : "px-2"
                    )}
                >
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/projects"
                                ? pathname === "/projects" || pathname === "/en/projects"
                                : pathname.includes(item.href.replace("/projects", ""));

                        return (
                            <button
                                key={item.label}
                                onClick={() => router.push(item.href)}
                                className={cn(
                                    "relative w-full flex items-center rounded-xl transition-colors duration-200 group text-sm font-medium",
                                    isCollapsed ? "justify-center w-8 h-8 mx-auto" : "py-1.5 px-2",
                                    isActive
                                        ? "text-primary"
                                        : cn("text-muted-foreground", !isCollapsed && "hover:text-foreground hover:bg-muted/30")
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {/* Active glow */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] content-[''] z-0" />
                                )}

                                {/* Icon */}
                                <div className={cn(
                                    "relative z-10 flex items-center justify-center min-w-[24px]",
                                    isCollapsed && "w-8 h-8 rounded-md transition-colors duration-200 hover:bg-muted/50 hover:ring-1 hover:ring-border group/icon"
                                )}>
                                    <item.icon className={cn(
                                        "w-[18px] h-[18px] transition-colors duration-200",
                                        isActive ? "text-primary" : (isCollapsed ? "group-hover/icon:text-primary text-muted-foreground" : "group-hover:text-primary")
                                    )} />
                                </div>

                                {/* Text (Expanded) */}
                                {!isCollapsed && (
                                    <div className="flex items-center gap-2 flex-1 z-10 ml-2.5">
                                        <span className={cn(
                                            "whitespace-nowrap uppercase tracking-normal leading-normal flex-1 text-left px-1",
                                            isActive ? "bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent" : "text-muted-foreground group-hover:text-primary transition-colors duration-300"
                                        )}
                                        style={{
                                            fontFamily: 'var(--nav-item-font)',
                                            fontSize: 'var(--nav-item-size)',
                                            fontWeight: 'var(--nav-item-weight)',
                                            fontStyle: 'var(--nav-item-style)', overflow: 'visible',
                                            paddingRight: '1.2em'
                                        }}>
                                            {item.label}
                                        </span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-6 bg-background/60 backdrop-blur-xl border border-border rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100]"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Mobile Stacked Bottom Nav (Layer 2 — Floating Pill) */}
            <div className="md:hidden fixed bottom-[52px] left-0 right-0 z-[90]">
                <div
                    className="bg-background/80 backdrop-blur-xl border-t border-white/10 rounded-t-2xl flex flex-row items-center gap-1 p-1 overflow-x-auto no-scrollbar shadow-2xl"
                    onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                >
                {navItems.map((item) => {
                    const isActive =
                        item.href === "/projects"
                            ? pathname === "/projects" || pathname === "/en/projects"
                            : pathname.includes(item.href.replace("/projects", ""));

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
                                "flex flex-col items-center justify-center min-w-[48px] py-1.5 px-2 rounded-xl transition-colors duration-200 gap-0.5 shrink-0 relative",
                                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            <item.icon className="w-4 h-4" />

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
                                {item.label}
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
