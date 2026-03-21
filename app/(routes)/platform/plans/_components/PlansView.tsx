"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash, Package, Check, Shield, Zap, Target, Users as UsersIcon, HardDrive, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { CRM_MODULES } from "@/lib/role-permissions";
import { createPlan, updatePlan, deletePlan } from "@/actions/plans/plan-actions";

type Plan = {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    max_users: number;
    max_storage: number;
    max_credits: number;
    features: string[];
    isActive: boolean;
    billing_cycle: "MONTHLY" | "YEARLY" | "LIFETIME" | "ONE_TIME";
    grace_period_days: number;
};

type Props = {
    initialPlans: Plan[];
};

const AVAILABLE_FEATURES = [
    { id: "all", label: "FULL ACCESS (Enterprise Mode)" },
    ...CRM_MODULES.map(m => ({
        id: m.id,
        label: m.name
    }))
];

const PlansView = ({ initialPlans }: Props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const [formData, setFormData] = useState<Partial<Plan>>({
        name: "",
        slug: "",
        price: 0,
        currency: "USD",
        max_users: 1,
        max_storage: 1000,
        max_credits: 0,
        features: [],
        isActive: true,
        billing_cycle: "MONTHLY",
        grace_period_days: 7,
    });

    const openCreate = () => {
        setEditingPlan(null);
        setFormData({
            name: "",
            slug: "",
            price: 0,
            currency: "USD",
            max_users: 1,
            max_storage: 1000,
            max_credits: 0,
            features: [],
            isActive: true,
            billing_cycle: "MONTHLY",
            grace_period_days: 7,
        });
        setIsDialogOpen(true);
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData(plan);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast.error("Name and Slug are required");
            return;
        }

        try {
            setIsLoading(true);
            let res: any;
            if (editingPlan) {
                res = await updatePlan(editingPlan.id, formData);
            } else {
                res = await createPlan(formData);
            }

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(editingPlan ? "Plan updated" : "Plan created");
                setIsDialogOpen(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFeature = (featureId: string) => {
        setFormData(prev => {
            const current = prev.features || [];
            if (current.includes(featureId)) {
                return { ...prev, features: current.filter(f => f !== featureId) };
            } else {
                return { ...prev, features: [...current, featureId] };
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase">
                        Tier Management Studio
                    </h1>
                    <p className="text-muted-foreground mt-1">Configure global subscription plans and module bundles.</p>
                </div>
                <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold italic uppercase px-6 py-6 h-auto shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2" />
                    Forge New Tier
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialPlans.map((plan) => (
                    <Card key={plan.id} className={`group relative overflow-hidden transition-colors duration-300 hover:border-primary/50 ${!plan.isActive ? 'opacity-60' : ''}`}>
                        <div className="absolute top-0 right-0 p-4">
                            {!plan.isActive && <Badge variant="destructive">Inactive</Badge>}
                        </div>

                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <Badge variant="outline" className="font-mono text-[10px] tracking-widest uppercase py-0">{plan.slug}</Badge>
                            </div>
                            <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">{plan.name}</CardTitle>
                            <CardDescription className="line-clamp-1">{plan.description || "Global subscription tier"}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">{plan.currency} {plan.price}</span>
                                <span className="text-muted-foreground text-sm">/ {plan.billing_cycle.toLowerCase()}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-4 border-y border-white/5">
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{plan.max_users === -1 ? "Infinite" : plan.max_users} Users</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{plan.max_storage === -1 ? "Infinite" : `${plan.max_storage} MB`}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{plan.max_credits === -1 ? "Infinite" : plan.max_credits} AI</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{plan.features.length} Modules</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Featured Modules</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {plan.features.includes("all") ? (
                                        <Badge variant="default" className="bg-primary/20 text-primary border-primary/20">FULL ECOSYSTEM</Badge>
                                    ) : (
                                        plan.features.slice(0, 5).map(f => (
                                            <Badge key={f} variant="secondary" className="bg-white/5 text-[10px] uppercase">{f}</Badge>
                                        ))
                                    )}
                                    {plan.features.length > 5 && !plan.features.includes("all") && (
                                        <Badge variant="secondary" className="bg-white/5 text-[10px]">+{plan.features.length - 5} MORE</Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex gap-2 pt-0">
                            <Button variant="outline" className="flex-1 font-bold uppercase italic text-xs h-10 border-white/5 hover:bg-white/5" onClick={() => openEdit(plan)}>
                                <Edit className="w-3.5 h-3.5 mr-2" />
                                Edit Tier
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deletePlan(plan.id)}>
                                <Trash className="w-3.5 h-3.5" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Editing/Creation Page Overlay (Simulated via Dialog for keep it one page as requested) */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="h-full flex flex-col max-w-6xl mx-auto p-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
                                    {editingPlan ? "Configure Tier" : "Forge New Tier"}
                                </h2>
                                <p className="text-muted-foreground">Define limits, pricing, and module DNA.</p>
                            </div>
                            <Button variant="outline" className="border-white/10" onClick={() => setIsDialogOpen(false)}>Close Studio</Button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-hidden">
                            {/* Left: General Config */}
                            <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-4">
                                <div className="space-y-4 p-6 bg-zinc-900/40 rounded-2xl border border-white/5">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Core Identity</h3>
                                    <div className="space-y-2">
                                        <Label>Plan Name</Label>
                                        <Input
                                            className="bg-black/40 border-white/10"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Pro Plan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slug (System ID)</Label>
                                        <Input
                                            className="bg-black/40 border-white/10 font-mono"
                                            value={formData.slug}
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
                                                setFormData({ ...formData, slug: val });
                                            }}
                                            placeholder="PRO-PLAN"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            className="bg-black/40 border-white/10"
                                            value={formData.description || ""}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Quick summary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-6 bg-zinc-900/40 rounded-2xl border border-white/5">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Financials</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Price</Label>
                                            <Input
                                                type="number"
                                                className="bg-black/40 border-white/10"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Currency</Label>
                                            <Input
                                                className="bg-black/40 border-white/10 uppercase"
                                                value={formData.currency}
                                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Billing Cycle</Label>
                                        <Select
                                            value={formData.billing_cycle}
                                            onValueChange={(val: any) => setFormData({ ...formData, billing_cycle: val })}
                                        >
                                            <SelectTrigger className="bg-black/40 border-white/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                <SelectItem value="YEARLY">Yearly</SelectItem>
                                                <SelectItem value="LIFETIME">Lifetime</SelectItem>
                                                <SelectItem value="ONE_TIME">One Time</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4 p-6 bg-zinc-900/40 rounded-2xl border border-white/5">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Guard Rails</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Max Users</Label>
                                            <Input
                                                type="number"
                                                className="bg-black/40 border-white/10"
                                                value={formData.max_users}
                                                onChange={(e) => setFormData({ ...formData, max_users: Number(e.target.value) })}
                                            />
                                            <p className="text-[10px] text-muted-foreground">-1 for infinite</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Storage (MB)</Label>
                                            <Input
                                                type="number"
                                                className="bg-black/40 border-white/10"
                                                value={formData.max_storage}
                                                onChange={(e) => setFormData({ ...formData, max_storage: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                                        <Label htmlFor="active-plan" className="cursor-pointer">Active in Marketplace</Label>
                                        <Switch
                                            id="active-plan"
                                            checked={formData.isActive}
                                            onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Center/Right: Module DNA */}
                            <div className="lg:col-span-8 flex flex-col overflow-hidden bg-zinc-900/40 rounded-3xl border border-white/5">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Module Ecosystem</h3>
                                        <p className="text-xs text-muted-foreground">Select which modules are baked into this tier.</p>
                                    </div>
                                    <Badge variant="outline" className="text-primary border-primary/20">
                                        {formData.features?.includes("all") ? "ALL ACCESS" : `${formData.features?.length} Modules Active`}
                                    </Badge>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {AVAILABLE_FEATURES.map((feature) => (
                                            <div
                                                key={feature.id}
                                                className={`flex items-center space-x-3 p-4 rounded-2xl border transition-colors cursor-pointer group ${formData.features?.includes(feature.id)
                                                        ? "bg-primary/10 border-primary/50 text-white shadow-lg shadow-primary/5"
                                                        : "bg-black/40 border-white/5 text-muted-foreground hover:border-white/10"
                                                    }`}
                                                onClick={() => toggleFeature(feature.id)}
                                            >
                                                <div className={`p-1 rounded-md ${formData.features?.includes(feature.id) ? 'bg-primary text-black' : 'bg-white/5 text-white/40'}`}>
                                                    <Check className="w-3 h-3" strokeWidth={4} />
                                                </div>
                                                <span className="text-sm font-bold tracking-tight">{feature.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end gap-3">
                                    <Button variant="ghost" className="font-bold uppercase italic" onClick={() => setIsDialogOpen(false)}>Abort Process</Button>
                                    <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic px-10">
                                        {isLoading ? "Synchronizing..." : editingPlan ? "Update Tier DNA" : "Forge Tier"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlansView;
