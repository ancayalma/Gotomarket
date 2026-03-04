"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users2,
  Zap,
  Contact,
  LandmarkIcon,
  HeartHandshake,
  Coins,
  FilePenLine,
  FolderKanban,
  CheckSquare,
  Target,
  FileText,
  HardDrive,
  LucideIcon,
  Megaphone,
  LayoutGrid,
  Phone,
  Wand2,
  Folder,
  Shield,
  CheckCircle2,
  Radio,
  Headset,
  BarChart3,
  Package,
  Info,
  Rocket,
  BrainCircuit,
  History,
  HeartPulse,
  GraduationCap,
  List,
  Medal,
  Lock,
  Sword,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardCard from "../../crm/dashboard/_components/DashboardCard";
import { useDashboardLayout } from "../../crm/dashboard/_context/DashboardLayoutContext";
import { useDashboardData } from "../../crm/dashboard/_context/DashboardDataContext";
import { X, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { useState } from "react";

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  TrendingUp,
  Users2,
  Zap,
  Contact,
  LandmarkIcon,
  HeartHandshake,
  Coins,
  FilePenLine,
  FolderKanban,
  CheckSquare,
  Target,
  FileText,
  HardDrive,
  Megaphone,
  LayoutGrid,
  Phone,
  Wand2,
  Folder,
  Shield,
  CheckCircle2,
  Radio,
  Headset,
  BarChart3,
  Package,
  Rocket,
  BrainCircuit,
  History,
  HeartPulse,
  GraduationCap,
  List,
  Sword
};

interface EntityItem {
  id: string;
  name: string;
  value: number;
  href: string;
  iconName: string;
  color: string;
  tooltip?: string;
  modal?: "lead_wizard" | "university_rank" | "none"; // Updated: support non-clickable cards
}

interface EntityBreakdownProps {
  title: string;
  entities: EntityItem[];
  className?: string;
  hideHeader?: boolean;
  headerAction?: React.ReactNode;
}

const colorStyles: Record<string, { bg: string; border: string; icon: string }> = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "text-cyan-500" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", icon: "text-violet-500" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-500" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-500" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-500" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", icon: "text-rose-500" },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: "text-indigo-500" },
  pink: { bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "text-pink-500" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "text-orange-500" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/20", icon: "text-teal-500" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "text-yellow-500" },
};

