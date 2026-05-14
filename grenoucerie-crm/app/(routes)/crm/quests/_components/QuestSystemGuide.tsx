"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles, Star, TrendingUp, Trophy, Unlock, Zap, Crown, Swords, Medal, Info, Flame, Target, Rocket, Activity, BarChart3, Binary, LayoutTemplate, Box, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const XP_MILESTONES = [
    { level: 1, title: "Recruit", xp: 0, color: "text-slate-400", ring: "border-slate-500/30", desc: "Your journey begins here. Master the basics." },
    { level: 10, title: "Apprentice", xp: "1,000", color: "text-emerald-400", ring: "border-emerald-500/30", desc: "You've proven your dedication. Access intermediate challenges." },
    { level: 25, title: "Journeyman", xp: "6,500", color: "text-blue-400", ring: "border-blue-500/30", desc: "A respected operative. Consistent performance yields results." },
    { level: 50, title: "Expert", xp: "25,500", color: "text-purple-400", ring: "border-purple-500/30", desc: "High-value asset. You orchestrate complex closings." },
    { level: 75, title: "Master", xp: "57,000", color: "text-rose-400", ring: "border-rose-500/30", desc: "Elite status achieved. A leader among peers." },
    { level: 100, title: "Grandmaster", xp: "101,000", color: "text-amber-400", ring: "border-amber-500/50", desc: "The apex of the standard ladder. Ready for Prestige." },
];

const PRESTIGE_TIERS = [
    { rank: 1, title: "Bronze Prestige", color: "from-amber-700 to-amber-900", iconColor: "text-amber-700", desc: "The first ascension. Unlocks bronze structural accents." },
    { rank: 2, title: "Silver Prestige", color: "from-slate-300 to-slate-500", iconColor: "text-slate-300", desc: "Second ascension. Polished interface elements." },
    { rank: 3, title: "Gold Prestige", color: "from-yellow-400 to-amber-500", iconColor: "text-yellow-400", desc: "Third ascension. Golden aura applied to HUD." },
    { rank: 4, title: "Platinum Prestige", color: "from-blue-300 to-cyan-500", iconColor: "text-blue-300", desc: "Fourth ascension. Cyan energy signatures unlock." },
    { rank: 5, title: "Diamond Prestige", color: "from-indigo-400 to-purple-600", iconColor: "text-purple-400", desc: "Fifth ascension. Hyper-violet visual styling." },
    { rank: "6+", title: "Obsidian Prestige", color: "from-slate-900 to-red-900", iconColor: "text-red-500", desc: "Infinite ascension. Dark energy aesthetic." },
];

const QUEST_PROTOCOLS = [
    {
        category: "Sales & Pipeline", icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", glow: "from-amber-500/10 to-transparent",
        desc: "Revenue-generating actions tied directly to deals and pipeline movement.",
        metrics: [
            { label: "Close Deals", desc: "Triggers when Pipeline Opportunities shift to 'Closed Won'." },
            { label: "Close Leads", desc: "Automatically tracks Leads transitioned to 'Closed' statuses." },
            { label: "Revenue Target", desc: "Aggregates total monetary deal value generated over the quest duration." },
            { label: "Create Opportunities", desc: "Rewards pipeline expansion by tracking newly logged Opportunities." }
        ]
    },
    {
        category: "Outreach Ops", icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", glow: "from-blue-500/10 to-transparent",
        desc: "Communications throughput and top-of-funnel engagement activities.",
        metrics: [
            { label: "Send Emails", desc: "Validates outbound communications sent via the integrated CRM mail agent." },
            { label: "Make Calls", desc: "Tracks completed phone log records mapped to Contacts or Accounts." },
            { label: "Book Meetings", desc: "Monitors Calendar Events successfully created and attached to prospects." }
        ]
    },
    {
        category: "Operational", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", glow: "from-emerald-500/10 to-transparent",
        desc: "Foundational CRM hygiene, productivity, and team learning metrics.",
        metrics: [
            { label: "Complete Tasks", desc: "Measures standard task resolution throughput and daily checklist clearing." },
            { label: "Add Contacts", desc: "Counts net-new verified profiles injected into the centralized database." },
            { label: "Upload Documents", desc: "Tracks executed contracts, proposals, or assets uploaded to records." }
        ]
    }
];

