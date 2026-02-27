"use client";

import LoadingComponent from "@/components/LoadingComponent";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  FolderKanban,
  Target,
  MessageSquare,
  Palette,
  X,
  Plus,
  ShieldCheck,
  Rocket,
  Users as UsersIcon,
  Calendar as CalendarIcon,
} from "lucide-react";

type Props = {
  customTrigger?: React.ReactNode;
  entityName?: string;
  apiEndpoint?: string; // Override POST target (e.g. "/api/campaigns")
}

const formSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(3).max(500),
  visibility: z.string().min(3).max(255),
  accountId: z.string().optional().or(z.literal("")),
  opportunityId: z.string().optional().or(z.literal("")),
  projectManagerId: z.string().optional().or(z.literal("")),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.number(),
  require_approval: z.boolean(),
});

type NewProjectFormValues = z.infer<typeof formSchema>;

const NewProjectDialog = ({ customTrigger, entityName = "Project", apiEndpoint = "/api/projects/" }: Props) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basics");

  const [accounts, setAccounts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      visibility: "private",
      accountId: "",
      opportunityId: "",
      projectManagerId: "",
      budget: 0,
      require_approval: false,
    },
  });

  useEffect(() => {
    setIsMounted(true);
    if (open) {
      const fetchData = async () => {
        try {
          const [accountsRes, oppsRes, usersRes] = await Promise.all([
            axios.get("/api/crm/account"),
            axios.get("/api/crm/opportunity"),
            axios.get("/api/crm/leads/team-members"), // Reusing team members endpoint if exists
          ]);
          setAccounts(accountsRes.data || []);
          setOpportunities(oppsRes.data.opportunities || []);
          setUsers(usersRes.data || []);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [open]);

  if (!isMounted) return null;

  const onSubmit = async (data: NewProjectFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        status: "ACTIVE"
      };
      await axios.post(apiEndpoint, payload);
      toast({
        title: "Success",
        description: `New project: ${data.title}, created successfully`,
      });
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || error?.response?.data || "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? (
          <div className="cursor-pointer" onClick={() => setOpen(true)}>{customTrigger}</div>
        ) : (
          <Button className="px-2">New Project</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
            <FolderKanban className="w-6 h-6 text-primary" />
            Create Delivery Project
          </DialogTitle>
          <DialogDescription className="pb-2">
            Initialize a new execution board after a successful deal.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingComponent />
        ) : (
          <Form {...form}>
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="basics" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <FolderKanban className="w-4 h-4 mr-2" />
                    Basics
                  </TabsTrigger>
                  <TabsTrigger value="delivery" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Rocket className="w-4 h-4 mr-2" />
                    Delivery
                  </TabsTrigger>
                  <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Team
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[450px] mt-6 pr-4">
                  {/* Basics Tab */}
                  <TabsContent value="basics" className="space-y-5 animate-in fade-in-50 duration-300">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Project Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Enterprise Onboarding - Acme Corp"
                              className="bg-background/50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Give this delivery project a clear, descriptive name.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Scope & Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the project goals, deliverables, and high-level scope."
                              className="min-h-[120px] bg-background/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Visibility</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background/50">
                                  <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="private">Private (Team only)</SelectItem>
                                <SelectItem value="public">Public (All users)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="require_approval"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-xl border bg-muted/30 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                Approval Required
                              </FormLabel>
                              <FormDescription className="text-xs">Need admin sign-off</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Delivery Tab */}
                  <TabsContent value="delivery" className="space-y-5 animate-in fade-in-50 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Client Account</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background/50">
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((acc: any) => (
                                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="opportunityId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Related Opportunity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background/50">
                                  <SelectValue placeholder="Select deal" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {opportunities.map((opp: any) => (
                                  <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-semibold">Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal bg-background/50",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date("2000-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-semibold">Target End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal bg-background/50",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < (form.getValues("startDate") || new Date())}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Project Budget</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7 bg-background/50"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">Total allocated contract value for execution.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Team Tab */}
                  <TabsContent value="team" className="space-y-5 animate-in fade-in-50 duration-300">
                    <FormField
                      control={form.control}
                      name="projectManagerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Project Manager</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Assign a PM" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="rounded-xl border bg-muted/20 p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <UsersIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">Collaboration Ready</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          You and the PM will be added as lead members by default. You can invite more team members once the project board is created.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-primary/10">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="px-6">Cancel</Button>
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  {isLoading ? "Initialising..." : "Create Project"}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
