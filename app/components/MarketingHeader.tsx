"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

import SecondaryNavbar from "./SecondaryNavbar";

/**
 * Public marketing navbar used across marketing pages.
 * Universal sticky header with mobile menu overlay.
 */
export default function MarketingHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { label: "Features", href: "/features" },
        { label: "Pricing", href: "/pricing" },

        { label: "FAQ", href: "/faq" },
        { label: "Blog", href: "/blog" },
        { label: "Support", href: "/support" },
    ];

    return (
        <>
            <SecondaryNavbar />
            <header className="h-20 flex items-center border-b border-white/10 bg-[#0F0F1A]/15 backdrop-blur-md sticky top-0 z-50 w-full shadow-sm">
                <div className="container mx-auto px-4 lg:px-6 flex items-center justify-between h-full">
                    {/* Logo */}
                    <Link className="flex items-center justify-center z-50 relative" href="/" aria-label="Basalt CRM Home">
                        <Image
                            src="/BasaltCRMWide.png"
                            alt="Basalt CRM Logo"
                            width={224}
                            height={64}
                            className="object-contain h-16 w-auto brightness-200 contrast-125"
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                href={link.href}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full-button-frame">
                                Login
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-[color,background-color,border-color,box-shadow] rounded-full-button-frame">
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden z-50 relative text-white p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-[#0F0F1A] z-40 flex flex-col pt-24 px-6 pb-8 lg:hidden overflow-y-auto">
                    <nav className="flex flex-col gap-6 items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-2xl font-medium text-gray-300 hover:text-white transition-colors w-full text-center py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="w-full h-px bg-white/10 my-4" />
                        <Link href="/dashboard" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full text-lg h-12 text-gray-300 hover:text-white hover:bg-white/10 rounded-full-button-frame">
                                Login
                            </Button>
                        </Link>
                        <Link href="/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full text-lg h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] rounded-full-button-frame">
                                Get Started
                            </Button>
                        </Link>
                    </nav>

                    {/* Mobile Social Icons Removed */}
                </div>
            )}
        </>
    );
}
