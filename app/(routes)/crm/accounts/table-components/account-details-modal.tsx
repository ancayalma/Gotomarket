import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Account } from "../table-data/schema";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2 } from "lucide-react";
import moment from "moment";

interface Props {
  account: Account | null;
  onClose: () => void;
}

export function AccountDetailsModal({ account, onClose }: Props) {
  if (!account) return null;

  const additionalEmails = account.additional_emails || [];

  return (
    <Dialog open={!!account} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-zinc-950 border-zinc-800 shadow-2xl">
        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
                  {account.name}
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-sm mt-1">
                  Complete account details and intelligence.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 italic">Account Routing</h4>
                <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 space-y-4 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-2 w-full min-w-0">
                      <div>
                        <span className="text-xs font-medium text-zinc-400 block mb-1">Primary Routing</span>
                        <div className="text-sm font-semibold truncate text-zinc-200 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg inline-block">
                          {account.email || "No primary email"}
                        </div>
                      </div>
                      
                      {additionalEmails.length > 0 && (
                         <div className="pt-2 border-t border-zinc-800/50">
                           <span className="text-xs font-medium text-zinc-400 block mb-2">Additional Intelligence</span>
                           <div className="flex flex-col gap-1.5">
                             {additionalEmails.map((e, idx) => (
                               <Badge variant="secondary" key={idx} className="font-normal text-xs bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border-indigo-500/20 justify-start px-2.5 py-1">
                                 {e}
                               </Badge>
                             ))}
                           </div>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 italic">Lifecycle Status</h4>
                <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 space-y-3 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Assigned To</span>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">
                      {account.assigned_to_user?.name || "Unassigned"}
                    </Badge>
                  </div>
                  {account.status && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                      <span className="text-zinc-400">Status</span>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                        {account.status}
                      </Badge>
                    </div>
                  )}
                  {account.type && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                      <span className="text-zinc-400">Type</span>
                      <span className="font-medium text-zinc-300">{account.type}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 italic">Decision Makers</h4>
                <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 space-y-3 hover:border-zinc-700 transition-colors">
                  {account.contacts && account.contacts.length > 0 ? (
                    <div className="space-y-3">
                      {account.contacts.map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                            {c.first_name?.[0] || ""}{c.last_name?.[0] || ""}
                          </div>
                          <div className="text-sm font-medium text-zinc-200">
                            {c.first_name} {c.last_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-zinc-500 italic">No contacts registered for this account.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 italic">Company Profile</h4>
                <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 space-y-3 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Location</span>
                    <span className="text-zinc-300 font-medium text-right">
                      {[account.billing_city, account.billing_state, account.billing_country].filter(Boolean).join(", ") || "Unknown"}
                    </span>
                  </div>
                  {account.employees && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                      <span className="text-zinc-400">Employees</span>
                      <span className="font-medium text-zinc-300">{account.employees}</span>
                    </div>
                  )}
                  {account.annual_revenue && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                      <span className="text-zinc-400">Revenue</span>
                      <span className="font-medium text-zinc-300">{account.annual_revenue}</span>
                    </div>
                  )}
                  {account.vat && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                      <span className="text-zinc-400">VAT / Tax ID</span>
                      <span className="font-mono text-[10px] bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-500">
                        {account.vat}
                      </span>
                    </div>
                  )}
                  {account.description && (
                    <div className="pt-2 border-t border-zinc-800/50">
                      <span className="text-zinc-400 text-sm block mb-1">Intelligence Notes</span>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                        {account.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 italic">System Footprint</h4>
                <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 space-y-3 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Created</span>
                    <span className="text-zinc-300 font-medium">
                      {account.createdAt ? moment(account.createdAt).format("MMM Do YYYY, h:mm a") : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                    <span className="text-zinc-400">UUID</span>
                    <span className="font-mono text-[10px] bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-500">
                      {account.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
