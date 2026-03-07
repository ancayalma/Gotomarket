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
  company_name: string;
  industry: string;
  location: string;
  twitter_handle: string;
  mission_statement: string;
  core_philosophy: string;
  core_values: string[];
  strategic_focus_areas: string[];
  competitive_advantages: string[];
  audience_description: string;
  business_model_summary: string;
  persona_preset: string;
  brand_voice: string;
  agent_tone: string;
  communication_style: string;
  engagement_style: string;
  hashtag_strategy: string;
  content_themes: string[];
}

export default function BrandClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<BrandData>({
    company_name: initialData?.company_name || "",
    industry: initialData?.industry || "",
    location: initialData?.location || "",
    twitter_handle: initialData?.twitter_handle || "",
    mission_statement: initialData?.mission_statement || "",
    core_philosophy: initialData?.core_philosophy || "",
    core_values: initialData?.core_values || [],
    strategic_focus_areas: initialData?.strategic_focus_areas || [],
    competitive_advantages: initialData?.competitive_advantages || [],
    audience_description: initialData?.audience_description || "",
    business_model_summary: initialData?.business_model_summary || "",
    persona_preset: initialData?.persona_preset || "PROFESSIONAL",
    brand_voice: initialData?.brand_voice || "",
    agent_tone: initialData?.agent_tone || "",
    communication_style: initialData?.communication_style || "",
    engagement_style: initialData?.engagement_style || "",
    hashtag_strategy: initialData?.hashtag_strategy || "",
    content_themes: initialData?.content_themes || [],
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
  const TagGroup = ({ label, fieldName }: { label: string, fieldName: keyof BrandData }) => {
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
            placeholder="Add new item..." 
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
                value="ecosystem" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-4 py-2 uppercase tracking-wide text-xs font-semibold text-muted-foreground hover:text-foreground uppercase"
              >
                Ecosystem
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
          
          <TabsContent value="identity" className="h-full m-0 data-[state=inactive]:hidden outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Left Col */}
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Core Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Company Name</label>
                    <Input 
                      value={formData.company_name} 
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Industry</label>
                    <Input 
                      value={formData.industry} 
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Location</label>
                    <Input 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Twitter Handle</label>
                    <Input 
                      value={formData.twitter_handle} 
                      onChange={(e) => setFormData({...formData, twitter_handle: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Right Col */}
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Strategic Vision</h3>
                <div className="space-y-8">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Mission Statement</label>
                    <Textarea 
                      rows={4}
                      value={formData.mission_statement} 
                      onChange={(e) => setFormData({...formData, mission_statement: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary resize-none leading-relaxed" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Core Philosophy</label>
                    <Textarea 
                      rows={6}
                      value={formData.core_philosophy} 
                      onChange={(e) => setFormData({...formData, core_philosophy: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary resize-none leading-relaxed" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brand_pillars" className="h-full m-0 data-[state=inactive]:hidden outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-6">Strategic Pillars</h3>
                <TagGroup label="Core Values" fieldName="core_values" />
                <TagGroup label="Strategic Focus Areas" fieldName="strategic_focus_areas" />
                <TagGroup label="Competitive Advantages" fieldName="competitive_advantages" />
              </div>

              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-6">Target Audience</h3>
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1 block">Audience Description</label>
                  <Textarea 
                    rows={4}
                    value={formData.audience_description} 
                    onChange={(e) => setFormData({...formData, audience_description: e.target.value})}
                    className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary resize-none leading-relaxed" 
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1 block">Business Model Summary</label>
                  <Textarea 
                    rows={4}
                    value={formData.business_model_summary} 
                    onChange={(e) => setFormData({...formData, business_model_summary: e.target.value})}
                    className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary resize-none leading-relaxed" 
                  />
                </div>
              </div>
             </div>
          </TabsContent>

          <TabsContent value="persona" className="h-full m-0 data-[state=inactive]:hidden outline-none">
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
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Brand Voice (Company)</label>
                    <Input 
                      value={formData.brand_voice} 
                      onChange={(e) => setFormData({...formData, brand_voice: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Agent Tone</label>
                    <Input 
                      value={formData.agent_tone} 
                      onChange={(e) => setFormData({...formData, agent_tone: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Communication Style</label>
                    <Input 
                      value={formData.communication_style} 
                      onChange={(e) => setFormData({...formData, communication_style: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary" 
                    />
                  </div>
                </div>

              </div>
              <div className="space-y-6">
                <h3 className="text-primary font-semibold tracking-wider text-sm mb-4">Content Strategy</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Engagement Style</label>
                    <Textarea 
                      rows={3}
                      value={formData.engagement_style} 
                      onChange={(e) => setFormData({...formData, engagement_style: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary resize-none leading-relaxed" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Hashtag Strategy</label>
                    <Textarea 
                      rows={3}
                      value={formData.hashtag_strategy} 
                      onChange={(e) => setFormData({...formData, hashtag_strategy: e.target.value})}
                      className="bg-background/80 text-muted-foreground border border-border rounded-md focus-visible:ring-primary resize-none leading-relaxed" 
                    />
                  </div>
                  <TagGroup label="Content Themes" fieldName="content_themes" />
                </div>
              </div>
             </div>
          </TabsContent>

          <TabsContent value="ecosystem" className="h-full flex items-center justify-center p-20 m-0 data-[state=inactive]:hidden outline-none">
            <div className="flex flex-col items-center justify-center text-center max-w-md">
                <h2 className="text-xl text-primary font-bold tracking-widest uppercase mb-2">Ecosystem Config</h2>
                <p className="text-sm text-muted-foreground">Future updates will allow you to sync your configured brand variables directly into partner ecosystems like Web3 networks and automated social syndicates.</p>
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
