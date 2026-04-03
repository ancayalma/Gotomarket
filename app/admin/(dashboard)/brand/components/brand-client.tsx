"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus, X, Sparkles, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BrandData {
  // ── Identity ──
  company_name: string;
  industry: string;
  location: string;
  website_url: string;
  phone_number: string;
  company_email: string;
  tagline: string;
  logo_url: string;
  primary_brand_color: string;
  mission_statement: string;
  core_philosophy: string;

  // ── Brand Pillars ──
  core_values: string[];
  strategic_focus_areas: string[];
  competitive_advantages: string[];
  key_products_services: string[];
  pain_points_solved: string[];
  audience_description: string;
  business_model_summary: string;
  ideal_customer_profile: string;

  // ── Persona ──
  persona_preset: string;
  brand_voice: string;
  agent_tone: string;
  communication_style: string;
  outreach_approach: string;
  messaging_themes: string[];
  cta_preferences: string[];
  objection_handling: string;
  do_not_say: string[];

  // ── Channel Settings ──
  email_compliance_footer: string;
  sms_opt_out_message: string;
  call_script_intro: string;
  follow_up_cadence: string;
  business_hours: string;
  preferred_channel_priority: string[];

  // ── AI Generation Settings ──
  grammar_accuracy: number;
  avoid_em_dashes: boolean;
  emoji_frequency: number;
  emoji_allowed_in: string[];
  require_verified_account: boolean;

  // ── Ecosystem ──
  subsidiaries: string[];
  partner_categories: string[];
}

// ═══ Extracted helper components (must be outside BrandClient to avoid re-creation on every render) ═══

type FieldProps = {
  label: string;
  fieldName: keyof BrandData;
  placeholder?: string;
  formData: BrandData;
  setFormData: React.Dispatch<React.SetStateAction<BrandData>>;
};

const TextField = ({ label, fieldName, placeholder, formData, setFormData }: FieldProps) => (
  <div>
    <label className="text-xs text-muted-foreground font-medium mb-1 block">{label}</label>
    <Input 
      value={formData[fieldName] as string} 
      onChange={(e) => setFormData(prev => ({...prev, [fieldName]: e.target.value}))}
      placeholder={placeholder}
      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
    />
  </div>
);

const TextAreaField = ({ label, fieldName, rows = 4, placeholder, formData, setFormData }: FieldProps & { rows?: number }) => (
  <div>
    <label className="text-xs text-muted-foreground font-medium mb-1 block">{label}</label>
    <Textarea 
      rows={rows}
      value={formData[fieldName] as string} 
      onChange={(e) => setFormData(prev => ({...prev, [fieldName]: e.target.value}))}
      placeholder={placeholder}
      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary resize-none leading-relaxed" 
    />
  </div>
);

