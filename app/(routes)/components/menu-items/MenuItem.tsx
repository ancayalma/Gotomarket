"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, Lock, ChevronUp } from "lucide-react";

type MenuItemProps = {
    href: string;
    icon: LucideIcon | React.ElementType;
    title: string;
    isOpen: boolean;
    isActive: boolean;
    onClick?: () => void;
    isMobile?: boolean;
    badge?: number;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    isLocked?: boolean;
    hasSubNav?: boolean;
};

const MenuItem = ({ href, icon: Icon, title, isOpen, isActive, onClick, isMobile = false, badge, onMouseEnter, onMouseLeave, isLocked, hasSubNav }: MenuItemProps) => {
    // Determine label for collapsed/mobile view
    // Specific override: Dashboard -> Home
    const rawLabel = title;
    const isDashboard = rawLabel === "Dashboard";
    const microLabel = isDashboard ? "Home" : rawLabel.split(' ')[0];

    // ─── Mobile ───
    if (isMobile) {
        return (
            <Link href={isLocked ? "#" : href} onClick={isLocked ? (e) => e.preventDefault() : onClick} className="flex-shrink-0">
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors duration-200 gap-0.5",
                        isActive
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground",
                        isLocked && "opacity-60 grayscale cursor-not-allowed"
                    )}
                >
                    {hasSubNav && (
                        <ChevronUp className="w-3 h-3 text-primary/50 absolute -top-0.5" />
                    )}
                    <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                    {isLocked && (
                        <div className="absolute top-1 right-2">
                            <Lock className="w-3 h-3 text-muted-foreground" />
                        </div>
                    )}
                    <span
                        className={cn(
                            "uppercase tracking-wider truncate max-w-[64px]",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                        style={{
                            fontFamily: 'var(--nav-item-font)',
                            fontSize: 'calc(var(--nav-item-size) * 0.5)',
                            fontWeight: 'var(--nav-item-weight)',
                            fontStyle: 'var(--nav-item-style)', overflow: 'visible',
                            lineHeight: '1.2',
                            paddingRight: '0.4em'
                        }}
                    >
                        {microLabel}
                    </span>
                </div>
            </Link>
        );
    }

    // ─── Desktop ───
    return (
        <div className="w-full" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <Link href={isLocked ? "#" : href} onClick={isLocked ? (e) => e.preventDefault() : onClick} className={cn(isLocked && "cursor-not-allowed")}>
                <div
                    className={cn(
                        "relative w-full flex items-center rounded-xl transition-colors duration-200 group text-sm font-medium",
                        isOpen ? "py-1.5 px-2" : "flex-col py-2 px-1 justify-center gap-0.5",
                        isActive
                            ? "text-primary"
                            : cn("text-muted-foreground", isOpen && !isLocked && "hover:text-foreground hover:bg-muted/30"),
                        isLocked && "opacity-70"
                    )}
                >
                    {/* Active glow */}
                    {isActive && (
                        <div className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] content-['']" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                        "relative z-10 flex items-center justify-center min-w-[24px]",
                        !isOpen && "w-8 h-8 rounded-md transition-colors duration-200 hover:bg-muted/50 hover:ring-1 hover:ring-border group/icon"
                    )}>
                        <Icon
                            className={cn(
                                "w-[18px] h-[18px] transition-colors duration-200",
                                isActive
                                    ? "text-primary"
                                    : (isOpen ? "group-hover:text-primary" : "group-hover/icon:text-primary text-muted-foreground")
                            )}
                        />
                    </div>

                    {/* Title */}
                    <motion.span
                        initial={false}
                        animate={{
                            opacity: isOpen ? 1 : 0,
                            width: isOpen ? "auto" : 0,
                            display: isOpen ? "flex" : "none",
                        }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "ml-2.5 z-10 flex flex-col uppercase tracking-normal py-0 px-2 leading-normal",
                            isActive ? "bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent" : "text-muted-foreground group-hover:text-primary transition-colors duration-300"
                        )}
                        style={{
                            fontFamily: 'var(--nav-item-font)',
                            fontSize: 'var(--nav-item-size)',
                            fontWeight: 'var(--nav-item-weight)',
                            fontStyle: 'var(--nav-item-style)', overflow: 'visible',
                            paddingRight: '1.2em'
                        }}
                    >
                        <span className="whitespace-nowrap">{title}</span>
                        {isLocked && (
                            <span className="text-[7px] bg-muted/50 text-muted-foreground px-1 py-[1px] rounded flex items-center gap-1 border border-border/50 not-italic font-bold w-fit mt-0.5 leading-tight">
                                <Lock className="w-2 h-2" />
                                Upgrade
                            </span>
                        )}
                    </motion.span>

                    {/* Micro-Label for Collapsed State */}
                    {!isOpen && (
                        <span
                            className={cn(
                                "uppercase tracking-wider mt-0.5 truncate max-w-[60px] text-center flex items-center justify-center",
                                isActive ? "text-primary font-semibold" : "text-muted-foreground"
                            )}
                            style={{
                                fontFamily: 'var(--nav-item-font)',
                                fontSize: 'calc(var(--nav-item-size) * 0.5)',
                                fontWeight: 'var(--nav-item-weight)',
                                fontStyle: 'var(--nav-item-style)', overflow: 'visible',
                                paddingRight: '0.4em'
                            }}
                        >
                            {isLocked ? <Lock className="w-2.5 h-2.5" /> : microLabel}
                        </span>
                    )}

                    {/* Badge — positioned to never overlap chevrons */}
                    {badge && badge > 0 && isOpen && !isLocked && (
                        <span className="ml-auto z-10 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold leading-none shrink-0">
                            {badge > 99 ? "99+" : badge}
                        </span>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default MenuItem;
