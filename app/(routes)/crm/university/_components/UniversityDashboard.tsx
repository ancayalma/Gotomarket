"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    Video,
    Trophy,
    GraduationCap,
    PlayCircle,
    FileText,
    GitBranch,
    Layers,
    Workflow,
    FolderKanban,
    BarChart3,
    ShieldCheck,
    Database,
    Share2,
    Bot,
    ArrowRight,
    Medal,
} from "lucide-react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { LearnLink } from "@/components/ui/LearnLink";

// New Phase 1 components
import ComplianceAcademy from "./ComplianceAcademy";

// New Phase 2 components
import RevOpsSimulator from "./RevOpsSimulator";
import IntegrationBlueprints from "./IntegrationBlueprints";

// New Phase 3 components
import CertificationPaths from "./CertificationPaths";
import AIPromptLab from "./AIPromptLab";

// New flow components
import FlowDiagramCard, { PIPELINE_LEGEND, CONVERSION_LEGEND } from "./FlowDiagramCard";
import PipelineFlow, { PIPELINE_STAGES } from "./PipelineStageCard";
import EntityRelationshipView from "./EntityRelationshipView";
import OutreachFlowView from "./OutreachFlowView";
import { MermaidDiagram, CRM_FLOW_DIAGRAM, CONVERSION_FLOW_DIAGRAM, CRM_FLOW_DIAGRAM_MOBILE, CONVERSION_FLOW_DIAGRAM_MOBILE } from "./MermaidDiagram";
import AutoConversionFlow from "./AutoConversionFlow";
import FlowStatsCharts from "./FlowStatsCharts";
import ProjectWorkflowGuide from "./ProjectWorkflowGuide";
import { PROJECT_WORKFLOW_DESKTOP, PROJECT_WORKFLOW_MOBILE, PROJECT_WORKFLOW_LEGEND, CAMPAIGN_PIPELINE_DESKTOP, CAMPAIGN_PIPELINE_MOBILE, CAMPAIGN_PIPELINE_LEGEND } from "./ProjectWorkflowDiagrams";
import TabNavigationCard from "./TabNavigationCard";
import GettingStarted from "./GettingStarted";
import { Rocket } from "lucide-react";

type TabId = "getting-started" | "flow" | "reference" | "project-workflow" | "compliance" | "performance" | "certification" | "prompt-lab";

// Page transition variants
const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

