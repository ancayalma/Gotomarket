import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { crm_Opportunities } from "@prisma/client";
import {
  CalendarDays,
  ClipboardList,
  CoinsIcon,
  Combine,
  Landmark,
  List,
  SquareStack,
  Text,
  User,
} from "lucide-react";
import moment from "moment";
import { Clapperboard } from "lucide-react";
import { prismadb } from "@/lib/prisma";

interface OppsViewProps {
  data: {
    assigned_sales_stage: { name: string } | null;
    assigned_to_user: { name: string | null } | null;
    assigned_account: { name: string } | null;
    assigned_type: { name: string } | null;
  } & crm_Opportunities;
}

export async function BasicView({ data }: OppsViewProps) {
  //console.log(data, "data");
  const users = await prismadb.users.findMany();
  if (!data) return <div>Opportunity not found</div>;
  return (
    <Card>
      <CardHeader className="pb-4 border-b border-white/5 bg-gradient-to-r from-background to-accent/20">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              {data.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-mono tracking-tighter uppercase border border-white/5">
                ID: {data.id}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform">
                <CoinsIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  Opportunity Amount
                </p>
                <p className="text-lg font-semibold text-emerald-400">
                  {data.currency || '$'} {Number(data.budget).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform">
                <SquareStack className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Stage</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium">
                    {data.assigned_sales_stage?.name || "Not assigned"}
                  </p>
                </div>
              </div>
            </div>

            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform">
                <Combine className="h-5 w-5" />
              </div>
              <div className="space-y-1 overflow-hidden">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Next Step</p>
                <p className="text-sm text-foreground truncate max-w-[300px]" title={data.next_step || ""}>
                  {data.next_step || "Determine next action"}
                </p>
              </div>
            </div>

            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)] group-hover:scale-110 transition-transform">
                <User className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Assigned To</p>
                <p className="text-sm font-medium">{data.assigned_to_user?.name || "Unassigned"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)] group-hover:scale-110 transition-transform">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Account</p>
                <p className="text-sm font-semibold">{data.assigned_account?.name || "Not assigned"}</p>
              </div>
            </div>

            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.1)] group-hover:scale-110 transition-transform">
                <User className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Lead</p>
                <p className="text-sm font-semibold">
                  {(() => {
                    const lead = (data as any).assigned_lead;
                    if (!lead) return "Not assigned";
                    return `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Lead";
                  })()}
                </p>
              </div>
            </div>


            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:scale-110 transition-transform">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Close Date</p>
                <p className="text-sm font-medium">
                  {data.close_date ? moment(data.close_date).format("MMM DD, YYYY") : "No date set"}
                </p>
              </div>
            </div>

            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.1)] group-hover:scale-110 transition-transform">
                <List className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Disposition</p>
                <p className="text-sm font-medium">{data.assigned_type?.name || "N/A"}</p>
              </div>
            </div>

            <div className="group flex items-start space-x-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] border border-transparent hover:border-white/5">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:scale-110 transition-transform">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Project Board</p>
                {(data as any).assigned_project ? (
                  <a
                    href={`/projects/boards/${(data as any).assigned_project.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium underline underline-offset-4 decoration-blue-400/30"
                  >
                    {(data as any).assigned_project.title}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No board created</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50 text-center">Source</p>
            <p className="text-xs font-medium text-center">{data.lead_source || "Direct"}</p>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50 text-center">Created</p>
            <p className="text-xs font-medium text-center">{moment(data.createdAt).format("MMM DD, YYYY")}</p>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50 text-center">Updated</p>
            <p className="text-xs font-medium text-center">{moment(data.updatedAt).format("MMM DD, YYYY")}</p>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50 text-center">Creator</p>
            <p className="text-xs font-medium text-center">Internal System</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
