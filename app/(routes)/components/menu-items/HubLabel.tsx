"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type HubLabelProps = {
    label: string;
    isOpen: boolean;
    /** If true, renders a thicker gold divider (for Platform) */
    isDouble?: boolean;
};

const HubLabel = ({ label, isOpen, isDouble = false }: HubLabelProps) => {
    return (
        <div className="w-full">
            {/* Separator line */}
            <div
                className={cn(
                    "mx-2 bg-gradient-to-r from-transparent via-border to-transparent opacity-50",
                    isDouble ? "h-[2px] via-primary/30 my-3" : "h-[1px] my-2"
                )}
            />
            {/* Label text — hidden when collapsed */}
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                    marginBottom: isOpen ? 4 : 0,
                    marginTop: isOpen ? 4 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden px-4"
            >
                <span
                    className="font-black tracking-[2px] uppercase bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent select-none py-0 pl-2 pr-4 leading-normal"
                    style={{
                        fontFamily: 'var(--nav-title-font)',
                        fontSize: 'var(--nav-title-size)',
                        fontWeight: 'var(--nav-title-weight)',
                        fontStyle: 'var(--nav-title-style)',
                        paddingRight: '0.3em'
                    }}
                >
                    {label}
                </span>
            </motion.div>
        </div>
    );
};

export default HubLabel;