const UNIVERSITY_TABS = [
    {
        id: "getting-started" as TabId,
        label: "Getting Started",
        title: "CRM University",
        description: "Master the complete lead-to-sale flow, track your performance, and level up your sales game.",
        icon: Rocket,
        color: "text-amber-400 group-hover:text-amber-300",
        gradient: "from-amber-600/30 via-amber-500/10 to-transparent",
        borderColor: "border-amber-500/50 ring-amber-500/20",
        shadowColor: "shadow-amber-500/20"
    },
    {
        id: "project-workflow" as TabId,
        label: "Project Workflow",
        title: "Project Workflow",
        description: "Master the end-to-end process of setting up lead pools, launching campaigns, and managing automated outreach.",
        icon: FolderKanban,
        color: "text-indigo-400 group-hover:text-indigo-300",
        gradient: "from-indigo-600/30 via-indigo-500/10 to-transparent",
        borderColor: "border-indigo-500/50 ring-indigo-500/20",
        shadowColor: "shadow-indigo-500/20"
    },
    {
        id: "flow" as TabId,
        label: "CRM Flow",
        title: "CRM Flow",
        description: "Understand the journey of a lead through your system and how automated triggers turn prospects into customers.",
        icon: GitBranch,
        color: "text-blue-400 group-hover:text-blue-300",
        gradient: "from-blue-600/30 via-blue-500/10 to-transparent",
        borderColor: "border-blue-500/50 ring-blue-500/20",
        shadowColor: "shadow-blue-500/20"
    },
    {
        id: "compliance" as TabId,
        label: "Compliance Academy",
        title: "Compliance Academy",
        description: "Master the regulatory landscape of SMS and Email outreach. Get verified, stay compliant, and ensure deliverability.",
        icon: ShieldCheck,
        color: "text-blue-400 group-hover:text-blue-300",
        gradient: "from-blue-600/30 via-blue-500/10 to-transparent",
        borderColor: "border-blue-500/50 ring-blue-500/20",
        shadowColor: "shadow-blue-500/20"
    },

    {
        id: "certification" as TabId,
        label: "Mastery Paths",
        title: "Mastery Paths",
        description: "Professional certification paths to master every aspect of Basalt CRM and level up your career.",
        icon: GraduationCap,
        color: "text-blue-400 group-hover:text-blue-300",
        gradient: "from-blue-600/30 via-blue-500/10 to-transparent",
        borderColor: "border-blue-500/50 ring-blue-500/20",
        shadowColor: "shadow-blue-500/20"
    },
    {
        id: "prompt-lab" as TabId,
        label: "Persona Playbook",
        title: "Persona Playbook",
        description: "Master the art of AI communication and persona management to personalize your outreach at scale.",
        icon: Bot,
        color: "text-emerald-400 group-hover:text-emerald-300",
        gradient: "from-emerald-600/30 via-emerald-500/10 to-transparent",
        borderColor: "border-emerald-500/50 ring-emerald-500/20",
        shadowColor: "shadow-emerald-500/20"
    },
    {
        id: "performance" as TabId,
        label: "Performance Modeler",
        title: "Performance Modeler",
        description: "Model your sales ROI based on lead quality, data health, and AI efficiency improvements.",
        icon: BarChart3,
        color: "text-emerald-400 group-hover:text-emerald-300",
        gradient: "from-emerald-600/30 via-emerald-500/10 to-transparent",
        borderColor: "border-emerald-500/50 ring-emerald-500/20",
        shadowColor: "shadow-emerald-500/20"
    },
    {
        id: "reference" as TabId,
        label: "Quick Reference",
        title: "Quick Reference",
        description: "Essential information at a glance, including pipeline stages, conversion rules, and technical guides.",
        icon: Layers,
        color: "text-emerald-400 group-hover:text-emerald-300",
        gradient: "from-emerald-600/30 via-emerald-500/10 to-transparent",
        borderColor: "border-emerald-500/50 ring-emerald-500/20",
        shadowColor: "shadow-emerald-500/20"
    },
];

interface UniversityDashboardProps {
    plan?: string;
    userLevel?: number;
    user?: any;
}

