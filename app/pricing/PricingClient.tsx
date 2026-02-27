"use client";

import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PricingClient() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");


    const plans = {
        individual: [
            {
                title: "Free",
                price: "$0",
                period: "/ month",
                description: "Essential tools for small teams and startups.",
                features: [
                    "Basic CRM & Project Management",
                    "LeadGen Credits: 100 / month",
                    "Email Campaigns: 2,500 / month",
                    "Basic AI Lead Discovery (1:1 Ratio)",
                    "Max 100 Accounts Staging Capacity",
                    "1 User License",
                ],
                buttonText: "Start for Free",
                buttonVariant: "outline" as const,
                popular: false,
            },
            {
                title: "Individual Basic",
                price: billingCycle === "monthly" ? "$50" : "$450",
                period: billingCycle === "monthly" ? "/ month" : "/ year",
                description: "Standard CRM with enhanced lead enrichment.",
                features: [
                    "LeadGen Credits: 1,000 / month",
                    "Email Campaigns: 15,000 / month",
                    "Standard AI Lead Enrichment",
                    "Max 750 Accounts Staging Capacity",
                    "Workflow Automation & Templates",
                    "2 User Licenses",
                ],
                buttonText: "Start Basic",
                buttonVariant: "outline" as const,
                popular: false,
            },
            {
                title: "Individual Pro",
                price: billingCycle === "monthly" ? "$150" : "$1,350",
                period: billingCycle === "monthly" ? "/ month" : "/ year",
                description: "Power user features for maximum growth.",
                features: [
                    "LeadGen Credits: 5,000 / month",
                    "Email Campaigns: 50,000 / month",
                    "Full Agentic & Deep Research",
                    "Max 3,000 Accounts Staging Capacity",
                    "VoiceHub AI Calling (per-minute)",
                    "Dedicated Support & Custom Reports",
                    "4 User Licenses",
                ],
                buttonText: "Go Pro",
                buttonVariant: "primary" as const,
                popular: true,
                badge: "MOST POPULAR",
                glowColor: "cyan",
            },
        ],
    };

    const enterprisePlan = {
        title: "Enterprise",
        price: "Contact Us",
        period: "Custom Pricing",
        description: "Bespoke solutions for high-scale organizations.",
        features: [
            "Custom Feature Engineering",
            "Unlimited Lead Generation",
            "Unlimited Email & SMS Volume",
            "White-label Branding Options",
            "Direct Slack/Discord Support",
            "Single Sign-On (SSO) Integration",
        ],
        buttonText: "Request Quote",
        buttonVariant: "outline" as const,
    };

    return (
        <main className="pt-32 pb-20">
            {/* Hero Section */}
            <section className="text-center px-4 mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                    <Sparkles className="w-3 h-3" />
                    New 2026 Pricing
                </div>
                <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">
                    Simple, Transparent <span className="text-primary">Pricing</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                    Choose the plan that fits your business needs. No hidden fees.
                </p>

                {/* Monthly/Annual Toggle */}
                <div className="flex items-center justify-center space-x-4 mb-16">
                    <span className={`text-sm ${billingCycle === "monthly" ? "text-white" : "text-gray-400"}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                        className="relative w-14 h-8 bg-white/10 rounded-full p-1 transition-colors hover:bg-white/20 focus:outline-none"
                    >
                        <motion.div
                            className="w-6 h-6 bg-primary rounded-full shadow-md"
                            layout
                            transition={{ type: "spring", stiffness: 700, damping: 30 }}
                            animate={{ x: billingCycle === "monthly" ? 0 : 24 }}
                        />
                    </button>
                    <span className={`text-sm ${billingCycle === "annual" ? "text-white" : "text-gray-400"}`}>
                        Annual <span className="text-primary text-xs ml-1">(Save 25%)</span>
                    </span>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="container mx-auto px-4 max-w-7xl mb-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="plans"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {plans.individual.map((plan, index) => (
                            <PricingCard key={index} {...plan} billingCycle={billingCycle} />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* Enterprise Tier - Premium Highlight */}
            <section className="container mx-auto px-4 max-w-7xl mb-24">
                <div className="relative p-1 rounded-3xl bg-gradient-to-r from-zinc-800 via-zinc-400 to-zinc-800 shadow-2xl">
                    <div className="bg-[#05050a] rounded-[22px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex-1">
                            <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 mb-4 px-4 py-1">ENTERPRISE TIER</Badge>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Need something <span className="text-zinc-400">Custom Built?</span></h2>
                            <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                                For organizations requiring high-volume processing, custom agent behaviors, or private infrastructure. Get a custom solution tailored to your specific workflow.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                {enterprisePlan.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-zinc-400" />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-full md:w-auto text-center bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                            <div className="text-4xl font-bold text-white mb-2">Speak with Sales</div>
                            <p className="text-zinc-500 text-sm mb-6">Standard 24h response time</p>
                            <Link href="#contact" className="w-full inline-block">
                                <Button className="w-full py-7 text-xl bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                    Book a Demo
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Optional Add-ons */}
            <section className="container mx-auto px-4 max-w-5xl mb-24">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-primary/10 border border-primary/30 p-1">
                    <div className="bg-[#0A0A12] rounded-3xl p-8 md:p-10 backdrop-blur-xl">
                        <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                            Power Up with Add-ons
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            <div className="flex items-start space-x-4 bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-all group">
                                <div className="bg-gradient-to-br from-primary/30 to-cyan-500/30 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <Check className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold mb-2 text-white group-hover:text-primary transition-colors">VoiceHub AI Calling</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Billed per minute. Scale your outreach with unlimited AI agents available 24/7.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4 bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-all group">
                                <div className="bg-gradient-to-br from-primary/30 to-cyan-500/30 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <Check className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold mb-2 text-white group-hover:text-primary transition-colors">SMS Campaigns</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Available as an add-on. Reach your customers directly on their phones with high-converting SMS sequences.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="container mx-auto px-4 max-w-7xl mb-24">
                <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
                <AnimatePresence mode="wait">
                    <motion.div
                        key="comparison"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <IndividualComparisonTable />
                    </motion.div>
                </AnimatePresence>
            </section>



            {/* Get in Touch CTA */}
            <section id="contact" className="container mx-auto px-4 max-w-4xl mb-24">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/30 p-1">
                    <div className="bg-[#0A0A12] rounded-3xl p-8 md:p-12 backdrop-blur-xl">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                                Have Questions? Let's Talk
                            </h2>
                            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                                Our team is here to help you find the perfect plan for your business. Get in touch and we'll respond within 24 hours.
                            </p>
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const formData = new FormData(form);

                                try {
                                    const res = await fetch('/api/support/create', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            name: formData.get('name'),
                                            email: formData.get('email'),
                                            message: formData.get('message'),
                                            company: formData.get('company'),
                                            subject: "Pricing Inquiry",
                                            source: "PRICING"
                                        })
                                    });

                                    if (res.ok) {
                                        alert("Message sent! We'll be in touch.");
                                        form.reset();
                                    }
                                } catch (err) {
                                    alert("Failed to send message.");
                                }
                            }}
                            className="space-y-6 max-w-2xl mx-auto"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Work Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                        placeholder="john@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                    placeholder="Your Company"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                    How can we help? *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                                    placeholder="Tell us about your needs..."
                                />
                            </div>

                            <div className="text-center pt-4">
                                <Button
                                    type="submit"
                                    className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white px-10 py-6 text-lg rounded-[10px] shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all duration-300 font-semibold"
                                >
                                    Send Message
                                </Button>
                                <p className="text-gray-500 text-sm mt-4">
                                    We'll get back to you within 24 hours
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    )
}

function PricingCard({
    title,
    price,
    period,
    description,
    features,
    buttonText,
    buttonVariant,
    popular,
    badge,
    glowColor,
    billingCycle,
}: {
    title: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    buttonText: string;
    buttonVariant: "primary" | "outline";
    popular?: boolean;
    badge?: string;
    glowColor?: string;
    billingCycle: string;
}) {
    return (
        <div
            className={`relative p-8 rounded-2xl border flex flex-col text-left h-full transition-all duration-300 hover:transform hover:-translate-y-1 ${popular
                ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
        >
            {popular && badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide shadow-lg">
                    {badge}
                </div>
            )}
            <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm h-10">{description}</p>
            </div>

            <div className="flex items-baseline mb-8">
                <span className="text-4xl font-extrabold tracking-tight">{price}</span>
                <span className="text-gray-400 ml-2 text-sm font-medium">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-300">
                        <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{feature}</span>
                    </li>
                ))}
            </ul>

            <Link href={`/register?plan=${title.toLowerCase().replace(/ /g, '-')}&cycle=${billingCycle}`} className="w-full mt-auto">
                <Button
                    className={`w-full py-6 text-lg rounded-[10px] font-semibold transition-all duration-300 ${buttonVariant === "primary"
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                        : "bg-transparent border border-white/20 hover:bg-white/10 text-white"
                        }`}
                >
                    {buttonText}
                </Button>
            </Link>
        </div>
    );
}

