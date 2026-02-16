"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CalendarIcon, Linkedin, Facebook, Twitter } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";

import fetcher from "@/lib/fetcher";
import useSWR from "swr";
import SuspenseLoading from "@/components/loadings/suspense";

//TODO: fix all the types
type NewTaskFormProps = {
  initialData: any;
  setOpen: (value: boolean) => void;
};

export function UpdateLeadForm({ initialData, setOpen }: NewTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: accounts, isLoading: isLoadingAccounts } = useSWR(
    "/api/crm/account",
    fetcher
  );

  const { data: userResponse, isLoading: isLoadingUsers } = useSWR(
    "/api/team/members",
    fetcher
  );

  const { data: projectResponse, isLoading: isLoadingProjects } = useSWR(
    "/api/projects",
    fetcher
  );

  const users = userResponse?.members || [];
  const projects = projectResponse?.projects || [];

  const formSchema = z.object({
    id: z.string().min(5).max(30),
    firstName: z.string().optional().nullable(),
    lastName: z.string().min(3).max(30).nonempty(),
    company: z.string().nullable().optional(),
    jobTitle: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().min(0).max(15).nullable().optional(),
    description: z.string().nullable().optional(),
    lead_source: z.string().nullable().optional(),
    refered_by: z.string().optional().nullable(),
    // Socials
    social_twitter: z.string().optional().nullable(),
    social_facebook: z.string().optional().nullable(),
    social_linkedin: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
    status: z.string(),
    //TODO: add type schema from db as data source
    type: z.string().optional().nullable(),
    accountIDs: z.string().optional().nullable(),
    project: z.string().optional().nullable(),
  });

  type NewLeadFormValues = z.infer<typeof formSchema>;

  //TODO: fix this any
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: NewLeadFormValues) => {
    setIsLoading(true);
    try {
      await axios.put("/api/crm/leads", data);
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data,
      });
    } finally {
      setIsLoading(false);
      setOpen(false);
      router.refresh();
    }
  };

  const leadStatus = [
    { name: "New", id: "NEW" },
    { name: "In progress", id: "IN_PROGRESS" },
    { name: "Completed", id: "COMPLETED" },
  ];

  if (isLoadingUsers || isLoadingAccounts || isLoadingProjects)
    return (
      <div>
        <SuspenseLoading />
      </div>
    );

  if (!userResponse || !initialData)
    return <div>Something went wrong, there is no data for form</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-10">
        <div className="w-full max-w-[800px] text-sm">
          <div className="pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">First name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Johny"
                        {...field}
                        value={field.value ?? ""}
                        className="h-8"
                      />
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
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Last name *</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Walker"
                        {...field}
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Company</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="BasaltCRM Inc."
                        {...field}
                        value={field.value ?? ""}
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Job Title</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="CTO" {...field} value={field.value ?? ""} className="h-8" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="johny@domain.com"
                        {...field}
                        value={field.value ?? ""}
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Phone</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="+15550000000"
                        {...field}
                        value={field.value ?? ""}
                        className="h-8"
                        onBlur={(e) => {
                          const formatted = e.target.value.replace(/\D/g, "");
                          if (formatted.length === 10) field.onChange(`+1${formatted}`);
                          else if (formatted.length === 11 && formatted.startsWith("1")) field.onChange(`+${formatted}`);
                          else if (e.target.value.startsWith("+")) field.onChange(`+${formatted}`);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="refered_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Refered by</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Referer"
                        {...field}
                        value={field.value ?? ""}
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Source</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                        <SelectItem value="Advertisement">Advertisement</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Assigned to</FormLabel>
                      <FormControl>
                        <Combobox
                          options={users.map((user: any) => ({
                            label: user.name || user.email,
                            value: user.id,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a user"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="project"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Project</FormLabel>
                      <FormControl>
                        <Combobox
                          options={projects.map((project: any) => ({
                            label: project.title,
                            value: project.id,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Choose a project"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Lead status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select lead status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leadStatus.map((status: any) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountIDs"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Account</FormLabel>
                      <FormControl>
                        <Combobox
                          options={Array.isArray(accounts) ? accounts.map((account: any) => ({
                            label: account.name,
                            value: account.id,
                          })) : []}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Choose account"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Social & Context</h3>
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="social_linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2 border border-white/10 rounded-md px-2 bg-background/50 h-8">
                          <Linkedin className="h-3 w-3 text-muted-foreground" />
                          <Input placeholder="LinkedIn" {...field} className="border-0 bg-transparent h-full px-0 text-[10px] focus-visible:ring-0" />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="social_facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2 border border-white/10 rounded-md px-2 bg-background/50 h-8">
                          <Facebook className="h-3 w-3 text-muted-foreground" />
                          <Input placeholder="Facebook" {...field} className="border-0 bg-transparent h-full px-0 text-[10px] focus-visible:ring-0" />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="social_twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2 border border-white/10 rounded-md px-2 bg-background/50 h-8">
                          <Twitter className="h-3 w-3 text-muted-foreground" />
                          <Input placeholder="Twitter" {...field} className="border-0 bg-transparent h-full px-0 text-[10px] focus-visible:ring-0" />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        disabled={isLoading}
                        placeholder="Lead description or notes..."
                        {...field}
                        value={field.value ?? ""}
                        className="min-h-[60px] text-xs bg-background/50"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        <div className="pt-2">
          <Button disabled={isLoading} type="submit" className="w-full">
            {isLoading ? "Saving..." : "Update lead"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
