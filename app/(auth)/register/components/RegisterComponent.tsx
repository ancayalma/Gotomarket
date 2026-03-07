"use client";
import { z } from "zod";
import axios from "axios";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { Plus, Check, Shield, Zap, Target, Users as UsersIcon, HardDrive, CreditCard, ChevronRight, Sparkles, Calendar, Info, Wallet, Eye, EyeOff, User, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from '@marsidev/react-turnstile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PaymentModal } from "@/app/(routes)/invoice/detail/[invoiceId]/_components/PaymentModal";

interface RegisterComponentProps {
  availablePlans: any[];
  initialPlanSlug?: string;
  initialCycle?: string;
}

export function RegisterComponent({ availablePlans, initialPlanSlug, initialCycle }: RegisterComponentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">((initialCycle as any) || "monthly");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
  const [wallet, setWallet] = useState("");

  // Legal Agreements
  const [termsRead, setTermsRead] = useState(process.env.NODE_ENV === "development" ? false : false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [dataPolicyRead, setDataPolicyRead] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [openDataPolicy, setOpenDataPolicy] = useState(false);

  const handleScrollToBottom = (e: React.UIEvent<HTMLDivElement>, setter: (val: boolean) => void) => {
    // Add 10px tolerance for scaling issues
    const isAtBottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 10;
    if (isAtBottom) {
      setter(true);
    }
  };

  const formSchema = z.object({
    companyName: z.string().min(2, "Company name is required").max(50),
    planId: z.string().min(1, "Please select a plan"),
    firstName: z.string().min(2, "First name is required").max(50),
    lastName: z.string().min(2, "Last name is required").max(50),
    phone: z.string().min(10, "Valid phone number required for KYC").max(20),
    username: z.string().min(3).max(50),
    email: z.string().email().refine((email) => {
      const personalDomains = ["gmail.com", "icloud.com", "yahoo.com", "hotmail.com", "outlook.com", "me.com"];
      const domain = email.split("@")[1]?.toLowerCase();
      return !personalDomains.includes(domain);
    }, {
      message: "Personal email addresses are restricted. Please use your official workspace email."
    }),
    language: z.string().min(2).max(50),
    password: z
      .string()
      .min(15, "SOC2 Compliance: Minimum length is 15 characters.")
      .max(128), // Support long passphrases per NIST
    confirmPassword: z.string(),
    avatar: z.string().min(1, "Profile photo is required"),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service and Privacy Policy.",
    }),
    turnstile_token: z.string().optional(),
  });

  type BillboardFormValues = z.infer<typeof formSchema>;

  const form = useForm<BillboardFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      planId: "",
      firstName: "",
      lastName: "",
      phone: "",
      username: "",
      email: "",
      language: "en",
      password: "",
      confirmPassword: "",
      avatar: "",
      termsAccepted: false,
      turnstile_token: "",
    },
  });

  React.useEffect(() => {
    if (initialPlanSlug) {
      const plan = availablePlans.find(p => p.slug.toLowerCase() === initialPlanSlug.toLowerCase());
      if (plan) {
        form.setValue("planId", plan.id);
      }
    }
  }, [initialPlanSlug, availablePlans, form]);

  const onSubmit = async (data: BillboardFormValues) => {
    if (data.password !== data.confirmPassword) {
      form.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }

    setIsLoading(true);
    try {
      const submissionData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
        billingCycle,
        paymentMethod,
        wallet: wallet.startsWith("0x") ? wallet : undefined
      };

      const response = await axios.post("/api/user", submissionData);

      if (response.data.requiresPayment && response.data.paymentUrl) {
        setPaymentUrl(response.data.paymentUrl);
        setActiveInvoiceId(response.data.invoiceId);
        setPaymentAmount(response.data.amount);
        setPaymentModalOpen(true);

        toast({
          title: "Account Created (Pending Payment)",
          description: "Please complete the secure checkout to activate your team.",
        });
      } else {
        toast({
          title: "Success",
          description: "User created successfully, please login.",
        });
        router.push("/sign-in");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };


  return (
    <Card className="shadow-lg my-5 w-full max-w-lg sm:max-w-xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Create Account</CardTitle>
        <CardDescription>Enter your information to create an account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 overflow-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} suppressHydrationWarning={true}>
            {/* Avatar Section */}
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel className="mb-2">Profile Photo <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center space-y-4">
                        <div
                          className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-dashed border-primary/30 flex items-center justify-center bg-muted/20 group hover:border-primary/60 transition-[color,background-color,border-color,box-shadow] cursor-pointer shadow-sm hover:shadow-md"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {field.value ? (
                            <>
                              <img src={field.value} alt="Avatar Preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Upload className="h-6 w-6 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center">
                              <User className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">Upload</span>
                            </div>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => field.onChange(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 rounded-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          {field.value ? "Change Avatar" : "Choose Profile Photo"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Fields */}
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Entity / Team Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} autoComplete="organization" placeholder="e.g. Acme Corporation LLC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-6">
                {/* Billing Cycle Toggle */}
                <div className="flex flex-col space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Billing Strategic Cycle</Label>
                  <div className="flex bg-zinc-900/50 p-1.5 rounded-xl border border-white/5 relative">
                    <button
                      type="button"
                      onClick={() => { setBillingCycle("monthly"); setPaymentMethod("card"); }}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors",
                        billingCycle === "monthly" ? "bg-zinc-800 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("annual")}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors relative overflow-hidden",
                        billingCycle === "annual" ? "bg-zinc-800 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      Annual Account
                      <span className={cn("ml-2 text-[9px] px-1.5 py-0.5 rounded-full",
                        (paymentMethod === 'crypto' && wallet.length === 42) ? "bg-emerald-500/20 text-emerald-400" : "bg-primary/20 text-primary")}>
                        {(paymentMethod === 'crypto' && wallet.length === 42) ? '-25%' : '-20%'}
                      </span>
                    </button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => {
                    const selectedPlan = availablePlans.find(p => p.id === field.value);
                    const isFree = selectedPlan?.price === 0 || selectedPlan?.slug === "FREE";
                    return (
                      <FormItem>
                        <FormLabel>Selected Tier <span className="text-red-500">*</span></FormLabel>
                        <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-zinc-900/50 border-white/10 hover:border-primary/50 transition-colors font-bold italic">
                              <SelectValue placeholder="Identify your strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-950 border-zinc-800">
                            {availablePlans
                              .filter(plan => !["TESTING", "EXEMPT", "ENTERPRISE"].includes(plan.slug))
                              .map((plan) => {
                                const isFreePlan = plan.price === 0 || plan.slug === "FREE";
                                return (
                                <SelectItem 
                                  key={plan.id} 
                                  value={plan.id}
                                  disabled={!isFreePlan}
                                  className={!isFreePlan ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <div className="flex flex-col py-1">
                                    <span className="font-bold">{plan.name} {!isFreePlan && "(Coming Soon)"}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest text-primary/80">
                                      {plan.price === 0 
                                        ? "FREE FOREVER" 
                                        : billingCycle === "monthly"
                                          ? `${plan.currency || "$"} ${plan.price} / MONTH`
                                          : `${plan.currency || "$"} ${Math.round((paymentMethod === 'crypto' && wallet.length === 42) ? (plan.price * 12 * 0.75) : (plan.price * 12 * 0.8))} / YEAR`}
                                    </span>
                                  </div>
                                </SelectItem>
                              )})}
                          </SelectContent>
                        </Select>

                        {selectedPlan && (
                          <div className="mt-4 p-5 rounded-2xl border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-5">
                              <Shield className="w-24 h-24 rotate-12" />
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-primary animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Module DNA (RBAC)</span>
                              </div>
                              <ul className="grid grid-cols-2 gap-2">
                                {selectedPlan.features.includes("all") ? (
                                  <li className="col-span-2 text-[11px] text-white font-bold flex items-center gap-2">
                                    <Check className="w-3 h-3 text-primary" />
                                    FULL ECOSYSTEM (29+ MODULES)
                                  </li>
                                ) : (
                                  selectedPlan.features.map((f: string) => (
                                    <li key={f} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                                      {f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' ')}
                                    </li>
                                  )).slice(0, 8)
                                )}
                              </ul>
                              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Initial Settlement</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black italic">
                                      ${billingCycle === "monthly"
                                        ? selectedPlan.price
                                        : Math.round((paymentMethod === 'crypto' && wallet.length === 42) ? (selectedPlan.price * 12 * 0.75) : (selectedPlan.price * 12 * 0.8))}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{billingCycle === "annual" ? "/ Year" : "/ Mo"}</span>
                                  </div>
                                </div>
                                {billingCycle === "annual" && (
                                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/5 font-black italic">
                                    {(paymentMethod === 'crypto' && wallet.length === 42) ? "25% P2P DISCOUNT" : "20% ANNUAL DISCOUNT"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {!isFree && selectedPlan && (
                          <div className="mt-6">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-2 block ml-1">P2P Discount Activator</Label>
                            <div className="relative group">
                              <div className={cn("absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-primary rounded-xl blur opacity-10 transition duration-500", wallet.length === 42 ? "opacity-40" : "group-hover:opacity-20")}></div>
                              <div className="relative">
                                <Wallet className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", wallet.length === 42 ? "text-emerald-400" : "text-zinc-600")} />
                                <Input
                                  placeholder="Paste Wallet (0x...) for 25% Off"
                                  value={wallet}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setWallet(val);
                                    if (val.length === 42 && val.startsWith("0x")) {
                                      setPaymentMethod("crypto");
                                      setBillingCycle("annual");
                                    } else if (val.length === 0) {
                                      setPaymentMethod("card");
                                    }
                                  }}
                                  className={cn("bg-zinc-900/50 border-white/10 h-12 text-xs font-mono pl-11", wallet.length === 42 ? "border-emerald-500/50 text-emerald-400" : "")}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal First Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} autoComplete="given-name" placeholder="e.g. John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Last Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} autoComplete="family-name" placeholder="e.g. Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Contact Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            disabled={isLoading} 
                            autoComplete="tel" 
                            placeholder="(555) 000-0000" 
                            {...field} 
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} autoComplete="username" placeholder="e.g. jdoe_global" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work E-mail <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" inputMode="email" disabled={isLoading} placeholder="legal@your-workspace.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input disabled={isLoading} autoComplete="new-password" placeholder="Min 15 characters recommended (SOC2)" type={show ? "text" : "password"} {...field} className="pr-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <button type="button" aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-10 text-gray-400 hover:text-primary transition-colors" onClick={() => setShow(!show)}>
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input disabled={isLoading} autoComplete="new-password" placeholder="Confirm your long password…" type={show ? "text" : "password"} {...field} className="pr-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <button type="button" aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-10 text-gray-400 hover:text-primary transition-colors" onClick={() => setShow(!show)}>
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => {
                    const allRead = termsRead && privacyRead && dataPolicyRead;

                    return (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 bg-zinc-900/50 p-4 relative mb-2">
                      <div className="flex items-start space-x-3 w-full">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || !allRead}
                            className={cn("mt-0.5", !allRead && "opacity-50 cursor-not-allowed")}
                          />
                        </FormControl>
                        <div className="space-y-2 w-full">
                          <label className="text-xs font-medium leading-relaxed text-zinc-300 block">
                            I accept the 
                            <button type="button" onClick={() => setOpenTerms(true)} className={cn("mx-1 hover:underline italic font-bold", termsRead ? "text-emerald-400" : "text-primary")}>Terms of Service {termsRead && "✓"}</button>, 
                            <button type="button" onClick={() => setOpenPrivacy(true)} className={cn("mx-1 hover:underline italic font-bold", privacyRead ? "text-emerald-400" : "text-primary")}>Privacy Policy {privacyRead && "✓"}</button>, and 
                            <button type="button" onClick={() => setOpenDataPolicy(true)} className={cn("mx-1 hover:underline italic font-bold", dataPolicyRead ? "text-emerald-400" : "text-primary")}>AI Data Processing Agreement {dataPolicyRead && "✓"}</button>
                          </label>
                          <FormDescription className="text-[10px] text-zinc-500 max-w-[90%] block">
                            By enabling this, you agree to our terms, privacy policies, and crucial rules for AI processing on your CRM data.
                            <br/>
                            <span className={cn("font-bold mt-1 inline-block text-[10px]", allRead ? "text-emerald-500/80" : "text-amber-500/80")}>
                                {allRead ? "All documents reviewed. You may proceed." : "⚠️ You must read and scroll to the bottom of all 3 documents before accepting."}
                            </span>
                          </FormDescription>
                        </div>
                      </div>
                    </FormItem>
                  )}}
                />

                {/* Terms of Service Modal */}
                <Dialog open={openTerms} onOpenChange={setOpenTerms}>
                   <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl shadow-primary/10">
                      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                          <DialogTitle className="text-2xl font-black italic tracking-tighter text-white uppercase italic">Terms of Service</DialogTitle>
                          <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest", termsRead ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/20")}>
                            {termsRead ? "Read & Acknowledged" : "Scrolling Required"}
                          </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 text-sm text-zinc-400 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800" onScroll={(e) => handleScrollToBottom(e, setTermsRead)}>
                         <section>
                            <p className="text-zinc-200 leading-relaxed font-medium">
                                Last updated: December 1, 2025. Please read these Terms of Service carefully before using BasaltCRM.
                            </p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">1. Accounts</h3>
                            <p>When you create an account, you must provide information that is accurate, complete, and current. You are responsible for safeguarding your password and for any activities under your account.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">2. Subscriptions and Payments</h3>
                            <p>Service is billed on a subscription basis in advance (monthly or annually). Payments are processed through our secure payment providers. Cancellations take effect at the end of the current billing cycle.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">3. Intellectual Property</h3>
                            <p>BasaltCRM and its original content, features, and functionality remain the exclusive property of BasaltCRM. Our AI models, proprietary agents, and synthesis layers are protected by international law.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">4. AI and Data Usage</h3>
                            <p>BasaltCRM utilizes AI models to provide our service. data is processed through these models to synthesize insights. We may use anonymized data to improve global performance unless opted out via Enterprise settings.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">5. Termination</h3>
                            <p>We reserve the right to suspend or terminate accounts for breaches of these Terms, including unauthorized scraping of platform intelligence or bypassing security metadata.</p>
                         </section>

                         <div className="pt-12 pb-8 flex flex-col items-center gap-4">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                            {termsRead ? (
                               <Button 
                                  onClick={() => setOpenTerms(false)} 
                                  className="text-[11px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 h-auto rounded-full transition-all duration-300 transform hover:scale-105"
                               >
                                  Review Complete & Close ✓
                               </Button>
                            ) : (
                               <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                                  Keep scrolling to finish...
                               </span>
                            )}
                         </div>
                      </div>
                   </DialogContent>
                </Dialog>

                {/* Privacy Policy Modal */}
                <Dialog open={openPrivacy} onOpenChange={setOpenPrivacy}>
                   <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl shadow-primary/10">
                      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                          <DialogTitle className="text-2xl font-black italic tracking-tighter text-white uppercase">Privacy Policy</DialogTitle>
                          <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest", privacyRead ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/20")}>
                            {privacyRead ? "Read & Acknowledged" : "Scrolling Required"}
                          </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 text-sm text-zinc-400 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800" onScroll={(e) => handleScrollToBottom(e, setPrivacyRead)}>
                         <section>
                            <p className="text-zinc-200 leading-relaxed font-medium">
                                Your privacy is our priority. This policy outlines how we handle your information on BasaltCRM.
                            </p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">1. Information Collection</h3>
                            <p>We collect account info (email, company name), usage metadata (IP, browser type), and customer data you input into the CRM. You retain full ownership of lead and contact data.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">2. How We Use Data</h3>
                            <p>Data is used purely to provide service functionality, maintain security, and improve platform synthesis features. We do NOT sell your personal data to third parties.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">3. AI Training Transparency</h3>
                            <p>Anonymized, non-PII data may be used to calibrate global AI models. PII (Personal Identifiable Information) is strictly filtered before processing. Enterprise tenants can request dedicated isolation.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">4. Security Measures</h3>
                            <p>We utilize AES-256 at-rest and TLS 1.3 in-transit encryption. Regular SOC2-compliant auditing is performed on our infrastructure.</p>
                         </section>

                         <div className="pt-12 pb-8 flex flex-col items-center gap-4">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                            {privacyRead ? (
                               <Button 
                                  onClick={() => setOpenPrivacy(false)} 
                                  className="text-[11px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 h-auto rounded-full transition-all duration-300 transform hover:scale-105"
                               >
                                  Review Complete & Close ✓
                               </Button>
                            ) : (
                               <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                                  Keep scrolling to finish...
                               </span>
                            )}
                         </div>
                      </div>
                   </DialogContent>
                </Dialog>

                {/* AI Data Processing Policy Modal */}
                <Dialog open={openDataPolicy} onOpenChange={setOpenDataPolicy}>
                   <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl shadow-primary/10">
                      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                          <DialogTitle className="text-2xl font-black italic tracking-tighter text-white uppercase">AI Data Agreement</DialogTitle>
                          <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest", dataPolicyRead ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/20")}>
                            {dataPolicyRead ? "Read & Acknowledged" : "Scrolling Required"}
                          </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 text-sm text-zinc-400 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800" onScroll={(e) => handleScrollToBottom(e, setDataPolicyRead)}>
                         <section>
                            <p className="text-zinc-200 leading-relaxed font-black uppercase text-amber-500">
                                This agreement is required for all active intelligence and synthesis features.
                            </p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">1. Synthesis Rights</h3>
                            <p>By using Basalt Surge and Quests, you grant us permission to analyze CRM unstructured text to build context and synthesize leads. This processing occurs in secure, ephemeral memory.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">2. Training & Feedback Loops</h3>
                            <p>Metrics (click-through rates, conversation successes) are metadata analyzed to fine-tune our base models. Any content used for model alignment is strictly anonymized and stripped of PII via automated regex and NLP sanitization.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">3. Retrieval-Augmented Generation (RAG)</h3>
                            <p>Your team's private knowledge context is strictly siloed at the tenant level. RAG vector databases are indexed per-team and never shared across tenant boundaries during live generation or query phases.</p>
                         </section>

                         <section className="space-y-4">
                            <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">4. Human Oversight</h3>
                            <p>AI-generated content is non-deterministic. Users are responsible for final review before sending outreach or taking actions based on AI synthesis recommendations.</p>
                         </section>

                         <div className="pt-12 pb-8 flex flex-col items-center gap-4">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                            {dataPolicyRead ? (
                               <Button 
                                  onClick={() => setOpenDataPolicy(false)} 
                                  className="text-[11px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 h-auto rounded-full transition-all duration-300 transform hover:scale-105"
                               >
                                  Review Complete & Close ✓
                               </Button>
                            ) : (
                               <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                                  Keep scrolling to finish...
                               </span>
                            )}
                         </div>
                      </div>
                   </DialogContent>
                </Dialog>

                {process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
                  <FormField
                    control={form.control}
                    name="turnstile_token"
                    render={({ field }) => (
                      <FormItem className="flex justify-center">
                        <FormControl>
                          <Turnstile
                            siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
                            onSuccess={(token) => field.onChange(token)}
                            options={{ theme: 'dark' }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="grid gap-2 py-6">
              <Button disabled={isLoading || !form.formState.isValid} type="submit" className="w-full py-6 font-bold text-lg">
                Activate Intelligence Engine
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-0">
        <div className="text-sm text-gray-500 text-center">
          Already have an account? <Link href="/sign-in" className="text-primary hover:underline font-bold">sign-in</Link>
        </div>
      </CardFooter>

      {paymentUrl && activeInvoiceId && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={(open) => {
            setPaymentModalOpen(open);
            if (!open) router.push("/sign-in");
          }}
          url={paymentUrl}
          amount={paymentAmount}
          currency="USDC"
          invoiceId={activeInvoiceId}
        />
      )}
    </Card>
  );
}