function IndividualComparisonTable() {
    const features = [
        {
            category: "LeadGen Credits",
            values: ["100 / month", "1,000 / month", "5,000 / month", "Unlimited"]
        },
        {
            category: "Email Campaigns",
            values: ["2,500 / month", "15,000 / month", "50,000 / month", "Unlimited"]
        },
        {
            category: "AI Lead Enrichment",
            values: ["Basic Discovery", "Standard Enrichment", "Advanced Agentic", "Full Bespoke"]
        },
        {
            category: "VoiceHub AI Calling",
            values: ["—", "—", "✓ (per-minute)", "Included/Custom"]
        },
        {
            category: "Account Capacity",
            values: ["100 Leads", "750 Leads", "3,000 Leads", "Unlimited"]
        },
        {
            category: "Workflow Automation",
            values: ["—", "✓", "✓", "✓"]
        },
        {
            category: "User Licenses",
            values: ["1", "2", "4", "Custom"]
        },
        {
            category: "Support Tier",
            values: ["Community", "Priority Community", "Priority 24/7", "Dedicated White-glove"]
        },
    ];

    return (
        <div className="bg-[#0A0A12] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left p-6 text-gray-400 font-medium">Feature</th>
                            <th className="p-6 text-center font-bold">Free</th>
                            <th className="p-6 text-center font-bold">Individual Basic</th>
                            <th className="p-6 text-center font-bold bg-primary/5 border-l border-r border-primary/30 relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
                                <span className="relative text-primary">Individual Pro</span>
                            </th>
                            <th className="p-6 text-center font-bold">Enterprise</th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map((feature, index) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-6 text-gray-300 font-medium">{feature.category}</td>
                                <td className="p-6 text-center text-gray-400">{feature.values[0]}</td>
                                <td className="p-6 text-center text-gray-400">{feature.values[1]}</td>
                                <td className="p-6 text-center bg-primary/5 border-l border-r border-primary/20 text-cyan-400 font-medium">
                                    {feature.values[2]}
                                </td>
                                <td className="p-6 text-center text-gray-400">{feature.values[3]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