const TagGroup = ({ label, fieldName, placeholder, formData, setFormData }: FieldProps) => {
  const [inputValue, setInputValue] = useState("");
  const items = formData[fieldName] as string[];

  const addItem = () => {
    if (!inputValue.trim()) return;
    if (!items.includes(inputValue.trim())) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] as string[]), inputValue.trim()],
      }));
    }
    setInputValue("");
  };

  const removeItem = (itemToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: (prev[fieldName] as string[]).filter((i) => i !== itemToRemove),
    }));
  };

  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-sm text-primary font-medium tracking-wide">{label}</label>
      <div className="flex gap-2">
        <Input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder={placeholder || "Add new item..."} 
          className="flex-1 bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary"
        />
        <Button type="button" onClick={addItem} size="icon" className="bg-muted border border-border text-primary hover:bg-muted/80 rounded-md">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-1 bg-secondary border border-border text-secondary-foreground px-3 py-1 text-sm rounded-md">
            <span>{item}</span>
            <button type="button" onClick={() => removeItem(item)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3 ml-1" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function BrandClient({ initialData, teamId, allBrands = [], isMultiBrand = false }: { initialData: any; teamId: string; allBrands?: any[]; isMultiBrand?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [aiStep, setAiStep] = useState<"input" | "review">("input");
  const [aiPreviewData, setAiPreviewData] = useState<any>(null);
  const [logoOptions, setLogoOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Multi-brand state
  const [activeBrandId, setActiveBrandId] = useState<string | null>(initialData?.id || null);
  const [brands, setBrands] = useState<any[]>(allBrands);
  const [newBrandLabel, setNewBrandLabel] = useState("");
  const [showAddBrand, setShowAddBrand] = useState(false);

  const loadBrandIntoForm = (brand: any) => {
    setActiveBrandId(brand?.id || null);
    setFormData({
      company_name: brand?.company_name || "",
      industry: brand?.industry || "",
      location: brand?.location || "",
      website_url: brand?.website_url || "",
      phone_number: brand?.phone_number || "",
      company_email: brand?.company_email || "",
      tagline: brand?.tagline || "",
      logo_url: brand?.logo_url || "",
      primary_brand_color: brand?.primary_brand_color || "",
      mission_statement: brand?.mission_statement || "",
      core_philosophy: brand?.core_philosophy || "",
      core_values: brand?.core_values || [],
      strategic_focus_areas: brand?.strategic_focus_areas || [],
      competitive_advantages: brand?.competitive_advantages || [],
      key_products_services: brand?.key_products_services || [],
      pain_points_solved: brand?.pain_points_solved || [],
      audience_description: brand?.audience_description || "",
      business_model_summary: brand?.business_model_summary || "",
      ideal_customer_profile: brand?.ideal_customer_profile || "",
      persona_preset: brand?.persona_preset || "PROFESSIONAL",
      brand_voice: brand?.brand_voice || "",
      agent_tone: brand?.agent_tone || "",
      communication_style: brand?.communication_style || "",
      outreach_approach: brand?.outreach_approach || "",
      messaging_themes: brand?.messaging_themes || [],
      cta_preferences: brand?.cta_preferences || [],
      objection_handling: brand?.objection_handling || "",
      do_not_say: brand?.do_not_say || [],
      email_compliance_footer: brand?.email_compliance_footer || "",
      sms_opt_out_message: brand?.sms_opt_out_message || "",
      call_script_intro: brand?.call_script_intro || "",
      follow_up_cadence: brand?.follow_up_cadence || "",
      business_hours: brand?.business_hours || "",
      preferred_channel_priority: brand?.preferred_channel_priority || [],
      grammar_accuracy: brand?.grammar_accuracy ?? 80,
      avoid_em_dashes: brand?.avoid_em_dashes ?? true,
      emoji_frequency: brand?.emoji_frequency ?? 5,
      emoji_allowed_in: brand?.emoji_allowed_in || ["posts"],
      require_verified_account: brand?.require_verified_account ?? false,
      subsidiaries: brand?.subsidiaries || [],
      partner_categories: brand?.partner_categories || [],
    });
  };

  const [formData, setFormData] = useState<BrandData>({
    // ── Identity ──
    company_name: initialData?.company_name || "",
    industry: initialData?.industry || "",
    location: initialData?.location || "",
    website_url: initialData?.website_url || "",
    phone_number: initialData?.phone_number || "",
    company_email: initialData?.company_email || "",
    tagline: initialData?.tagline || "",
    logo_url: initialData?.logo_url || "",
    primary_brand_color: initialData?.primary_brand_color || "",
    mission_statement: initialData?.mission_statement || "",
    core_philosophy: initialData?.core_philosophy || "",

    // ── Brand Pillars ──
    core_values: initialData?.core_values || [],
    strategic_focus_areas: initialData?.strategic_focus_areas || [],
    competitive_advantages: initialData?.competitive_advantages || [],
    key_products_services: initialData?.key_products_services || [],
    pain_points_solved: initialData?.pain_points_solved || [],
    audience_description: initialData?.audience_description || "",
    business_model_summary: initialData?.business_model_summary || "",
    ideal_customer_profile: initialData?.ideal_customer_profile || "",

    // ── Persona ──
    persona_preset: initialData?.persona_preset || "PROFESSIONAL",
    brand_voice: initialData?.brand_voice || "",
    agent_tone: initialData?.agent_tone || "",
    communication_style: initialData?.communication_style || "",
    outreach_approach: initialData?.outreach_approach || "",
    messaging_themes: initialData?.messaging_themes || [],
    cta_preferences: initialData?.cta_preferences || [],
    objection_handling: initialData?.objection_handling || "",
    do_not_say: initialData?.do_not_say || [],

    // ── Channel Settings ──
    email_compliance_footer: initialData?.email_compliance_footer || "",
    sms_opt_out_message: initialData?.sms_opt_out_message || "",
    call_script_intro: initialData?.call_script_intro || "",
    follow_up_cadence: initialData?.follow_up_cadence || "",
    business_hours: initialData?.business_hours || "",
    preferred_channel_priority: initialData?.preferred_channel_priority || [],

    // ── AI Generation Settings ──
    grammar_accuracy: initialData?.grammar_accuracy ?? 80,
    avoid_em_dashes: initialData?.avoid_em_dashes ?? true,
    emoji_frequency: initialData?.emoji_frequency ?? 5,
    emoji_allowed_in: initialData?.emoji_allowed_in || ["posts"],
    require_verified_account: initialData?.require_verified_account ?? false,

    // ── Ecosystem ──
    subsidiaries: initialData?.subsidiaries || [],
    partner_categories: initialData?.partner_categories || [],
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = activeBrandId ? { ...formData, brandId: activeBrandId } : formData;
      const res = await fetch("/api/admin/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Could not save");
      toast.success("Brand Identity configured successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandLabel.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/admin/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_label: newBrandLabel.trim(), _createNew: true, company_name: newBrandLabel.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create brand");
      const newBrand = await res.json();
      setBrands(prev => [...prev, newBrand]);
      loadBrandIntoForm(newBrand);
      setShowAddBrand(false);
      setNewBrandLabel("");
      toast.success(`Brand "${newBrandLabel.trim()}" created`);
    } catch {
      toast.error("Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    try {
      const res = await fetch(`/api/admin/brand?id=${brandId}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setBrands(prev => prev.filter(b => b.id !== brandId));
      // Switch to default brand
      const defaultBrand = brands.find(b => b.is_default);
      if (defaultBrand) loadBrandIntoForm(defaultBrand);
      toast.success("Brand deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete brand");
    }
  };

  const handleAiScrape = async () => {
    if (!scrapeUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    try {
      setAiLoading(true);
      const res = await fetch("/api/ai/scrape-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl, teamId, preview: true }),
      });
      if (!res.ok) throw new Error("Failed to scrape");
      
      const result = await res.json();
      const { brandData, options } = result;
      
      setAiPreviewData(brandData);
      setLogoOptions(options.logos || []);
      setColorOptions(options.colors || []);
      setSelectedLogo(brandData.logo_url || options.logos?.[0] || "");
      setSelectedColor(brandData.primary_brand_color || options.colors?.[0] || "");
      setAiStep("review");
    } catch {
      toast.error("Something went wrong scraping the website.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiData = () => {
    if (!aiPreviewData) return;
    
    setFormData({
      company_name: aiPreviewData.company_name || "",
      industry: aiPreviewData.industry || "",
      location: aiPreviewData.location || "",
      website_url: aiPreviewData.website_url || "",
      phone_number: aiPreviewData.phone_number || "",
      company_email: aiPreviewData.company_email || "",
      tagline: aiPreviewData.tagline || "",
      logo_url: selectedLogo,
      primary_brand_color: selectedColor,
      mission_statement: aiPreviewData.mission_statement || "",
      core_philosophy: aiPreviewData.core_philosophy || "",
      core_values: aiPreviewData.core_values || [],
      strategic_focus_areas: aiPreviewData.strategic_focus_areas || [],
      competitive_advantages: aiPreviewData.competitive_advantages || [],
      key_products_services: aiPreviewData.key_products_services || [],
      pain_points_solved: aiPreviewData.pain_points_solved || [],
      audience_description: aiPreviewData.audience_description || "",
      business_model_summary: aiPreviewData.business_model_summary || "",
      ideal_customer_profile: aiPreviewData.ideal_customer_profile || "",
      persona_preset: aiPreviewData.persona_preset || "PROFESSIONAL",
      brand_voice: aiPreviewData.brand_voice || "",
      agent_tone: aiPreviewData.agent_tone || "",
      communication_style: aiPreviewData.communication_style || "",
      outreach_approach: aiPreviewData.outreach_approach || "",
      messaging_themes: aiPreviewData.messaging_themes || [],
      cta_preferences: aiPreviewData.cta_preferences || [],
      objection_handling: aiPreviewData.objection_handling || "",
      do_not_say: aiPreviewData.do_not_say || [],
      email_compliance_footer: aiPreviewData.email_compliance_footer || "",
      sms_opt_out_message: aiPreviewData.sms_opt_out_message || "",
      call_script_intro: aiPreviewData.call_script_intro || "",
      follow_up_cadence: aiPreviewData.follow_up_cadence || "",
      business_hours: aiPreviewData.business_hours || "",
      preferred_channel_priority: aiPreviewData.preferred_channel_priority || [],
      grammar_accuracy: aiPreviewData.grammar_accuracy ?? formData.grammar_accuracy ?? 80,
      avoid_em_dashes: aiPreviewData.avoid_em_dashes ?? formData.avoid_em_dashes ?? true,
      emoji_frequency: aiPreviewData.emoji_frequency ?? formData.emoji_frequency ?? 5,
      emoji_allowed_in: aiPreviewData.emoji_allowed_in || formData.emoji_allowed_in || ["posts"],
      require_verified_account: aiPreviewData.require_verified_account ?? formData.require_verified_account ?? false,
      subsidiaries: aiPreviewData.subsidiaries || formData.subsidiaries || [],
      partner_categories: aiPreviewData.partner_categories || formData.partner_categories || [],
    });

    toast.success("Brand identity populated! Review the fields and click Save Config.");
    setAiDialogOpen(false);
    resetAiDialog();
  };

  const resetAiDialog = () => {
    setAiStep("input");
    setScrapeUrl("");
    setAiPreviewData(null);
    setLogoOptions([]);
    setColorOptions([]);
    setSelectedLogo("");
    setSelectedColor("");
  };



  return (
    <div className="flex flex-col min-h-full bg-background text-foreground rounded-xl border border-border shadow-2xl relative">
      
      {/* Header Container */}
      {/* ═══ Multi-Brand Switcher Bar (Enterprise/Exempt only) ═══ */}
      {isMultiBrand && brands.length > 0 && (
        <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30 rounded-t-md">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-2">Brand:</span>
          {brands.map((b: any) => (
            <div key={b.id} className="flex items-center gap-1">
              <button
                onClick={() => loadBrandIntoForm(b)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  activeBrandId === b.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                }`}
              >
                {b.brand_label || b.company_name || "Unnamed"}
                {b.is_default && <span className="ml-1 opacity-60">(default)</span>}
              </button>
              {!b.is_default && activeBrandId === b.id && (
                <button onClick={() => handleDeleteBrand(b.id)} className="text-destructive hover:text-destructive/80 p-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {showAddBrand ? (
            <div className="flex items-center gap-1 ml-2">
              <Input
                value={newBrandLabel}
                onChange={(e) => setNewBrandLabel(e.target.value)}
                placeholder="Brand name..."
                className="h-7 text-xs w-36"
                onKeyDown={(e) => e.key === "Enter" && handleAddBrand()}
              />
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleAddBrand}>
                <Check className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowAddBrand(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 ml-2" onClick={() => setShowAddBrand(true)}>
              <Plus className="w-3 h-3" /> Add Brand
            </Button>
          )}
        </div>
      )}

      <Tabs defaultValue="identity" className="flex flex-col w-full relative z-10">
        <div className="flex items-center justify-between border-b border-border p-4 bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <TabsList className="bg-transparent gap-2 h-auto p-0">
              <TabsTrigger 
                value="identity" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-4 py-2 uppercase tracking-wide text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Identity
              </TabsTrigger>
              <TabsTrigger 
                value="brand_pillars" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-4 py-2 uppercase tracking-wide text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Brand Pillars
              </TabsTrigger>
              <TabsTrigger 
                value="persona" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-4 py-2 uppercase tracking-wide text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Persona
              </TabsTrigger>
              <TabsTrigger 
                value="channel_settings" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-4 py-2 uppercase tracking-wide text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Channel Settings
              </TabsTrigger>
              <TabsTrigger 
                value="ai_generation" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-4 py-2 uppercase tracking-wide text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                AI Generation
              </TabsTrigger>
              <TabsTrigger 
                value="ecosystem" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-4 py-2 uppercase tracking-wide text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Ecosystem
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAiDialogOpen(true)}
              variant="outline"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-bold uppercase tracking-wider text-xs px-4 rounded-md"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Auto-Populate
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs px-6 rounded-md shadow-lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Config"}
            </Button>
          </div>
        </div>

        {/* Form Body Scroll Area */}
        <div className="p-8 relative z-10">
          
          {/* ════════════════════════════════════════════════════════
              TAB 1: IDENTITY
              ════════════════════════════════════════════════════════ */}
          <TabsContent value="identity" className="m-0 data-[state=inactive]:hidden outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Left Col — Core Information */}
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Core Information</h3>
                <div className="space-y-4">
                  <TextField formData={formData} setFormData={setFormData} label="Company Name" fieldName="company_name" placeholder="Acme Corp" />
                  <TextField formData={formData} setFormData={setFormData} label="Industry" fieldName="industry" placeholder="SaaS, Financial Services, etc." />
                  <TextField formData={formData} setFormData={setFormData} label="Location" fieldName="location" placeholder="San Francisco, CA" />
                  <TextField formData={formData} setFormData={setFormData} label="Website URL" fieldName="website_url" placeholder="https://yourcompany.com" />
                  <TextField formData={formData} setFormData={setFormData} label="Phone Number" fieldName="phone_number" placeholder="+1 (555) 123-4567" />
                  <TextField formData={formData} setFormData={setFormData} label="Company Email" fieldName="company_email" placeholder="hello@yourcompany.com" />
                </div>
              </div>
              
              {/* Right Col — Brand Presentation & Vision */}
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Brand Presentation</h3>
                <div className="space-y-4">
                  <TextField formData={formData} setFormData={setFormData} label="Tagline / Elevator Pitch" fieldName="tagline" placeholder="One line that captures what you do" />
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Logo URL</label>
                    <div className="flex gap-2"> 
                      <Input 
                        value={formData.logo_url} 
                        onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                        placeholder="https://yourcompany.com/logo.png"
                        className="flex-1 bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                      />
                      {formData.logo_url ? (
                        <div className="h-10 w-10 shrink-0 rounded border border-border bg-background/50 flex items-center justify-center overflow-hidden">
                          <img src={formData.logo_url} alt="Brand logo" className="w-8 h-8 object-contain" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded border border-border bg-muted/50" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Primary Brand Color</label>
                    <div className="flex gap-2">
                      <Input 
                        value={formData.primary_brand_color} 
                        onChange={(e) => setFormData({...formData, primary_brand_color: e.target.value})}
                        placeholder="#0ea5e9 or rgb(14, 165, 233)"
                        className="flex-1 bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                      />
                      <input
                        type="color"
                        value={formData.primary_brand_color || '#000000'}
                        onChange={(e) => setFormData({...formData, primary_brand_color: e.target.value})}
                        className="h-10 w-10 shrink-0 rounded border border-border shadow-sm cursor-pointer bg-transparent p-0.5"
                        title="Pick a color"
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4 pt-4">Strategic Vision</h3>
                <div className="space-y-4">
                  <TextAreaField formData={formData} setFormData={setFormData} label="Mission Statement" fieldName="mission_statement" rows={4} placeholder="Why does your company exist? What impact do you make?" />
                  <TextAreaField formData={formData} setFormData={setFormData} label="Core Philosophy" fieldName="core_philosophy" rows={4} placeholder="The underlying beliefs that drive your business decisions" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════
              TAB 2: BRAND PILLARS
              ════════════════════════════════════════════════════════ */}
          <TabsContent value="brand_pillars" className="m-0 data-[state=inactive]:hidden outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-6">Strategic Pillars</h3>
                <TagGroup formData={formData} setFormData={setFormData} label="Core Values" fieldName="core_values" placeholder="e.g. Innovation, Integrity, Customer-First" />
                <TagGroup formData={formData} setFormData={setFormData} label="Strategic Focus Areas" fieldName="strategic_focus_areas" placeholder="e.g. AI Automation, Revenue Growth" />
                <TagGroup formData={formData} setFormData={setFormData} label="Competitive Advantages" fieldName="competitive_advantages" placeholder="e.g. 10x faster onboarding, SOC2 compliant" />
                <TagGroup formData={formData} setFormData={setFormData} label="Key Products / Services" fieldName="key_products_services" placeholder="e.g. CRM Platform, AI Analytics" />
                <TagGroup formData={formData} setFormData={setFormData} label="Pain Points You Solve" fieldName="pain_points_solved" placeholder="e.g. Manual data entry, Low response rates" />
              </div>

              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-6">Target Audience</h3>
                <TextAreaField formData={formData} setFormData={setFormData} label="Audience Description" fieldName="audience_description" rows={4} placeholder="Who are your customers? What industries, roles, company sizes?" />
                <TextAreaField formData={formData} setFormData={setFormData} label="Ideal Customer Profile (ICP)" fieldName="ideal_customer_profile" rows={4} placeholder="VP of Sales at B2B SaaS companies with 50-500 employees..." />
                <TextAreaField formData={formData} setFormData={setFormData} label="Business Model Summary" fieldName="business_model_summary" rows={4} placeholder="How does your company generate revenue?" />
              </div>
             </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════
              TAB 3: PERSONA
              ════════════════════════════════════════════════════════ */}
          <TabsContent value="persona" className="m-0 data-[state=inactive]:hidden outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Voice & Tone</h3>
                
                <div className="bg-card/40 border border-border p-4 rounded-md">
                  <label className="text-xs text-primary font-medium mb-3 block tracking-wide">Choose a Persona Preset</label>
                  <div className="flex gap-2">
                    {["PROFESSIONAL", "HUMOROUS", "SNARKY"].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setFormData({...formData, persona_preset: preset})}
                        className={`text-xs px-4 py-2 uppercase tracking-wide rounded-sm transition-colors border ${
                          formData.persona_preset === preset 
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted border-border hover:bg-accent text-muted-foreground" 
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Selecting a preset adjusts background AI extraction contexts.</p>
                </div>

                <div className="space-y-4">
                  <TextField formData={formData} setFormData={setFormData} label="Brand Voice (Company)" fieldName="brand_voice" placeholder="e.g. Visionary, Authoritative, Approachable" />
                  <TextField formData={formData} setFormData={setFormData} label="Agent Tone" fieldName="agent_tone" placeholder="e.g. Efficient, Precise, Direct" />
                  <TextField formData={formData} setFormData={setFormData} label="Communication Style" fieldName="communication_style" placeholder="e.g. Technical but Accessible, Conversational" />
                  <TextAreaField formData={formData} setFormData={setFormData} label="Outreach Approach" fieldName="outreach_approach" rows={3} placeholder="How do you approach prospects? e.g. Consultative, value-led, challenge-based..." />
                </div>

              </div>
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Messaging Strategy</h3>
                <div className="space-y-6">
                  <TagGroup formData={formData} setFormData={setFormData} label="Messaging Themes" fieldName="messaging_themes" placeholder="e.g. Digital Transformation, ROI Optimization" />
                  <TagGroup formData={formData} setFormData={setFormData} label="CTA Preferences" fieldName="cta_preferences" placeholder="e.g. Book a Demo, Start Free Trial" />
                  <TagGroup formData={formData} setFormData={setFormData} label="Do-Not-Say List" fieldName="do_not_say" placeholder="e.g. Cheap, Discount, Competitor names" />
                  <TextAreaField formData={formData} setFormData={setFormData} label="Objection Handling Notes" fieldName="objection_handling" rows={4} placeholder="Common objections and how to handle them. e.g. 'Too expensive' → Emphasize ROI and time savings..." />
                </div>
              </div>
             </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════
              TAB 4: CHANNEL SETTINGS (was Ecosystem)
              ════════════════════════════════════════════════════════ */}
          <TabsContent value="channel_settings" className="m-0 data-[state=inactive]:hidden outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Email & SMS Compliance</h3>
                <TextAreaField 
                  formData={formData} setFormData={setFormData}
                  label="Email Compliance Footer" 
                  fieldName="email_compliance_footer" 
                  rows={4} 
                  placeholder="CAN-SPAM requires: physical address + unsubscribe link. e.g. '123 Main St, Suite 100, San Francisco, CA 94105. To unsubscribe, click here.'" 
                />
                <TextField 
                  formData={formData} setFormData={setFormData}
                  label="SMS Opt-Out Message" 
                  fieldName="sms_opt_out_message" 
                  placeholder="Reply STOP to unsubscribe" 
                />
                <TextAreaField 
                  formData={formData} setFormData={setFormData}
                  label="Call Script Introduction" 
                  fieldName="call_script_intro" 
                  rows={3} 
                  placeholder="Hi, this is [Name] from [Company]. I'm reaching out because..." 
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Outreach Cadence & Timing</h3>
                <TextField 
                  formData={formData} setFormData={setFormData}
                  label="Follow-Up Cadence" 
                  fieldName="follow_up_cadence" 
                  placeholder="e.g. 3 days between emails, 5 days between SMS" 
                />
                <TextField 
                  formData={formData} setFormData={setFormData}
                  label="Business Hours" 
                  fieldName="business_hours" 
                  placeholder="e.g. 9:00 AM - 5:00 PM EST, Mon-Fri" 
                />
                <TagGroup 
                  formData={formData} setFormData={setFormData}
                  label="Channel Priority (ranked)" 
                  fieldName="preferred_channel_priority" 
                  placeholder="e.g. EMAIL, SMS, PHONE" 
                />
                <div className="bg-card/40 border border-border p-4 rounded-md mt-4">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-semibold block mb-1">About Channel Priority</span>
                    Add channels in order of preference. The AI will prioritize outreach through your top-ranked channel first, then fall back to subsequent channels as needed.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════
              TAB 5: AI GENERATION SETTINGS
              ════════════════════════════════════════════════════════ */}
          <TabsContent value="ai_generation" className="m-0 data-[state=inactive]:hidden outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-8">
                <div>
                  <h3 className="text-primary font-semibold tracking-wider text-sm mb-6">AI Generation Settings</h3>

                  {/* Grammar Accuracy Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-primary font-medium tracking-wide">Grammar Accuracy</label>
                      <span className="text-xs font-mono text-primary">{formData.grammar_accuracy}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.grammar_accuracy}
                      onChange={(e) => setFormData({ ...formData, grammar_accuracy: parseInt(e.target.value) })}
                      className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Casual (typos ok)</span>
                      <span>Perfect Grammar</span>
                    </div>
                  </div>
                </div>

                {/* Avoid EM Dashes */}
                <div className="bg-card/40 border border-border p-4 rounded-md space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.avoid_em_dashes}
                      onChange={(e) => setFormData({ ...formData, avoid_em_dashes: e.target.checked })}
                      className="accent-primary w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-semibold">Avoid EM Dashes (—)</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">EM dashes are a common AI writing signature. Use hyphens or commas instead.</p>
                    </div>
                  </label>
                </div>

                {/* Emoji Frequency */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-primary font-medium tracking-wide">Emoji Frequency</label>
                    <span className="text-xs font-mono text-primary">{formData.emoji_frequency}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.emoji_frequency}
                    onChange={(e) => setFormData({ ...formData, emoji_frequency: parseInt(e.target.value) })}
                    className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>No Emojis</span>
                    <span>Emoji Heavy 🎉</span>
                  </div>
                </div>

                {/* Allow Emojis In */}
                <div className="bg-card/40 border border-border p-4 rounded-md space-y-3">
                  <label className="text-xs text-primary font-medium tracking-wide block">Allow Emojis In:</label>
                  <div className="flex flex-wrap gap-4">
                    {["posts", "replies", "emails", "sms"].map((ctx) => (
                      <label key={ctx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.emoji_allowed_in.includes(ctx)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...formData.emoji_allowed_in, ctx]
                              : formData.emoji_allowed_in.filter((c: string) => c !== ctx);
                            setFormData({ ...formData, emoji_allowed_in: updated });
                          }}
                          className="accent-primary w-4 h-4 rounded"
                        />
                        <span className="text-sm capitalize">{ctx === "sms" ? "SMS" : ctx.charAt(0).toUpperCase() + ctx.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Uncheck to disable emojis for specific task types.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-primary font-semibold tracking-wider text-sm mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Safety & Exclusions
                  </h3>

                  {/* Require Verified Account */}
                  <div className="bg-card/40 border border-border p-4 rounded-md space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_verified_account}
                        onChange={(e) => setFormData({ ...formData, require_verified_account: e.target.checked })}
                        className="accent-primary w-4 h-4 rounded"
                      />
                      <div>
                        <span className="text-sm font-semibold">Require Verified Account (Blue Check)</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">If checked, bot will ignore ALL non-verified accounts (Verified Only).</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-card/40 border border-border p-4 rounded-md">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-semibold block mb-1">About AI Generation Settings</span>
                    These settings shape the output language and behavior of AI-generated content across all channels. Grammar accuracy and emoji controls ensure brand-consistent messaging. Safety exclusions help filter engagements.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════
              TAB 6: ECOSYSTEM
              ════════════════════════════════════════════════════════ */}
          <TabsContent value="ecosystem" className="m-0 data-[state=inactive]:hidden outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Products & Services</h3>
                <TagGroup formData={formData} setFormData={setFormData} label="Key Products" fieldName="key_products_services" placeholder="e.g. BasaltERP, BasaltCRM, BasaltSurge" />
                <TagGroup formData={formData} setFormData={setFormData} label="Subsidiaries" fieldName="subsidiaries" placeholder="e.g. Utility Labs, Surge Protocol" />
              </div>

              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Partnership Network</h3>
                <TagGroup formData={formData} setFormData={setFormData} label="Partner Categories" fieldName="partner_categories" placeholder="e.g. Web3 Protocols, Payment Processors, Hardware Vendors" />

                <div className="bg-card/40 border border-border p-4 rounded-md mt-4">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-semibold block mb-1">About Ecosystem</span>
                    Define your product portfolio, subsidiary brands, and partner network. The AI uses this context to accurately reference your ecosystem in generated content and avoid hallucinated product names.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

        </div>
      </Tabs>

      {/* AI Scrape Dialog — Multi-step Review */}
      <Dialog open={aiDialogOpen} onOpenChange={() => {}}>
        <DialogContent
          className={aiStep === "review" ? "w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto [&>button]:hidden" : "sm:max-w-lg [&>button]:hidden"}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Custom X close button since we disabled default onOpenChange */}
          <button
            onClick={() => { resetAiDialog(); setAiDialogOpen(false); }}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          {aiStep === "input" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Brand Extraction
                </DialogTitle>
                <DialogDescription>
                  Enter your website URL and our AI will analyze the content. You&apos;ll review the results before anything is saved.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-3">
                <label className="text-sm font-medium">Website URL</label>
                <Input
                  placeholder="https://yourcompany.com"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  disabled={aiLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleAiScrape()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetAiDialog(); setAiDialogOpen(false); }} disabled={aiLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAiScrape}
                  disabled={aiLoading || !scrapeUrl.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {aiLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Analyze Website</>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  Review Extracted Brand
                </DialogTitle>
                <DialogDescription>
                  AI has extracted your brand identity. Select your preferred logo and color, then apply.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                {/* ── Summary ── */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Company</span>
                    <p className="font-semibold">{aiPreviewData?.company_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Industry</span>
                    <p className="font-semibold">{aiPreviewData?.industry || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">Tagline</span>
                    <p className="font-semibold italic">&ldquo;{aiPreviewData?.tagline || "—"}&rdquo;</p>
                  </div>
                </div>

                {/* ── Logo Picker ── */}
                {logoOptions.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-primary block mb-3">Select Logo</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {logoOptions.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedLogo(url)}
                          className={`relative aspect-square rounded-lg border-2 p-2 flex items-center justify-center bg-background/50 hover:bg-accent/30 transition-all overflow-hidden ${
                            selectedLogo === url
                              ? "border-purple-500 ring-2 ring-purple-500/30 shadow-lg"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Logo option ${i + 1}`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          {selectedLogo === url && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedLogo && (
                      <p className="text-[10px] text-muted-foreground mt-2 truncate">Selected: {selectedLogo}</p>
                    )}
                  </div>
                )}

                {/* ── Color Picker ── */}
                {colorOptions.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-primary block mb-3">Select Primary Brand Color</label>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.map((color, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`relative w-12 h-12 rounded-lg border-2 transition-all shadow-sm hover:scale-110 ${
                            selectedColor === color
                              ? "border-white ring-2 ring-purple-500/50 scale-110"
                              : "border-border/50"
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          {selectedColor === color && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedColor && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: selectedColor }} />
                        <span className="text-xs text-muted-foreground font-mono">{selectedColor}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Key Fields Preview ── */}
                <div className="bg-muted/30 rounded-lg border border-border p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Extracted Data Preview</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Location:</span> {aiPreviewData?.location}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {aiPreviewData?.phone_number || "—"}</div>
                    <div><span className="text-muted-foreground">Email:</span> {aiPreviewData?.company_email || "—"}</div>
                    <div><span className="text-muted-foreground">Voice:</span> {aiPreviewData?.brand_voice}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Core Values:</span> {aiPreviewData?.core_values?.join(", ")}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Products:</span> {aiPreviewData?.key_products_services?.join(", ")}</div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">All fields will be editable in the form after applying.</p>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => { resetAiDialog(); }} className="sm:mr-auto">
                  Start Over
                </Button>
                <Button variant="outline" onClick={() => { resetAiDialog(); setAiDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyAiData}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply to Brand Identity
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