// Mobile info popover component
function MobileInfoButton({ tooltip, entityName }: { tooltip: string; entityName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="md:hidden absolute top-2 right-2 z-30 w-5 h-5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 hover:border-white/40 transition-colors duration-200"
        aria-label={`Info about ${entityName}`}
      >
        <Info className="w-3 h-3" />
      </button>

      {/* Mobile popover overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[100] flex items-end justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Popover card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm mx-4 mb-8 rounded-2xl border border-white/15 bg-[#18181b]/95 backdrop-blur-xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-wide uppercase">{entityName}</h4>
            </div>
            <p className="text-[13px] leading-relaxed text-white/75">{tooltip}</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}

// Selection Modal for Lead Wizard
function LeadWizardSelectionModal({
  isOpen,
  onClose,
  activeJobs
}: {
  isOpen: boolean;
  onClose: () => void;
  activeJobs: any[]
}) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[#0f1115] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Wand2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Active Scrapes</h3>
                <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest mt-1">Select a pool to oversee progress</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeJobs.length > 0 ? (
            activeJobs.map((job) => {
              const pool = job.assigned_pool;
              const name = pool?.name || "Unnamed Pool";
              const id = pool?.id;

              return (
                <button
                  key={job.id}
                  onClick={() => {
                    if (id) router.push(`/lists/${id}`);
                    onClose();
                  }}
                  className="w-full text-left p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white uppercase tracking-tight">{name}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black uppercase tracking-widest px-1.5 h-4">Active</Badge>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">Started {new Date(job.startedAt).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Managing List</p>
                        <p className="text-xs font-bold text-white/60">View Details</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </div>
                  {/* Progress Line */}
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 w-1/3 group-hover:w-full transition-all duration-700" />
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                <LayoutGrid className="w-6 h-6 text-white/20" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/60 uppercase tracking-widest">No Active Scrapes</p>
                <p className="text-xs text-gray-600 mt-1 uppercase tracking-tight">Run the Lead Generation Wizard from the Accounts page to start discovery.</p>
              </div>
              <button
                onClick={() => {
                  router.push("/crm/accounts");
                  onClose();
                }}
                className="mt-4 px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[10px] font-black text-white uppercase tracking-widest"
              >
                Go to Accounts
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black text-white uppercase tracking-widest transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Rank Modal for University
function UniversityRankModal({
  isOpen,
  onClose,
  masteryLevel,
  userLevel,
  userName
}: {
  isOpen: boolean;
  onClose: () => void;
  masteryLevel: number;
  userLevel: number;
  userName: string;
}) {
  const prestigeGrade = Math.ceil(masteryLevel / 5);

  const phases = [
    { title: "Foundation", range: "1-5", grade: 1, color: "text-blue-400", bg: "bg-blue-400/20" },
    { title: "Data Pioneer", range: "6-10", grade: 2, color: "text-cyan-400", bg: "bg-cyan-400/20" },
    { title: "Outreach Architect", range: "11-15", grade: 3, color: "text-emerald-400", bg: "bg-emerald-400/20" },
    { title: "Automation Specialist", range: "16-20", grade: 4, color: "text-violet-400", bg: "bg-violet-400/20" },
    { title: "Strategic Master", range: "21-25", grade: 5, color: "text-amber-400", bg: "bg-amber-400/20" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-xl bg-[#0f1115] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <GraduationCap className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Mission Profile</h3>
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">Personnel Ranking System</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* User Hero */}
          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Employee Name</p>
              <p className="text-lg font-bold text-white tracking-tight">{userName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Clearance Level</p>
              <p className="text-3xl font-black text-white italic">{userLevel}</p>
            </div>
          </div>

          {/* Mastery Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Platform Mastery Path</p>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Level {masteryLevel} / 25</p>
            </div>
            <div className="flex gap-1.5 h-3">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-sm transition-all duration-500",
                    i < masteryLevel ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" : "bg-white/5"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Prestige Phase indicator */}
          <div className="grid grid-cols-5 gap-3">
            {phases.map((phase) => (
              <div key={phase.grade} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-full aspect-square rounded-xl border flex items-center justify-center transition-all duration-500",
                  prestigeGrade >= phase.grade
                    ? `${phase.bg} border-white/20 shadow-lg`
                    : "bg-transparent border-white/5 opacity-20"
                )}>
                  {prestigeGrade >= phase.grade ? (
                    <Medal className={cn("w-5 h-5", phase.color)} />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <p className={cn(
                  "text-[8px] font-black uppercase tracking-tighter text-center leading-none",
                  prestigeGrade >= phase.grade ? "text-white" : "text-gray-600"
                )}>
                  {phase.title.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 leading-relaxed text-center italic">
            Your rank is determined by platform authority and technical mastery of the CRM ecosystem. Reach Level 25 to achieve Ultimate Prestige status.
          </p>
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5 flex gap-3">
          <Link href="/crm/university" className="flex-1" onClick={onClose}>
            <button className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-indigo-500/20">
              Open Training Center
            </button>
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-widest transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function EntityBreakdown({
  title,
  entities,
  className,
  hideHeader = false,
  headerAction,
}: EntityBreakdownProps) {
  const { widgets, isEditMode, toggleWidgetVisibility } = useDashboardLayout();
  const { leadGenStats, masteryLevel, userLevel, userName } = useDashboardData();
  const [activeModal, setActiveModal] = useState<"lead_wizard" | "university_rank" | null>(null);

  // Filter entities based on visibility in DashboardLayoutContext
  const visibleEntities = entities.filter(entity => {
    const widget = widgets.find(w => w.id === entity.id);
    return widget ? widget.isVisible : true; // Default to visible if not found
  });

  const total = visibleEntities.reduce((sum, e) => sum + e.value, 0);

  if (visibleEntities.length === 0 && !isEditMode) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          !hideHeader && "rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6",
          className
        )}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">{title}</h3>
            <div className="flex items-center gap-4">
              {headerAction ? headerAction : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{total}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    Total Records
                  </span>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Entity grid using DashboardCard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleEntities.map((entity, index) => {
            const Icon = iconMap[entity.iconName] || DollarSign;

            // Map Entity colors to DashboardCard variants for base structure
            let variant: "default" | "success" | "info" | "violet" | "warning" = "default";
            if (entity.color === "emerald" || entity.color === "teal") variant = "success";
            if (entity.color === "cyan" || entity.color === "blue") variant = "info";
            if (entity.color === "violet" || entity.color === "indigo" || entity.color === "pink") variant = "violet";
            if (entity.color === "amber" || entity.color === "orange" || entity.color === "yellow" || entity.color === "rose") variant = "warning";

            const percentage = total > 0 ? ((entity.value / total) * 100).toFixed(1) : "0";
            const colors = colorStyles[entity.color] || colorStyles.cyan;

            return (
              <motion.div
                key={entity.id}
                data-tour-id={
                  entity.id === "entity:outreach" ? "tour-campaigns" :
                    entity.id === "entity:lead_wizard" ? "tour-lead-wizard" :
                      entity.id === "entity:lead_pools" ? "tour-lists" :
                        undefined
                }
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative group"
              >
                {isEditMode && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWidgetVisibility(entity.id, false);
                    }}
                    className="absolute -top-2 -right-2 z-50 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors border-2 border-white/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Desktop: Tooltip on hover */}
                {entity.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {entity.modal === "lead_wizard" ? (
                        <div
                          onClick={() => setActiveModal("lead_wizard")}
                          className={cn("block group h-full cursor-pointer", isEditMode && "pointer-events-none")}
                        >
                          <DashboardCard
                            icon={Icon}
                            label={entity.name}
                            count={entity.value}
                            description={`${percentage}% of records`}
                            variant={variant}
                            className={cn("transition-colors duration-300", colors.bg, colors.border, isEditMode && "opacity-50 grayscale-[0.5]")}
                            iconClassName={colors.icon}
                          />
                        </div>
                      ) : entity.modal === "university_rank" ? (
                        <div
                          onClick={() => setActiveModal("university_rank")}
                          className={cn("block group h-full cursor-pointer", isEditMode && "pointer-events-none")}
                        >
                          <DashboardCard
                            icon={Icon}
                            label={entity.name}
                            count={entity.value}
                            description={`${percentage}% of records`}
                            variant={variant}
                            className={cn("transition-colors duration-300", colors.bg, colors.border, isEditMode && "opacity-50 grayscale-[0.5]")}
                            iconClassName={colors.icon}
                          />
                        </div>
                      ) : entity.modal === "none" ? (
                        <Link href={entity.href} className={cn("block group h-full", isEditMode && "pointer-events-none")}>
                          <DashboardCard
                            icon={Icon}
                            label={entity.name}
                            count={entity.value}
                            description={`${percentage}% of records`}
                            variant={variant}
                            className={cn("transition-colors duration-300", colors.bg, colors.border, isEditMode && "opacity-50 grayscale-[0.5]")}
                            iconClassName={colors.icon}
                          />
                        </Link>
                      ) : (
                        <Link href={entity.href} className={cn("block group h-full", isEditMode && "pointer-events-none")}>
                          <DashboardCard
                            icon={Icon}
                            label={entity.name}
                            count={entity.value}
                            description={`${percentage}% of records`}
                            variant={variant}
                            className={cn("transition-colors duration-300", colors.bg, colors.border, isEditMode && "opacity-50 grayscale-[0.5]")}
                            iconClassName={colors.icon}
                          />
                        </Link>
                      )}
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="hidden md:block max-w-[260px] rounded-xl border border-white/15 bg-[#18181b]/95 backdrop-blur-xl px-4 py-3 shadow-2xl"
                    >
                      <p className="text-[12px] leading-relaxed text-white/80 font-medium">{entity.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link href={entity.href} className={cn("block group h-full", isEditMode && "pointer-events-none")}>
                    <DashboardCard
                      icon={Icon}
                      label={entity.name}
                      count={entity.value}
                      description={`${percentage}% of records`}
                      variant={variant}
                      className={cn("transition-colors duration-300", colors.bg, colors.border, isEditMode && "opacity-50 grayscale-[0.5]")}
                      iconClassName={colors.icon}
                    />
                  </Link>
                )}

                {/* Mobile: Info button with popover */}
                {entity.tooltip && (
                  <MobileInfoButton tooltip={entity.tooltip} entityName={entity.name} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Modals */}
        <LeadWizardSelectionModal
          isOpen={activeModal === "lead_wizard"}
          onClose={() => setActiveModal(null)}
          activeJobs={leadGenStats?.activeJobs || []}
        />
        <UniversityRankModal
          isOpen={activeModal === "university_rank"}
          onClose={() => setActiveModal(null)}
          masteryLevel={masteryLevel || 1}
          userLevel={userLevel || 1}
          userName={userName || "Personnel"}
        />
      </motion.div>
    </TooltipProvider>
  );
}
