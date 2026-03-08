"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus, X } from "lucide-react";
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
}

export default function BrandClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

  // Utility to handle array badges (Tags)
  const TagGroup = ({ label, fieldName, placeholder }: { label: string, fieldName: keyof BrandData, placeholder?: string }) => {
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

  // Helper for simple text fields
  const TextField = ({ label, fieldName, placeholder }: { label: string, fieldName: keyof BrandData, placeholder?: string }) => (
    <div>
      <label className="text-xs text-muted-foreground font-medium mb-1 block">{label}</label>
      <Input 
        value={formData[fieldName] as string} 
        onChange={(e) => setFormData({...formData, [fieldName]: e.target.value})}
        placeholder={placeholder}
        className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
      />
    </div>
  );

  // Helper for textarea fields
  const TextAreaField = ({ label, fieldName, rows = 4, placeholder }: { label: string, fieldName: keyof BrandData, rows?: number, placeholder?: string }) => (
    <div>
      <label className="text-xs text-muted-foreground font-medium mb-1 block">{label}</label>
      <Textarea 
        rows={rows}
        value={formData[fieldName] as string} 
        onChange={(e) => setFormData({...formData, [fieldName]: e.target.value})}
        placeholder={placeholder}
        className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary resize-none leading-relaxed" 
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground rounded-xl border border-border overflow-hidden shadow-2xl relative">
      
      {/* Header Container */}
      <Tabs defaultValue="identity" className="flex flex-col h-full w-full relative z-10">
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
            </TabsList>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs px-6 rounded-md shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Config"}
          </Button>
        </div>

        {/* Form Body Scroll Area */}
        <div className="flex-1 overflow-auto p-8 no-scrollbar relative z-10 glass bg-opacity-10 backdrop-blur-none bg-transparent">
          
          {/* ════════════════════════════════════════════════════════
              TAB 1: IDENTITY
              ════════════════════════════════════════════════════════ */}
          <TabsContent value="identity" className="m-0 data-[state=inactive]:hidden outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Left Col — Core Information */}
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Core Information</h3>
                <div className="space-y-4">
                  <TextField label="Company Name" fieldName="company_name" placeholder="Acme Corp" />
                  <TextField label="Industry" fieldName="industry" placeholder="SaaS, Financial Services, etc." />
                  <TextField label="Location" fieldName="location" placeholder="San Francisco, CA" />
                  <TextField label="Website URL" fieldName="website_url" placeholder="https://yourcompany.com" />
                  <TextField label="Phone Number" fieldName="phone_number" placeholder="+1 (555) 123-4567" />
                  <TextField label="Company Email" fieldName="company_email" placeholder="hello@yourcompany.com" />
                </div>
              </div>
              
              {/* Right Col — Brand Presentation & Vision */}
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Brand Presentation</h3>
                <div className="space-y-4">
                  <TextField label="Tagline / Elevator Pitch" fieldName="tagline" placeholder="One line that captures what you do" />
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
                      <div 
                        className="h-10 w-10 shrink-0 rounded border border-border shadow-sm"
                        style={{ backgroundColor: formData.primary_brand_color || 'transparent' }}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4 pt-4">Strategic Vision</h3>
                <div className="space-y-4">
                  <TextAreaField label="Mission Statement" fieldName="mission_statement" rows={4} placeholder="Why does your company exist? What impact do you make?" />
                  <TextAreaField label="Core Philosophy" fieldName="core_philosophy" rows={4} placeholder="The underlying beliefs that drive your business decisions" />
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
                <TagGroup label="Core Values" fieldName="core_values" placeholder="e.g. Innovation, Integrity, Customer-First" />
                <TagGroup label="Strategic Focus Areas" fieldName="strategic_focus_areas" placeholder="e.g. AI Automation, Revenue Growth" />
                <TagGroup label="Competitive Advantages" fieldName="competitive_advantages" placeholder="e.g. 10x faster onboarding, SOC2 compliant" />
                <TagGroup label="Key Products / Services" fieldName="key_products_services" placeholder="e.g. CRM Platform, AI Analytics" />
                <TagGroup label="Pain Points You Solve" fieldName="pain_points_solved" placeholder="e.g. Manual data entry, Low response rates" />
              </div>

              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-6">Target Audience</h3>
                <TextAreaField label="Audience Description" fieldName="audience_description" rows={4} placeholder="Who are your customers? What industries, roles, company sizes?" />
                <TextAreaField label="Ideal Customer Profile (ICP)" fieldName="ideal_customer_profile" rows={4} placeholder="VP of Sales at B2B SaaS companies with 50-500 employees..." />
                <TextAreaField label="Business Model Summary" fieldName="business_model_summary" rows={4} placeholder="How does your company generate revenue?" />
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
                  <TextField label="Brand Voice (Company)" fieldName="brand_voice" placeholder="e.g. Visionary, Authoritative, Approachable" />
                  <TextField label="Agent Tone" fieldName="agent_tone" placeholder="e.g. Efficient, Precise, Direct" />
                  <TextField label="Communication Style" fieldName="communication_style" placeholder="e.g. Technical but Accessible, Conversational" />
                  <TextAreaField label="Outreach Approach" fieldName="outreach_approach" rows={3} placeholder="How do you approach prospects? e.g. Consultative, value-led, challenge-based..." />
                </div>

              </div>
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Messaging Strategy</h3>
                <div className="space-y-6">
                  <TagGroup label="Messaging Themes" fieldName="messaging_themes" placeholder="e.g. Digital Transformation, ROI Optimization" />
                  <TagGroup label="CTA Preferences" fieldName="cta_preferences" placeholder="e.g. Book a Demo, Start Free Trial" />
                  <TagGroup label="Do-Not-Say List" fieldName="do_not_say" placeholder="e.g. Cheap, Discount, Competitor names" />
                  <TextAreaField label="Objection Handling Notes" fieldName="objection_handling" rows={4} placeholder="Common objections and how to handle them. e.g. 'Too expensive' → Emphasize ROI and time savings..." />
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
                  label="Email Compliance Footer" 
                  fieldName="email_compliance_footer" 
                  rows={4} 
                  placeholder="CAN-SPAM requires: physical address + unsubscribe link. e.g. '123 Main St, Suite 100, San Francisco, CA 94105. To unsubscribe, click here.'" 
                />
                <TextField 
                  label="SMS Opt-Out Message" 
                  fieldName="sms_opt_out_message" 
                  placeholder="Reply STOP to unsubscribe" 
                />
                <TextAreaField 
                  label="Call Script Introduction" 
                  fieldName="call_script_intro" 
                  rows={3} 
                  placeholder="Hi, this is [Name] from [Company]. I'm reaching out because..." 
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Outreach Cadence & Timing</h3>
                <TextField 
                  label="Follow-Up Cadence" 
                  fieldName="follow_up_cadence" 
                  placeholder="e.g. 3 days between emails, 5 days between SMS" 
                />
                <TextField 
                  label="Business Hours" 
                  fieldName="business_hours" 
                  placeholder="e.g. 9:00 AM - 5:00 PM EST, Mon-Fri" 
                />
                <TagGroup 
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

        </div>
      </Tabs>
    </div>
  );
}
