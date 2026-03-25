import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2, Phone, Copy, Check, ExternalLink } from "lucide-react";
import moment from "moment";
import { toast } from "react-hot-toast";

interface Props {
  lead: any | null;
  onClose: () => void;
  getStatusStyles: (status: string) => string;
}

export function ListLeadDetailsModal({ lead, onClose, getStatusStyles }: Props) {
  if (!lead) return null;

  const contacts = lead._allContacts || [{
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      jobTitle: lead.jobTitle,
      contactId: lead.contactId,
  }];
  
  // Merge contact-level emails with account-level emails from the linked crm_Accounts record
  const contactEmails = contacts.map((c: any) => c.email).filter(Boolean) as string[];
  const accountEmailsSet = new Set<string>();
  if (lead.accountEmail) accountEmailsSet.add(lead.accountEmail);
  if (lead.accountAdditionalEmails) lead.accountAdditionalEmails.forEach((e: string) => accountEmailsSet.add(e));
  // Prioritize: account primary email first, then account additional, then contact emails
  const allEmails = [...Array.from(accountEmailsSet), ...contactEmails];
  const uniqueEmails = Array.from(new Set(allEmails));
  const uniquePhones = Array.from(new Set(contacts.map((c: any) => c.phone).filter(Boolean))) as string[];

  return (
    <Dialog open={!!lead} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-zinc-950 border-zinc-800 shadow-2xl">
        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
                  {lead.company || lead.lastName || "Unknown Account"}
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-sm mt-1">
                  List Details & Discovered Intelligence
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
                        {uniqueEmails[0] ? (
                          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">
                            <span className="text-sm font-semibold text-zinc-200 break-all flex-1">{uniqueEmails[0]}</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(uniqueEmails[0]); toast.success("Copied!"); }}
                              className="shrink-0 p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                              title="Copy email"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`mailto:${uniqueEmails[0]}`}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition-colors"
                              title="Send email"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <div className="text-sm text-zinc-500 italic bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">No primary email</div>
                        )}
                      </div>
                      
                      {uniqueEmails.length > 1 && (
                         <div className="pt-2 border-t border-zinc-800/50">
                           <span className="text-xs font-medium text-zinc-400 block mb-2">Additional Intelligence</span>
                           <div className="flex flex-col gap-1.5">
                             {uniqueEmails.slice(1).map((e, idx) => (
                               <div key={idx} className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2.5 py-1">
                                 <span className="text-xs text-indigo-300 break-all flex-1">{e}</span>
                                 <button
                                   onClick={() => { navigator.clipboard.writeText(e); toast.success("Copied!"); }}
                                   className="shrink-0 p-0.5 rounded hover:bg-indigo-500/20 text-indigo-400/50 hover:text-indigo-300 transition-colors"
                                   title="Copy email"
                                 >
                                   <Copy className="w-3 h-3" />
                                 </button>
                                 <a
                                   href={`mailto:${e}`}
                                   onClick={(ev) => ev.stopPropagation()}
                                   className="shrink-0 p-0.5 rounded hover:bg-indigo-500/20 text-indigo-400/50 hover:text-indigo-300 transition-colors"
                                   title="Send email"
                                 >
                                   <ExternalLink className="w-3 h-3" />
                                 </a>
                               </div>
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
                  {lead.status && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Pipeline Status</span>
                      <Badge variant="outline" className={`font-mono text-[10px] uppercase tracking-wider border ${getStatusStyles(lead.status)}`}>
                        {lead.status === 'CONVERTED' ? 'In CRM' : (lead.status || "New")}
                      </Badge>
                    </div>
                  )}
                  {uniquePhones.length > 0 && (
                    <div className="flex justify-between items-start text-sm pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Phone className="w-3 h-3" />
                        <span>Phones</span>
                      </div>
                      <div className="flex flex-col text-right">
                        {uniquePhones.map((p, i) => (
                          <span key={i} className="font-medium text-zinc-300">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 italic">Decision Makers</h4>
                <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 space-y-3 hover:border-zinc-700 transition-colors">
                  {contacts && contacts.length > 0 ? (
                    <div className="space-y-3">
                      {contacts.map((c: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 pt-3 border-t border-zinc-800/50 first:pt-0 first:border-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                            {c.firstName?.[0] || ""}{c.lastName?.[0] || ""}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-zinc-200">
                              {c.firstName} {c.lastName}
                            </span>
                            {c.jobTitle && (
                              <span className="text-xs text-zinc-500 truncate">{c.jobTitle}</span>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                {c.email && <span className="text-[10px] text-zinc-400 truncate border border-zinc-800/50 rounded px-1">{c.email}</span>}
                                {c.contactId && <Badge variant="outline" className="text-[8px] h-4 py-0 px-1 border-indigo-500/20 text-indigo-400 bg-indigo-500/10">In CRM</Badge>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-zinc-500 italic">No contacts registered.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 italic">System Footprint</h4>
                <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 space-y-3 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Imported On</span>
                    <span className="text-zinc-300 font-medium">
                      {lead.createdAt ? moment(lead.createdAt).format("MMM Do YYYY, h:mm a") : "Unknown"}
                    </span>
                  </div>
                  {lead.accountId && (
                     <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                        <span className="text-zinc-400">Account ID</span>
                        <span className="font-mono text-[10px] bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-500">
                          {lead.accountId}
                        </span>
                     </div>
                  )}
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                    <span className="text-zinc-400">Lead Record ID</span>
                    <span className="font-mono text-[10px] bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-500">
                      {lead.id.slice(0, 12)}...
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