export default function QuestSystemGuide() {
    const [activeSection, setActiveSection] = useState("overview");

    useEffect(() => {
        const sections = ["overview", "leveling", "prestige", "dna", "protocols"];
        let observers: IntersectionObserver[] = [];

        const observerOptions = {
            root: null, // use viewport
            rootMargin: "-20% 0px -80% 0px", // Trigger when element hits top 20% of screen
            threshold: 0,
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-7xl mx-auto"
        >
            {/* Header / Hero */}
            <div id="overview" className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black p-10 md:p-20 shadow-2xl mb-12">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-black/80" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                
                <div className="relative z-10 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-8 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                        <Sparkles className="w-4 h-4" />
                        Comprehensive Field Manual
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase italic">
                        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Progression</span> Engine
                    </h1>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-light tracking-wide max-w-3xl">
                        Welcome to the Operational Intelligence Network. This foundational manual outlines the precise mechanics surrounding Experience Points (XP), Rank Ascension, Prestige Architecture, and the Procedural Gamification Engine.
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-16 relative">
                
                {/* Sticky Sidebar Navigation */}
                <div className="hidden lg:block w-72 flex-shrink-0">
                    <div className="sticky top-24 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl p-6">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-6 px-4">
                            Index
                        </div>
                        <nav className="flex flex-col space-y-1">
                            {[
                                { id: "overview", label: "Overview", icon: Info, activeText: "text-primary", activeBg: "bg-primary/10", activeBorder: "shadow-primary" },
                                { id: "leveling", label: "Experience & Leveling", icon: TrendingUp, activeText: "text-emerald-400", activeBg: "bg-emerald-400/10", activeBorder: "shadow-emerald-400" },
                                { id: "prestige", label: "Prestige Ascension", icon: Star, activeText: "text-amber-400", activeBg: "bg-amber-400/10", activeBorder: "shadow-amber-400" },
                                { id: "dna", label: "Badges & DNA", icon: Binary, activeText: "text-blue-400", activeBg: "bg-blue-400/10", activeBorder: "shadow-blue-400" },
                                { id: "protocols", label: "Tracking Protocols", icon: Target, activeText: "text-rose-400", activeBg: "bg-rose-400/10", activeBorder: "shadow-rose-400" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollTo(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left",
                                        activeSection === item.id 
                                            ? cn("font-bold shadow-[inset_2px_0_0_var(--current-color)]", item.activeBg, item.activeText, item.activeBorder)
                                            : "text-muted-foreground/60 hover:text-white hover:bg-white/5 font-medium"
                                    )}
                                    style={activeSection === item.id ? { "--current-color": "currentColor" } as React.CSSProperties : undefined}
                                >
                                    <item.icon className={cn("w-4 h-4", activeSection === item.id ? item.activeText : "text-muted-foreground/40")} />
                                    <span className="text-xs uppercase tracking-widest">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 space-y-32 pb-40">
                    
                    {/* Leveling Section */}
                    <div id="leveling" className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                <TrendingUp className="w-7 h-7 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-custom uppercase italic">Experience & Leveling</h2>
                                <p className="text-xs font-black text-emerald-400/60 tracking-[0.2em] uppercase mt-1">Continuous Progression Vectors</p>
                            </div>
                        </div>
                        
                        <div className="prose prose-invert max-w-none mb-12 space-y-6">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Successfully satisfying pipeline requirements and completing <span className="text-white font-bold">Team Quests</span> yields Experience Points (XP). The Quest Engine converts your mundane daily CRM inputs into a Gamified Progression Matrix—whether you're hitting revenue targets, making daily calls, or managing tasks.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Progression utilizes an aggressively calibrated <span className="text-white font-bold">quadratic scaling algorithm</span>. This means that while early levels are achieved rapidly to onboard new recruits, reaching the Master and Grandmaster tiers requires exponentially more XP, demanding sustained, elite performance over months of deployment.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {XP_MILESTONES.map((stone, idx) => (
                                <div key={idx} className="group flex items-start gap-5 p-6 rounded-2xl bg-black/40 border border-white/[0.05] hover:border-white/10 transition-colors">
                                    <div className={cn("w-12 h-12 rounded-full border-4 flex items-center justify-center bg-black/80 text-sm font-black shadow-xl", stone.ring, stone.color)}>
                                        {stone.level}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={cn("text-sm font-black uppercase tracking-widest", stone.color)}>{stone.title}</span>
                                            <span className="text-[10px] font-black text-white/40 tabular-nums px-2 py-1 rounded-md bg-white/5 border border-white/10 uppercase tracking-widest">{stone.xp} XP Required</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">{stone.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* border separator */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Prestige Section */}
                    <div id="prestige" className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                                <Star className="w-7 h-7 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-custom uppercase italic">Prestige Ascension</h2>
                                <p className="text-xs font-black text-amber-400/60 tracking-[0.2em] uppercase mt-1">Permanent Visual Evolution</p>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none mb-12 space-y-6">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Upon finally reaching Level 100 (Grandmaster), the HUD will present the option to execute a <span className="text-amber-400 font-bold">Prestige Protocol</span>. Engaging this ascension temporarily strips you of your Grandmaster status.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Your Level resets to 1, and your current Level XP resets to 0. You return to the rank of Recruit. However, your <span className="text-white font-bold">Lifetime XP is preserved indefinitely</span>, and you permanently unlock a Prestige Tier. 
                            </p>
                            <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-4">
                                <Unlock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                                <p className="text-sm text-amber-400/80 font-medium leading-relaxed">
                                    Prestiging manipulates your underlying DNA algorithm. Achieving higher prestige tiers permanently unlocks glowing border rings, legendary palettes, and intense dynamic visual flair for your HUD's Level Rank Insignia. It represents long-term dedication.
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {PRESTIGE_TIERS.map((tier, idx) => (
                                <div key={idx} className="p-6 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden group">
                                    <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-50 block", tier.color)} />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <Crown className={cn("w-10 h-10 mb-4", tier.iconColor)} />
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Rank {tier.rank}</div>
                                        <div className="text-sm font-black uppercase tracking-widest text-white/90 mb-3">{tier.title}</div>
                                        <p className="text-xs text-muted-foreground/70 leading-relaxed font-medium">{tier.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* border separator */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Badges & DNA */}
                    <div id="dna" className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                                <Binary className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-custom uppercase italic">Badges & Gamification DNA</h2>
                                <p className="text-xs font-black text-blue-400/60 tracking-[0.2em] uppercase mt-1">Procedural Symbolic Architecture</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="p-8 rounded-3xl bg-blue-500/5 border border-blue-500/20 flex flex-col items-center text-center">
                                    <div className="w-32 h-32 rounded-full border border-blue-500/30 flex items-center justify-center mb-6 relative overflow-hidden bg-black/50 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                                        <Shield className="w-16 h-16 text-blue-400" />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent animate-pulse-glow" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/90 mb-3">DNA Vector Graphics</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Every badge earned is cryptographically defined by a compact 6-parameter JSON array. These properties directly dictate the final SVG rendering structure.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[
                                    { title: "Milestone Progression", desc: "Beyond standard XP, specific lifetime accomplishments trigger deterministic generic Badge deployments. Examples include 'First Blood' (Complete 1st Quest) or 'Quest Legend' (Complete 500 Quests).", icon: Activity },
                                    { title: "Combinatorial Assembly", desc: "The rendering engine algorithmically blends Shapes, central Icons, Color Palettes, internal Patterns, exterior Frames, and Rarity intensifiers to create millions of unique possible vector badges.", icon: Box },
                                    { title: "Custom Quest Trophies", desc: "Team Administrators creating new Quests possess the capability to forge customized completion badges for specific goals within the Quest creation wizard.", icon: Trophy },
                                    { title: "HUD Showcasing", desc: "While you may possess hundreds of badges in your lifetime Inventory, you may pin your favorite, highest-rarity badge directly to your main HUD for showcasing to your team.", icon: LayoutTemplate }
                                ].map((feature, i) => (
                                    <div key={i} className="p-6 rounded-2xl bg-black/30 border border-white/5 flex flex-col">
                                        <feature.icon className="w-6 h-6 text-blue-400/60 mb-4" />
                                        <h4 className="text-sm font-black uppercase tracking-widest text-white/80 mb-2">{feature.title}</h4>
                                        <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* border separator */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* CRM Tracking Protocols */}
                    <div id="protocols" className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                                <Target className="w-7 h-7 text-rose-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-custom uppercase italic">CRM Tracking Protocols</h2>
                                <p className="text-xs font-black text-rose-400/60 tracking-[0.2em] uppercase mt-1">Underlying Event Listeners</p>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none mb-10">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                The Quest System is deeply intertwined with the platform's core infrastructure. It does not rely purely on manual input; instead, it subscribes to event hooks across the Database Pipeline. Below is the mapping of which exact operational events satisfy which Quest categories.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {QUEST_PROTOCOLS.map((protocol, idx) => {
                                const Icon = protocol.icon;
                                return (
                                    <div key={idx} className="relative overflow-hidden rounded-3xl bg-black/40 border border-white/[0.05] p-8 lg:p-10 transition-all hover:bg-black/60 hover:border-white/10">
                                        <div className={cn("absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-1000", protocol.glow)} style={{ opacity: 0.05 }} />
                                        
                                        <div className="relative z-10 flex flex-col lg:flex-row gap-10">
                                            
                                            <div className="lg:w-1/3 flex flex-col items-start border-b lg:border-b-0 lg:border-r border-white/5 pb-8 lg:pb-0 lg:pr-10">
                                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl mb-6", protocol.bg, protocol.color, protocol.border)}>
                                                    <Icon className="w-7 h-7" />
                                                </div>
                                                <h3 className={cn("text-xl font-black uppercase tracking-widest leading-tight mb-4", protocol.color)}>
                                                    {protocol.category}
                                                </h3>
                                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                                    {protocol.desc}
                                                </p>
                                            </div>

                                            <div className="lg:w-2/3 flex flex-col justify-center">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                                    {protocol.metrics.map((metric, mIdx) => (
                                                        <div key={mIdx} className="space-y-2 relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-white/20">
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-xs font-black text-white/90 uppercase tracking-widest leading-none">
                                                                    {metric.label}
                                                                </div>
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground/70 leading-relaxed font-medium">
                                                                {metric.desc}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
