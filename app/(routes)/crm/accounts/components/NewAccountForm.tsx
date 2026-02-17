"use client";

import { z } from "zod";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/use-toast";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

type Props = {
  industries: any[];
  users: any[];
  onFinish: () => void;
};

export function NewAccountForm({ industries, users, onFinish }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formSchema = z.object({
    name: z.string().min(3).max(50),
    office_phone: z.string().optional(),
    website: z.string().optional(),
    fax: z.string().optional(),
    company_id: z.string().min(5).max(10),
    vat: z.string().max(20).optional(),
    email: z.string().email(),
    billing_street: z.string().min(3).max(50),
    billing_postal_code: z.string().min(2).max(10),
    billing_city: z.string().min(3).max(50),
    billing_state: z.string().min(3).max(50).optional(),
    billing_country: z.string().min(3).max(50),
    shipping_street: z.string().optional(),
    shipping_postal_code: z.string().optional(),
    shipping_city: z.string().optional(),
    shipping_state: z.string().optional(),
    shipping_country: z.string().optional(),
    description: z.string().min(3).max(1000).optional(),
    status: z.string().min(3).max(50).optional(),
    annual_revenue: z.string().min(3).max(50).optional(),
    member_of: z.string().min(3).max(50).optional(),
    industry: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
  });

  type NewAccountFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewAccountFormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: NewAccountFormValues) => {
    //console.log(data);
    setIsLoading(true);
    try {
      await axios.post("/api/crm/account", data);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      form.reset();
      router.refresh();
      onFinish();
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-10">
        {/*        <div>
          <pre>
            <code>{JSON.stringify(form.watch(), null, 2)}</code>
          </pre>
        </div> */}
        <div className="w-full max-w-[800px] text-sm mx-auto">
          <div className="pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Account name</FormLabel>
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
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Account ID</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="1234567890"
                        {...field}
                        value={field.value ?? ""}
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
                name="office_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Office phone</FormLabel>
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="account@domain.com"
                        {...field}
                        value={field.value ?? ""}
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
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Website</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="https://www.domain.com"
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
                name="vat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">VAT number</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="US123456789"
                        {...field}
                        value={field.value ?? ""}
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Address Information</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] uppercase font-bold text-primary hover:text-primary/80"
                  onClick={() => {
                    form.setValue('shipping_street', form.getValues('billing_street'));
                    form.setValue('shipping_city', form.getValues('billing_city'));
                    form.setValue('shipping_state', form.getValues('billing_state'));
                    form.setValue('shipping_postal_code', form.getValues('billing_postal_code'));
                    form.setValue('shipping_country', form.getValues('billing_country'));
                  }}
                >
                  Copy Billing to Shipping
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {/* Billing */}
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter mb-1">Billing</p>
                  <FormField
                    control={form.control}
                    name="billing_street"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Street" {...field} value={field.value ?? ""} className="h-7 text-xs" />
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
                            <Input disabled={isLoading} placeholder="City" {...field} value={field.value ?? ""} className="h-7 text-xs" />
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
                            <Input disabled={isLoading} placeholder="State" {...field} value={field.value ?? ""} className="h-7 text-xs" />
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
                            <Input disabled={isLoading} placeholder="ZIP Code" {...field} value={field.value ?? ""} className="h-7 text-xs" />
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
                            <Input disabled={isLoading} placeholder="Country" {...field} value={field.value ?? ""} className="h-7 text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Shipping */}
                <div className="space-y-2 border-l border-white/5 pl-4">
                  <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter mb-1">Shipping</p>
                  <FormField
                    control={form.control}
                    name="shipping_street"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Street" {...field} value={field.value ?? ""} className="h-7 text-xs" />
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
                            <Input disabled={isLoading} placeholder="City" {...field} value={field.value ?? ""} className="h-7 text-xs" />
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
                            <Input disabled={isLoading} placeholder="State" {...field} value={field.value ?? ""} className="h-7 text-xs" />
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
                            <Input disabled={isLoading} placeholder="ZIP Code" {...field} value={field.value ?? ""} className="h-7 text-xs" />
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
                            <Input disabled={isLoading} placeholder="Country" {...field} value={field.value ?? ""} className="h-7 text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Assigned to</FormLabel>
                      <FormControl>
                        <Combobox
                          options={users.map((user) => ({
                            label: user.name,
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
                  name="industry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Industry</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="Software, Healthcare, etc." {...field} value={field.value ?? ""} className="h-8 shadow-none bg-background/50 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="annual_revenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Revenue</FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="$1M+" {...field} value={field.value ?? ""} className="h-8 text-xs" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="member_of"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Parent Co</FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Parent Co" {...field} value={field.value ?? ""} className="h-8 text-xs" />
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
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isLoading}
                          placeholder="About the account..."
                          {...field}
                          className="min-h-[60px] text-xs"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-2 py-5">
          <Button disabled={isLoading} type="submit">
            Create account
          </Button>
        </div>
      </form>
    </Form>
  );
}
