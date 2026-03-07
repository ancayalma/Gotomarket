"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderKanban, BarChart2, Settings, ChevronLeft, ChevronRight, FileText, Users } from "lucide-react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

type Props = {
    title: string;
    description: string;
    visibility?: string;
    kanbanSlot: React.ReactNode;
    ganttSlot: React.ReactNode;
    settingsSlot: React.ReactNode;
    documentsSlot?: React.ReactNode;
    membersSlot?: React.ReactNode;
    headerSlot?: React.ReactNode;
};

export default function BoardTabsContainer({ title, description, visibility, kanbanSlot, ganttSlot, settingsSlot, documentsSlot, membersSlot, headerSlot }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selected = searchParams.get("view") || "kanban";
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const [layer2Expanded, setLayer2Expanded] = useState(false);
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("board-sidebar-collapsed");
        if (stored) {
            setIsCollapsed(stored === "true");
        }

        const handleLayer2Change = (e: CustomEvent) => {
            setLayer2Expanded(e.detail.expanded);
        };

        window.addEventListener('crm-layer2-change' as any, handleLayer2Change as any);
        return () => {
            window.removeEventListener('crm-layer2-change' as any, handleLayer2Change as any);
        };
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("board-sidebar-collapsed", String(newState));
    };

    const setView = useCallback(
        (value: string) => {
            const sp = new URLSearchParams(searchParams.toString());
            sp.set("view", value);
            router.replace(`?${sp.toString()}`, { scroll: false });
        },
        [router, searchParams]
    );

    const navItems = [
        { id: "kanban", label: "Tasks", icon: FolderKanban },
        { id: "gantt", label: "Gantt", icon: BarChart2 },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "members", label: "Members", icon: Users },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    if (!isMounted) return null;

    return (
        <div className="flex flex-col md:flex-row h-full w-full">

            {/* Wrapper for Layer 3 sidebar + toggle button */}
            <div
                className={cn(
                    "hidden md:flex shrink-0 relative group z-10",
                    isCollapsed ? "w-12" : "w-48"
                )}
            >
                {/* Sidebar content */}
                <div
                    className={cn(
                        "flex flex-col bg-muted/10 border-r border-border/50 py-4 gap-1 transition-colors duration-300 overflow-y-auto h-full w-full",
                        isCollapsed ? "items-center" : "px-2"
                    )}
                >
                    {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                onMouseEnter={() => setHoveredLabel(item.label)}
                                onMouseLeave={() => setHoveredLabel(null)}
                                className={cn(
                                    "relative w-full flex items-center rounded-xl transition-colors duration-200 group text-sm font-medium",
                                    isCollapsed ? "justify-center w-8 h-8 mx-auto" : "py-1.5 px-2",
                                    selected === item.id
                                        ? "text-primary"
                                        : cn("text-muted-foreground", !isCollapsed && "hover:text-foreground hover:bg-muted/30")
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {/* Active glow */}
                                {selected === item.id && (
                                    <div className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] content-[''] z-0" />
                                )}

                                {/* Icon */}
                                <div className={cn(
                                    "relative z-10 flex items-center justify-center min-w-[24px]",
                                    isCollapsed && "w-8 h-8 rounded-md transition-colors duration-200 hover:bg-muted/50 hover:ring-1 hover:ring-border group/icon"
                                )}>
                                    <item.icon className={cn(
                                        "w-[18px] h-[18px] transition-colors duration-200",
                                        selected === item.id ? "text-primary" : (isCollapsed ? "group-hover/icon:text-primary text-muted-foreground" : "group-hover:text-primary")
                                    )} />
                                </div>

                                {/* Text (Expanded) */}
                                {!isCollapsed && (
                                    <div className="flex items-center flex-1 z-10 ml-2.5">
                                        <span className={cn(
                                            "whitespace-nowrap uppercase tracking-normal leading-normal flex-1 text-left px-1",
                                            selected === item.id ? "bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent" : "text-muted-foreground group-hover:text-primary transition-colors duration-300"
                                        )}
                                        style={{
                                            fontFamily: 'var(--nav-item-font)',
                                            fontSize: 'var(--nav-item-size)',
                                            fontWeight: 'var(--nav-item-weight)',
                                            fontStyle: 'var(--nav-item-style)',
                                            paddingRight: '1.2em',
                                            overflow: 'visible'
                                        }}>
                                            {item.label}
                                        </span>
                                    </div>
                                )}
                            </button>
                    ))}

                    {/* Dynamic Bottom Label (Collapsed Mode) */}
                    {isCollapsed && (
                        <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none">
                            <span
                                className={cn(
                                    "uppercase tracking-widest whitespace-nowrap [writing-mode:vertical-rl] rotate-180 transition-opacity duration-200",
                                    hoveredLabel ? "opacity-100 text-primary" : "opacity-0 text-primary/70"
                                )}
                                style={{
                                    fontFamily: 'var(--nav-item-font)',
                                    fontSize: 'calc(var(--nav-item-size) * 0.75)',
                                    fontWeight: 'var(--nav-item-weight)',
                                    fontStyle: 'var(--nav-item-style)', overflow: 'visible'
                                }}
                            >
                                {hoveredLabel}
                            </span>
                        </div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-6 bg-background/60 backdrop-blur-xl border border-border rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100]"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Mobile Stacked Bottom Nav (Layer 3) */}
            <div
                className={cn(
                    "md:hidden fixed left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50 flex items-center justify-around z-40 px-2 shadow-sm overflow-y-hidden transition-colors duration-300",
                    isMobileExpanded ? "h-16 py-1" : "h-12"
                )}
                style={{ bottom: layer2Expanded ? '136px' : '128px' }}
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isMobileExpanded) {
                                    setIsMobileExpanded(true);
                                    return;
                                }
                                setView(item.id);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors relative",
                                isMobileExpanded ? "h-14 justify-end pb-1" : "h-full justify-center",
                                selected === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="w-4 h-4" />

                            {/* Label */}
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
                            {selected === item.id && (
                                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto h-full flex flex-col bg-background">
                <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-5 pb-2">
                    <div className="flex items-center gap-4">
                        {headerSlot}
                        <div>
                            <Heading title={title} description={description} visibility={visibility} />
                        </div>
                    </div>
                    <div className="mt-3 h-px bg-gradient-to-r from-border/80 via-border/40 to-transparent" />
                </div>

                <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 pb-20 md:pb-0">
                    {selected === "kanban" && kanbanSlot}
                    {selected === "gantt" && ganttSlot}
                    {selected === "documents" && documentsSlot}
                    {selected === "members" && membersSlot}
                    {selected === "settings" && settingsSlot}
                </div>
            </div>

        </div>
    );
}