export default function UniversityDashboard({ plan, userLevel, user }: UniversityDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabId>("getting-started");
    const [activeStage, setActiveStage] = useState<string | undefined>(undefined);

    const availableTabs = useMemo(() => {
        if (plan === "FREE") {
            return UNIVERSITY_TABS.filter(t => !["performance", "certification", "prompt-lab"].includes(t.id));
        }
        return UNIVERSITY_TABS;
    }, [plan]);

    const currentTab = useMemo(() => availableTabs.find(t => t.id === activeTab) || availableTabs[0], [activeTab, availableTabs]);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col"
            >
                <Heading
                    title={currentTab?.title || "CRM University"}
                    description={currentTab?.description || "Master the complete lead-to-sale flow, track your performance, and level up your sales game."}
                />
                <Separator className="mt-4" />
            </motion.div>

            {/* Navigation Cards Grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={cn(
                    "grid gap-2 md:gap-3 mb-6 bg-transparent",
                    availableTabs.length <= 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
                )}
            >
                {availableTabs.map((tab, index: number) => (
                    <TabNavigationCard
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        color={tab.color}
                        gradient={tab.gradient}
                        borderColor={tab.borderColor}
                        shadowColor={tab.shadowColor}
                        isActive={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id as TabId)}
                    />
                ))}
            </motion.div>

            <AnimatePresence mode="wait">

                {/* Getting Started Tab */}
                {activeTab === "getting-started" && (
                    <motion.div
                        key="getting-started"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <LearnLink
                            tab="getting-started"
                            overviewTitle="Foundations of BASALT"
                            overviewWhat="The entry point for mastering the CRM's core philosophy and layout."
                            overviewWhy="CRM platforms can be overwhelming. Starting here ensures you understand the high-level relationship between accounts, leads, and sales automation before you start clicking."
                            overviewHow="Follow the 'Critical Path' guide below. Complete each milestone to earn your first platform badge and unlock more advanced outreach tools."
                        />
                        <GettingStarted plan={plan} />
                    </motion.div>
                )}

                {/* Flow Architecture Tab */}
                {activeTab === "flow" && (
                    <motion.div
                        key="flow"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <LearnLink
                            tab="flow"
                            overviewTitle="Neural Flow Architecture"
                            overviewWhat="A technical and strategic visualization of how data moves from a raw internet signal to a closed deal."
                            overviewWhy="Understanding the 'Under the Hood' logic prevents confusion when automated events occur (like why a lead moved stages). It empowers you to build better workflows."
                            overviewHow="Review the Mermaid diagrams to see the branching logic. Hover over the stage cards below to see the specific system events that trigger a status change."
                        />

                        {/* Main Pipeline Mermaid Diagram */}
                        <FlowDiagramCard
                            title="Complete CRM Pipeline Flow"
                            description="Interactive diagram showing lead acquisition through post-sale"
                            accentColor="blue"
                            legend={PIPELINE_LEGEND}
                        >
                            <MermaidDiagram chart={CRM_FLOW_DIAGRAM} mobileChart={CRM_FLOW_DIAGRAM_MOBILE} />
                        </FlowDiagramCard>

                        {/* Stats Charts */}
                        {plan !== "FREE" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                                    Pipeline Analytics (Sample Data)
                                </h3>
                                <FlowStatsCharts />
                            </motion.div>
                        )}

                        {/* Auto-Conversion Flow */}
                        <FlowDiagramCard
                            title="Auto-Conversion Rules"
                            description="How leads automatically convert to contacts and accounts"
                            accentColor="emerald"
                        >
                            <AutoConversionFlow />
                        </FlowDiagramCard>

                        {/* Conversion Mermaid Diagram */}
                        <FlowDiagramCard
                            title="Conversion Flow Diagram"
                            description="See how leads automatically become contacts and accounts"
                            accentColor="violet"
                            legend={CONVERSION_LEGEND}
                        >
                            <MermaidDiagram chart={CONVERSION_FLOW_DIAGRAM} mobileChart={CONVERSION_FLOW_DIAGRAM_MOBILE} />
                        </FlowDiagramCard>

                        {/* Entity Relationships */}
                        <FlowDiagramCard
                            title="Entity Relationships"
                            description="How CRM entities connect and convert"
                            accentColor="amber"
                        >
                            <EntityRelationshipView />
                        </FlowDiagramCard>

                        {/* Outreach Channels */}
                        <FlowDiagramCard
                            title="Outreach Channels"
                            description="Communication endpoints and their triggers"
                            accentColor="rose"
                        >
                            <OutreachFlowView />
                        </FlowDiagramCard>
                        {/* Architecture Integrations */}
                        <FlowDiagramCard
                            title="System Integrations"
                            description="Technical blueprints for external API services"
                            accentColor="violet"
                        >
                            <IntegrationBlueprints />
                        </FlowDiagramCard>
                    </motion.div>
                )}

                {/* Compliance Academy Tab */}
                {activeTab === "compliance" && (
                    <motion.div
                        key="compliance"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <LearnLink
                            tab="compliance"
                            overviewTitle="Trust & Deliverability Academy"
                            overviewWhat="The definitive guide to staying legal and professional in the world of high-velocity digital outreach."
                            overviewWhy="One bad campaign can blacklist your entire domain. Mastery of these rules ensures your messages actually reach the inbox and that your brand remains respected."
                            overviewHow="Study the SMS and Email modules. Complete the 'Compliance Checklist' before launching any campaign reaching over 1,000 prospects."
                        />
                        <ComplianceAcademy />
                    </motion.div>
                )}


                {/* Mastery Paths Tab */}
                {activeTab === "certification" && (
                    <motion.div
                        key="certification"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <LearnLink
                            tab="certification"
                            overviewTitle="Professional Mastery Center"
                            overviewWhat="The career-building hub where you can prove your expertise in CRM operations and Sales AI."
                            overviewWhy="Certifications standardized the team's skillset. Earning these badges demonstrates to leadership that you are capable of managing complex automation and high-value accounts."
                            overviewHow="Enroll in a Mastery Path. Complete the interactive assessments and pass the final simulation to earn your digital certificate and platform profile badge."
                        />
                        <CertificationPaths userLevel={userLevel} user={user} />
                    </motion.div>
                )}

                {/* Persona Playbook Tab */}
                {activeTab === "prompt-lab" && (
                    <motion.div
                        key="prompt-lab"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <LearnLink
                            tab="prompt-lab"
                            overviewTitle="AI Persona Engineering"
                            overviewWhat="The collaborative workspace for iterating on the 'brain center' of your AI outreach agents."
                            overviewWhy="Generic AI sounds like a robot. This lab allows you to fine-tune the tone, empathy, and technical depth of your agents to ensure they represent your brand perfectly."
                            overviewHow="Use the playground to test prompt variations. Compare output results against your 'Golden Dataset' and push the winning persona to your live campaigns."
                        />
                        <AIPromptLab />
                    </motion.div>
                )}

                {/* Performance Modeler Tab */}
                {activeTab === "performance" && (
                    <motion.div
                        key="performance"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <LearnLink
                            tab="roi-modeler"
                            overviewTitle="Strategic Performance Modeler"
                            overviewWhat="A mathematical simulator for projecting revenue outcomes based on your current outreach efficiency."
                            overviewWhy="Sales is a numbers game. This tool allows you to see the exact financial impact of improving your lead quality or AI reply rates by just 1 or 2 percent."
                            overviewHow="Adjust the sliders to match your current metrics. Watch the 'Projected Revenue' chart update in real-time to identify which optimization will have the highest ROI."
                        />
                        <RevOpsSimulator />
                    </motion.div>
                )}


                {/* Quick Reference Tab */}
                {activeTab === "reference" && (
                    <motion.div
                        key="reference"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <LearnLink
                            tab="reference"
                            overviewTitle="Sales Operations Almanac"
                            overviewWhat="The rapid-access encyclopedia for all technical terms, stage definitions, and system shortcuts."
                            overviewWhy="Speed is leverage. This section provides the precise 'meaning of truth' for every field in the CRM so there is never ambiguity during team handoffs."
                            overviewHow="Scroll through the Stage Overview grid for quick definitions. Use the 'What Happens Automatically' section to troubleshoot system behavior."
                        />

                        {/* Stage Overview Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {PIPELINE_STAGES.map((stg, index) => {
                                const Icon = stg.icon;
                                return (
                                    <motion.div
                                        key={stg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className={`${stg.bgColor} ${stg.borderColor} border h-full`}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-5 h-5 ${stg.color}`} />
                                                    <CardTitle className={`text-sm ${stg.color}`}>
                                                        {stg.displayName}
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-xs text-muted-foreground mb-3">{stg.description}</p>
                                                <div className="space-y-1">
                                                    {stg.activities.map((act, i) => (
                                                        <div key={i} className="text-xs flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${stg.color.replace("text-", "bg-")}`} />
                                                            {act}
                                                        </div>
                                                    ))}
                                                </div>
                                                {stg.triggerNote && (
                                                    <Badge variant="outline" className="mt-3 text-xs">
                                                        {stg.triggerNote}
                                                    </Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Conversion Rules - Plain English */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">What Happens Automatically</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="p-4 rounded-lg bg-card border border-border"
                                >
                                    <h4 className="font-semibold text-sm text-sky-500 flex items-center gap-2">
                                        Contact → Lead & Opportunity
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        When a person at an Account shows interest, you can promote them from a <strong>Contact</strong> to a <strong>Lead</strong>. This signals qualified intent and allows you to create an <strong>Opportunity</strong>.
                                    </p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="p-4 rounded-lg bg-card border border-border"
                                >
                                    <h4 className="font-semibold text-sm text-emerald-500 flex items-center gap-2">
                                        Opportunity → Project
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        When you <strong>Close Won</strong> an Opportunity, it automatically creates a <strong>Project</strong> board. This seamlessly triggers the hand-off from sales to delivery.
                                    </p>
                                </motion.div>
                            </CardContent>
                        </Card>

                        <div className="pt-4 border-t border-white/5 space-y-8">
                            <div>
                                <h3 className="text-2xl font-black flex items-center gap-3">
                                    <GraduationCap className="w-7 h-7 text-primary" />
                                    Learning Center
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">Master BasaltCRM with these essential guides and tutorials.</p>
                            </div>

                            <Card className="bg-white/5 border-white/10 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-50" />
                                <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-6 relative z-10 min-h-[300px]">
                                    <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                        <Bot className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Interactive NotebookLM Guides</h3>
                                        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed mt-2">
                                            Listen to AI-generated deep dives into your CRM data and standard operating procedures.
                                        </p>
                                    </div>

                                    <div className="w-full max-w-md bg-black/30 border border-white/10 rounded-xl p-4 mt-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                                    <PlayCircle className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-white">BasaltCRM Architecture Deep Dive</p>
                                                    <p className="text-xs text-gray-400">NotebookLM Audio Overview</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                12:45
                                            </Badge>
                                        </div>
                                        <audio
                                            controls
                                            className="w-full h-10 mt-2 filter invert opacity-90 grayscale contrast-125"
                                            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                                            preload="metadata"
                                        >
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}

                {/* Project Workflow Tab */}
                {activeTab === "project-workflow" && (
                    <motion.div
                        key="project-workflow"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <LearnLink
                            tab="project-workflow"
                            overviewTitle="Campaign Execution Strategy"
                            overviewWhat="A step-by-step masterclass in launching and scaling a new sales initiative."
                            overviewWhy="Moving from 'one-off sales' to 'scaled operations' requires a predictable sequence. This workflow ensures no step is missed during the transition from list building to outreach."
                            overviewHow="Follow the visual 'Setup to Launch' flow. Reference the 'Pool Management' guide to see how to properly shard your lead lists for maximum agent efficiency."
                        />
                        <ProjectWorkflowGuide />

                        {/* Campaign Pipeline Flow - Brand Identity Data Flow */}
                        <div className="mt-4">
                            <FlowDiagramCard
                                title="Campaign Pipeline — Brand Identity Flow"
                                description="Your Brand Identity is set up once and flows automatically through every stage. Campaigns inherit company context, the LeadGen Wizard pre-fills ICP targeting, and the Outreach Wizard builds AI prompts — all from your brand data. Zero re-typing."
                                accentColor="violet"
                                legend={CAMPAIGN_PIPELINE_LEGEND}
                            >
                                <MermaidDiagram
                                    chart={CAMPAIGN_PIPELINE_DESKTOP}
                                    mobileChart={CAMPAIGN_PIPELINE_MOBILE}
                                />
                            </FlowDiagramCard>
                        </div>

                        <div className="mt-4">
                            <FlowDiagramCard
                                title="Visual Workflow: From Setup to Launch"
                                description="How projects, pools, and outreach allow for scalable outreach."
                                accentColor="blue"
                                legend={PROJECT_WORKFLOW_LEGEND}
                            >
                                <MermaidDiagram
                                    chart={PROJECT_WORKFLOW_DESKTOP}
                                    mobileChart={PROJECT_WORKFLOW_MOBILE}
                                />
                            </FlowDiagramCard>
                        </div>
                    </motion.div>
                )}


            </AnimatePresence>
        </div>
    );
}
