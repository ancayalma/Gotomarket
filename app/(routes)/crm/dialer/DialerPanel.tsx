'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

import PromptGeneratorPanel from '../prompt/PromptGeneratorPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useVaruniLink } from '@/app/hooks/use-varuni-link';
import { Zap, Shield, XCircle, Phone } from 'lucide-react';

function isE164(num: string) {
  return /^\+[1-9]\d{1,14}$/.test(num);
}

function parseList(raw: string): { phone: string; leadId?: string }[] {
  const lines = (raw || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => !!l);
  const items: { phone: string; leadId?: string }[] = [];
  for (const line of lines) {
    const parts = line.split(/[,|]/).map((p) => p.trim());
    const phone = parts[0] || '';
    let leadId: string | undefined = undefined;
    if (parts.length > 1) {
      leadId = parts[1] || undefined;
    } else {
      const m = /leadId\s*=\s*([A-Za-z0-9_-]+)/i.exec(line);
      if (m) leadId = m[1];
    }
    items.push({ phone, leadId });
  }
  return items;
}

export default function DialerPanel({ isCompact = false }: { isCompact?: boolean }) {
  const [singlePhone, setSinglePhone] = useState<string>('');
  const [singleLeadId, setSingleLeadId] = useState<string>('');
  const [listRaw, setListRaw] = useState<string>('');
  const [running, setRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [status, setStatus] = useState<'available' | 'break' | 'offline'>('available');
  const [callActive, setCallActive] = useState<boolean>(false);

  const [results, setResults] = useState<{ phone: string; leadId?: string; ok: boolean; transactionId?: string; error?: string }[]>([]);
  const stopRef = useRef<boolean>(false);

  // VaruniLink Integration
  const { activeBattlecards, processTranscriptStream, dismissBattlecard } = useVaruniLink(null);

  // Simulate transcript stream for demo purposes when running
  useEffect(() => {
    if (!running && results.length === 0) return;

    // Mock: emits random keywords every few seconds to test battlecards
    const mockInterval = setInterval(() => {
      const keywords = ["competitor", "price", "hubspot", "salesforce", "too expensive"];
      const randomWord = keywords[Math.floor(Math.random() * keywords.length)];
      // console.log("Simulating transcript word:", randomWord);
      processTranscriptStream(`User said something about ${randomWord} just now.`);
    }, 5000);

    return () => clearInterval(mockInterval);
  }, [running, results, processTranscriptStream]);

  const parsedList = useMemo(() => parseList(listRaw), [listRaw]);

  const runSingle = useCallback(async () => {
    try {
      const phone = singlePhone.trim();
      const leadId = singleLeadId.trim() || undefined;

      if (!isE164(phone)) {
        throw new Error('Invalid phone (E.164 required, e.g. +15551234567)');
      }

      // Trigger direct ElevenLabs SIP outbound call via AWS Chime SMA
      const res = await fetch('/api/voice/elevenlabs/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: phone,
          agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT,
          leadId,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error?.message || j?.error || 'Outbound call failed');
      }

      setResults((prev) => [{ phone, leadId, ok: true, transactionId: String(j?.result?.TransactionId || 'outbound'), error: undefined }, ...prev].slice(0, 100));
      toast.success(`ElevenLabs Agent dispatched to ${phone}`);
    } catch (e: any) {
      setResults((prev) => [{ phone: singlePhone.trim(), leadId: singleLeadId.trim() || undefined, ok: false, error: e?.message || String(e) }, ...prev].slice(0, 100));
      toast.error(e?.message || 'Failed to start');
    }
  }, [singlePhone, singleLeadId]);

  const stopRun = useCallback(() => {
    stopRef.current = true;
    setRunning(false);
  }, []);

  const runListSequential = useCallback(async () => {
    if (!parsedList.length) {
      toast.error('Enter at least one phone number');
      return;
    }
    stopRef.current = false;
    setRunning(true);
    setCurrentIndex(0);
    for (let i = 0; i < parsedList.length; i++) {
      if (stopRef.current) break;
      const { phone, leadId } = parsedList[i];
      setCurrentIndex(i);
      try {
        const num = String(phone).trim();
        if (!isE164(num)) {
          throw new Error(`Invalid E.164: ${num}`);
        }
        // Trigger direct ElevenLabs SIP outbound call via AWS Chime SMA
        const res = await fetch('/api/voice/elevenlabs/outbound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: num,
            agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT,
            leadId,
          }),
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(j?.error?.message || j?.error || 'Outbound call failed');
        }
        setResults((prev) => [{ phone: num, leadId, ok: true, transactionId: String(j?.result?.TransactionId || 'outbound'), error: undefined }, ...prev].slice(0, 100));
      } catch (e: any) {
        setResults((prev) => [{ phone, leadId, ok: false, error: e?.message || String(e) }, ...prev].slice(0, 100));
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
    setRunning(false);
    setCurrentIndex(-1);
    toast.success('Run complete');
  }, [parsedList]);



  function appendDial(char: string) {
    setSinglePhone((prev) => {
      let base = (prev || '').replace(/[^\d+]/g, '');
      if (char === '+') return base.startsWith('+') ? base : '+' + base;
      if (!base.startsWith('+')) base = '+' + base.replace(/^\+*/, '');
      const digit = char.replace(/[^\d]/g, '');
      return base + digit;
    });
  }
  function backspaceDial() {
    setSinglePhone((prev) => {
      const base = prev || '';
      if (!base) return '';
      const next = base.slice(0, -1);
      return next === '+' ? '' : next;
    });
  }
  function clearDial() {
    setSinglePhone('');
  }

  const FullLayout = () => (
    <div className="w-full px-1 py-2 space-y-4">


      {/* Single Dial */}
      <section className="rounded-md border bg-card p-4">
        <div className={cn("grid gap-3", isCompact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
          <div>
            <label className="text-xs font-medium">Phone (E.164)</label>
            <Input
              id="full-single-phone"
              name="single-phone"
              placeholder="+18885551212"
              value={singlePhone}
              onChange={(e) => setSinglePhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Lead ID (optional)</label>
            <Input
              id="full-single-lead-id"
              name="single-lead-id"
              placeholder="lead-id-123"
              value={singleLeadId}
              onChange={(e) => setSingleLeadId(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={runSingle} disabled={!singlePhone.trim()}>
              Dial Now
            </Button>
          </div>
        </div>
      </section>

      {/* List Dial */}
      {!isCompact && (
        <section className="rounded-md border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Custom Call List</h3>
          <div className="space-y-2">
            <label className="text-xs font-medium">Numbers (one per line). Optional leadId by comma or pipe.</label>
            <Textarea
              id="full-list-raw"
              name="list-raw"
              rows={8}
              placeholder={`+18885551212\n+18885551213,lead-123\n+18885551214|lead-456`}
              value={listRaw}
              onChange={(e) => setListRaw(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button onClick={runListSequential} disabled={!parsedList.length || running}>
                {running ? `Running (${currentIndex + 1}/${parsedList.length})` : 'Run'}
              </Button>
              {running && (
                <Button variant="outline" onClick={stopRun}>
                  Stop
                </Button>
              )}
            </div>
            <p className="microtext text-muted-foreground">
              Example lines: +15551234567 or +15551234567,lead-789 or +15551234567|lead-789
            </p>
          </div>
        </section>
      )}

      {/* Active Battlecards (VaruniLink) */}
      {!isCompact && activeBattlecards.length > 0 && (
        <section className="rounded-md border-emerald-500/30 bg-emerald-500/5 p-4 border animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-emerald-600">Live Battlecards (VaruniLink)</h3>
          </div>
          <div className="space-y-3">
            {activeBattlecards.map(card => (
              <div key={card.id} className="bg-background/80 border border-amber-200/50 p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">{card.trigger_keyword} Detected</span>
                  <button onClick={() => dismissBattlecard(card.id)}><XCircle className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
                </div>
                <h4 className="font-bold text-sm mt-1">{card.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{card.content}</p>
                <div className="mt-2 space-y-1">
                  {card.counter_arguments.map((arg, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{arg}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent results */}
      {!isCompact && (
        <section className="rounded-md border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Recent Results</h3>
          <div className="text-xs space-y-1">
            {results.length === 0 && <div className="opacity-70">No calls yet.</div>}
            {results.slice(0, 25).map((r, idx) => (
              <div key={`${r.phone}-${idx}`} className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded ${r.ok ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {r.ok ? 'OK' : 'ERR'}
                </span>
                <span className="font-mono">{r.phone}</span>
                {r.leadId ? <span className="opacity-70">({r.leadId})</span> : null}
                {r.ok ? (
                  <span className="opacity-80">tx={r.transactionId || '-'}</span>
                ) : (
                  <span className="opacity-80">error={r.error || '-'}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prompt Generator */}
      {!isCompact && (
        <section className="rounded-md border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Prompt Generator</h3>
          <PromptGeneratorPanel 
            embedded={true} 
            showSoftphone={false} 
            onPushToDialer={(targetLeadId, targetPhone) => {
              setSingleLeadId(targetLeadId);
              setSinglePhone(targetPhone);
            }}
          />
        </section>
      )}
    </div>
  );

  if (!isCompact) {
    return <FullLayout />;
  }

  // Compact Layout (Tabs)
  return (
    <div className={cn("w-full flex flex-col", isCompact ? "h-[480px]" : "h-full")}>
      <Tabs defaultValue="dial" className="w-full h-full flex flex-col min-h-0">
        <div className="px-3 py-1.5 border-b bg-muted/20 flex-none">
          <TabsList className="grid w-full grid-cols-4 h-9 p-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
            <TabsTrigger value="dial" className="text-[10px] font-black uppercase tracking-widest py-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-300">Phone</TabsTrigger>
            <TabsTrigger value="list" className="text-[10px] font-black uppercase tracking-widest py-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-300">List</TabsTrigger>
            <TabsTrigger value="history" className="text-[10px] font-black uppercase tracking-widest py-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-300">History</TabsTrigger>
            <TabsTrigger value="settings" className="text-[10px] font-black uppercase tracking-widest py-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-300">Config</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <TabsContent value="dial" className="mt-0 p-3 space-y-2 overflow-hidden flex-none">
            {/* Status Controls */}
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus('available')}
                className={cn("flex flex-col h-14 gap-1 border-emerald-500/10 bg-emerald-500/[0.03] backdrop-blur-sm hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 rounded-xl group", status === 'available' && "border-emerald-500/50 bg-emerald-500/10 shadow-[0_8px_32px_rgba(16,185,129,0.15)] text-emerald-400 font-black tracking-widest")}
              >
                <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,1)]" />
                <span className="text-[9px] uppercase font-bold tracking-tighter">Available</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus('break')}
                className={cn("flex flex-col h-12 gap-1 border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-300", status === 'break' && "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)] text-amber-400 font-bold")}
              >
                <Zap className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-[9px] uppercase font-bold tracking-tighter">Break</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus('offline')}
                className={cn("flex flex-col h-12 gap-1 border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all duration-300", status === 'offline' && "border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)] text-rose-400 font-bold")}
              >
                <XCircle className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-[9px] uppercase font-bold tracking-tighter">Offline</span>
              </Button>
            </div>

            {/* Active Call Section */}
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <div className="grid grid-cols-3 gap-1.5">
                <Button variant="outline" size="sm" className="bg-emerald-500/5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-7 gap-1 px-1">
                  <Phone className="h-2.5 w-2.5" /> <span className="text-[9px] font-bold tracking-tighter">Answer</span>
                </Button>
                <Button variant="outline" size="sm" className="bg-red-500/5 border-red-500/30 text-red-500 hover:bg-red-500/10 h-7 gap-1 px-1">
                  <XCircle className="h-2.5 w-2.5" /> <span className="text-[9px] font-bold tracking-tighter">End</span>
                </Button>
                <Button variant="outline" size="sm" className="bg-emerald-500/5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-7 gap-1 px-1">
                  <XCircle className="h-2.5 w-2.5 rotate-45" /> <span className="text-[9px] font-bold tracking-tighter">Close</span>
                </Button>
              </div>
            </div>

            {/* Keypad Section */}
            <div className="p-2 bg-black/20 rounded-xl border border-white/5 space-y-2.5 shadow-inner">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative col-span-2">
                  <Input
                    id="compact-single-phone"
                    name="single-phone"
                    placeholder="Enter Number..."
                    value={singlePhone}
                    onChange={(e) => setSinglePhone(e.target.value)}
                    className="h-14 bg-emerald-950/40 border-emerald-500/30 text-center text-2xl font-mono tracking-[0.4em] text-emerald-400 focus-visible:ring-emerald-500/30 pr-10 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border-t-emerald-500/40"
                  />
                  <button
                    onClick={backspaceDial}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  id="compact-single-lead-id"
                  name="single-lead-id"
                  placeholder="Lead ID (Opt)"
                  value={singleLeadId}
                  onChange={(e) => setSingleLeadId(e.target.value)}
                  className="h-8 bg-black/40 border-white/10 text-[10px] col-span-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '+', 0, 'CLR'].map(key => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => key === 'CLR' ? clearDial() : appendDial(String(key))}
                    className="h-10 bg-emerald-500/[0.03] border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 text-lg font-bold transition-all duration-200 p-0 rounded-lg active:scale-90"
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <Button
                onClick={runSingle}
                className="relative overflow-hidden w-full h-12 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase tracking-[0.3em] text-[11px] gap-2 shadow-[0_8px_25px_-5px_rgba(16,185,129,0.4)] transition-all duration-500 hover:shadow-[0_12px_35px_-5px_rgba(16,185,129,0.5)] active:scale-95 border-none group"
                disabled={!singlePhone.trim()}
              >
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg]" /> <Phone className="h-4 w-4 relative z-10" /> <span className="relative z-10">Voice Start</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0 p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <label className="text-xs font-medium">Bulk Dial List</label>
              <Textarea
                id="compact-list-raw"
                name="list-raw"
                rows={12}
                className="font-mono text-xs"
                placeholder={`+18885550001\n+18885550002,lead-A`}
                value={listRaw}
                onChange={(e) => setListRaw(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={runListSequential} disabled={!parsedList.length || running}>
                {running ? 'Running...' : 'Start Batch'}
              </Button>
              {running && <Button size="sm" variant="destructive" onClick={stopRun}>Stop</Button>}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 p-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              {results.length === 0 && <div className="text-sm text-center py-8 text-muted-foreground">No recent calls</div>}
              {results.map((r, i) => (
                <div key={i} className="flex items-start justify-between p-2 rounded border bg-card/50 text-xs text-[10px]">
                  <div>
                    <div className="font-mono font-medium">{r.phone}</div>
                    {r.leadId && <div className="text-muted-foreground opacity-60 text-[9px]">{r.leadId}</div>}
                  </div>
                  <div className={cn("px-1 py-0.5 rounded font-bold text-[8px]", r.ok ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500")}>
                    {r.ok ? 'OK' : 'ERR'}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 p-4 h-full overflow-y-auto flex-1 min-h-0">
            <div className="text-[10px] text-muted-foreground mb-4 opacity-70">
              Configure agent prompts and settings. call scripts.
            </div>
            <PromptGeneratorPanel 
              embedded={true} 
              showSoftphone={false} 
              onPushToDialer={(targetLeadId, targetPhone) => {
                setSingleLeadId(targetLeadId);
                setSinglePhone(targetPhone);
              }}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
