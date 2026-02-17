"use client";

import { z } from "zod";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";

import { useToast } from "@/components/ui/use-toast";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import SuspenseLoading from "@/components/loadings/suspense";

type Props = {
  initialData: any;
  onFinish?: () => void;
  open?: (val: boolean) => void;
};

export function UpdateAccountForm({ initialData, onFinish, open }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch CRM data (industries, users) for the form
  const { data: crmData, isLoading: isLoadingCrmData } = useSWR("/api/crm/account/crm-data", fetcher);
  const { data: usersData, isLoading: isLoadingUsers } = useSWR("/api/team/members", fetcher);

  const industries = crmData?.industries || [];
  const users = usersData?.members || [];

  const formSchema = z.object({
    id: z.string(),
    name: z.string().min(3).max(50),
    office_phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    fax: z.string().optional().nullable(),
    company_id: z.string().min(5).max(30).optional().nullable(),
    vat: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    billing_street: z.string().optional().nullable(),
    billing_postal_code: z.string().optional().nullable(),
    billing_city: z.string().optional().nullable(),
    billing_state: z.string().optional().nullable(),
    billing_country: z.string().optional().nullable(),
    shipping_street: z.string().optional().nullable(),
    shipping_postal_code: z.string().optional().nullable(),
    shipping_city: z.string().optional().nullable(),
    shipping_state: z.string().optional().nullable(),
    shipping_country: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    annual_revenue: z.string().optional().nullable(),
    member_of: z.string().optional().nullable(),
    industry: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
  });

  type AccountFormValues = z.infer<typeof formSchema>;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      name: initialData.name || "",
      company_id: initialData.company_id || "",
      email: initialData.email || "",
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setIsLoading(true);
    try {
      await axios.put("/api/crm/account", data);
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
      router.refresh();
      if (onFinish) onFinish();
      if (open) open(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCrmData || isLoadingUsers) {
    return <SuspenseLoading />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-4 space-y-6">
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary/50 border-b border-white/5 pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Account name</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="BasaltCRM Inc." {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Account ID</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="1234567890" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
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
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="account@domain.com" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="office_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Phone</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="+15550000000" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Website</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="https://..." {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Fax</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="Fax number" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">VAT Number</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="VAT" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="annual_revenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Annual Revenue</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="$1,000,000" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary/50 border-b border-white/5 pb-2">Address Information</h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Billing */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-tighter">Billing Address</p>
                <FormField
                  control={form.control}
                  name="billing_street"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="Street" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="billing_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="City" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billing_state"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="State" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="billing_postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Postal Code" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billing_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Country" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-tighter">Shipping Address</p>
                <FormField
                  control={form.control}
                  name="shipping_street"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="Street" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="shipping_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="City" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shipping_state"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="State" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="shipping_postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Postal Code" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shipping_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Country" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CRM & Classification Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary/50 border-b border-white/5 pb-2">Classification</h3>
            <div className="grid grid-cols-2 gap-4">
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
                        placeholder="Select user"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Industry</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="Software, Healthcare, etc." {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs bg-background/50 border-white/10">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Prospect">Prospect</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="member_of"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Member of (Parent)</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="Parent Account" {...field} value={field.value || ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Description</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isLoading}
                    placeholder="Brief description of the account..."
                    {...field}
                    value={field.value || ""}
                    className="min-h-[100px] bg-background/50 border-white/10"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 border-t border-white/5">
          <Button disabled={isLoading} type="submit" className="w-full h-10">
            {isLoading ? "Saving changes..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
