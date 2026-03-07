"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wand2, Users, Settings, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

type Props = {
  title: string;
  description: string;
  managerSlot: React.ReactNode;
  wizardSlot: React.ReactNode;
  poolsSlot: React.ReactNode;
  settingsSlot?: React.ReactNode;
  isMember?: boolean;
};

export default function TabsContainer({ title, description, managerSlot, wizardSlot, poolsSlot, settingsSlot, isMember = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("tab") || "manager";
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed for Layer 3
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [layer2Expanded, setLayer2Expanded] = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("leads-sidebar-collapsed");
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
    localStorage.setItem("leads-sidebar-collapsed", String(newState));
  };

  const setTab = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("tab", value);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Layer 3: Leads Manager Tabs
  const allNavItems = [
    { id: "manager", label: "All Leads", icon: LayoutDashboard },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const leadsNavItems = isMember
    ? allNavItems.filter(item => item.id === "manager")
    : allNavItems;



  return (
    <div className="flex flex-col md:flex-row h-full w-full">

      {/* Wrapper for Layer 3 sidebar + toggle button - Hidden for members (only 1 option) */}
      {!isMember && (
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
            {leadsNavItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setTab(item.id)}
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
              <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none pb-4">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-normal font-semibold whitespace-nowrap [writing-mode:vertical-rl] rotate-180 transition-colors duration-300",
                    hoveredLabel || leadsNavItems.find(i => i.id === selected)?.label ? "opacity-100" : "opacity-0",
                    hoveredLabel ? "text-primary scale-105" : "text-primary/70"
                  )}
                >
                  {hoveredLabel || leadsNavItems.find(i => i.id === selected)?.label}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Button - Outside overflow container */}
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-6 bg-background/60 backdrop-blur-xl border border-primary/20 rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100]"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-primary" /> : <ChevronLeft className="w-4 h-4 text-primary" />}
          </button>
        </div>
      )}

      {/* Mobile Stacked Bottom Nav (Layer 3) - Positioned above Layer 2 - Hidden for members */}
      {!isMember && (
        <div
          className={cn(
            "md:hidden fixed left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50 flex items-center justify-around z-40 px-2 shadow-sm overflow-y-hidden transition-colors duration-300",
            isMobileExpanded ? "h-16 py-1" : "h-12"
          )}
          style={{ bottom: layer2Expanded ? '136px' : '128px' }}
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        >
          {leadsNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent container click
                  if (!isMobileExpanded) {
                    setIsMobileExpanded(true);
                    return;
                  }
                  setTab(item.id);
                }}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors relative",
                  isMobileExpanded ? "h-14 justify-end pb-1" : "h-full justify-center",
                  selected === item.id ? "text-primary" : "text-primary/60 hover:text-primary"
                )}
              >
                <Icon className="w-4 h-4" />

                {/* Label - Only visible when expanded */}
                <span className={cn(
                  "text-[9px] uppercase tracking-wider font-semibold truncate max-w-full px-1 transition-colors duration-200",
                  isMobileExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
                )}>
                  {item.label.split(' ')[0]}
                </span>

                {/* Top Cursor Animation */}
                {selected === item.id && (
                  <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area - Scrolls independently */}
      <div className="flex-1 overflow-y-auto h-full flex flex-col bg-background">
        {/* Header Section - Standard Scroll */}
        <div className="bg-background p-4 md:px-6 lg:px-8 pb-3">
          <Heading title={title} description={description} />
          <Separator className="mt-2" />
        </div>

        <div className="flex-1 px-4 md:px-6 lg:px-8 pb-20 md:pb-4">
          {selected === "manager" && managerSlot}
          {selected === "settings" && settingsSlot}
        </div>
      </div>

    </div>
  );
}
