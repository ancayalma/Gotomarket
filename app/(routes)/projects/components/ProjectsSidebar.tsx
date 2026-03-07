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

            {/* Mobile Stacked Bottom Nav (Layer 2) */}
            <div
                className={cn(
                    "md:hidden fixed bottom-[80px] left-0 right-0 bg-muted/10 backdrop-blur supports-[backdrop-filter]:bg-muted/60 border-t border-border/50 flex items-center justify-around z-50 px-2 shadow-sm overflow-x-auto overflow-y-hidden no-scrollbar transition-colors duration-300",
                    isMobileExpanded ? "h-14" : "h-12"
                )}
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
                                "flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors relative rounded-md",
                                isMobileExpanded ? "h-10 justify-center" : "h-full justify-center",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />

                            {/* Label - Only visible when expanded */}
                            <span className={cn(
                                "uppercase tracking-wider truncate max-w-full px-1 transition-colors duration-200",
                                isMobileExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
                            )}
                            style={{
                                fontFamily: 'var(--nav-item-font)',
                                fontSize: 'calc(var(--nav-item-size) * 0.65)',
                                fontWeight: 'var(--nav-item-weight)',
                                fontStyle: 'var(--nav-item-style)', overflow: 'visible',
                                paddingRight: '0.4em'
                            }}>
                                {item.label}
                            </span>

                            {/* Top Cursor Animation */}
                            {isActive && (
                                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </>
    );
}
