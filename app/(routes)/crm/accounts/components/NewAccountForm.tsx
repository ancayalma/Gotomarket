"use client";

import { z } from "zod";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/use-toast";

import { useForm, useFieldArray, useFormContext } from "react-hook-form";
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

import { groupFieldsByTab, type CustomFieldDefinition } from "@/lib/crm/custom-field-defaults";
import { Type, DollarSign, Calendar, Link as LinkIcon, Mail, Phone, Hash, Info, Plus, X } from "lucide-react";

type Props = {
  industries: any[];
  users: any[];
  customFieldDefs?: CustomFieldDefinition[];
  onFinish: () => void;
};

function CustomFieldRenderInput({ def, field, isLoading }: { def: CustomFieldDefinition, field: any, isLoading: boolean }) {
  if (def.type === 'textarea') {
    return (
      <Textarea
        disabled={isLoading}
        placeholder={def.placeholder}
        {...field}
        value={field.value ?? ""}
        className="min-h-[60px] text-xs bg-background/50 border-white/10"
      />
    );
  }
  if (def.type === 'select') {
    return (
      <Select disabled={isLoading} value={field.value || ""} onValueChange={field.onChange}>
        <SelectTrigger className="h-8 text-xs bg-background/50 border-white/10">
            <SelectValue placeholder={def.placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent>
            {def.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                </SelectItem>
            ))}
        </SelectContent>
      </Select>
    );
  }
  if (def.type === 'date') {
    return (
      <Input
        type="date"
        disabled={isLoading}
        {...field}
        value={field.value ?? ""}
        className="h-8 text-xs bg-background/50 border-white/10"
      />
    );
  }
  if (def.type === 'currency') {
    return (
      <div className="relative">
        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
            type="number"
            step="0.01"
            disabled={isLoading}
            placeholder={def.placeholder || "0.00"}
            {...field}
            value={field.value ?? ""}
            className="h-8 pl-6 text-xs bg-background/50 border-white/10"
        />
      </div>
    );
  }
  if (def.type === 'number') {
    return (
      <Input
        type="number"
        disabled={isLoading}
        placeholder={def.placeholder}
        {...field}
        value={field.value ?? ""}
        className="h-8 text-xs bg-background/50 border-white/10"
      />
    );
  }
  return (
    <Input
        type={def.type === 'email' ? 'email' : def.type === 'url' ? 'url' : "text"}
        disabled={isLoading}
        placeholder={def.placeholder}
        {...field}
        value={field.value ?? ""}
        className="h-8 text-xs bg-background/50 border-white/10"
    />
  );
}

function CustomFieldCollection({ tab, fields, control, isLoading }: { tab: string, fields: CustomFieldDefinition[], control: any, isLoading: boolean }) {
    const { fields: items, append, remove } = useFieldArray({
        control,
        name: `custom_fields.${tab}`
    });

    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <div key={item.id} className="relative border border-white/10 rounded-xl p-4 bg-black/20 mt-2">
                    <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)} 
                        className="absolute top-2 right-2 h-6 w-6 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(def => (
                            <FormField
                                key={def.key}
                                control={control}
                                name={`custom_fields.${tab}.${index}.${def.key}`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                            {def.label}
                                            {def.required && <span className="text-red-400 ml-1">*</span>}
                                        </FormLabel>
                                        <FormControl>
                                            <CustomFieldRenderInput def={def} field={field} isLoading={isLoading} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                </div>
            ))}
            <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({})}
                className="text-xs bg-white/[0.02] border-white/10 border-dashed hover:bg-white/[0.05]"
            >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add {tab} Entry
            </Button>
        </div>
    );
}

export function NewAccountForm({ industries, users, customFieldDefs, onFinish }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formSchema = z.object({
    name: z.string().min(3).max(50),
    office_phone: z.string().optional(),
    website: z.string().optional(),
    fax: z.string().optional(),
    company_id: z.string().max(50).optional(),
    vat: z.string().max(20).optional(),
    email: z.string().email().optional().or(z.literal("")),
    billing_street: z.string().max(50).optional(),
    billing_postal_code: z.string().max(10).optional(),
    billing_city: z.string().max(50).optional(),
    billing_state: z.string().max(50).optional(),
    billing_country: z.string().max(50).optional(),
    shipping_street: z.string().optional(),
    shipping_postal_code: z.string().optional(),
    shipping_city: z.string().optional(),
    shipping_state: z.string().optional(),
    shipping_country: z.string().optional(),
    description: z.string().max(1000).optional(),
    status: z.string().max(50).optional(),
    annual_revenue: z.string().max(50).optional(),
    member_of: z.string().max(50).optional(),
    industry: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
    custom_fields: z.record(z.string(), z.any()).optional(),
  });

  type NewAccountFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewAccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      office_phone: "",
      website: "",
      fax: "",
      company_id: "",
      vat: "",
      email: "",
      billing_street: "",
      billing_postal_code: "",
      billing_city: "",
      billing_state: "",
      billing_country: "",
      shipping_street: "",
      shipping_postal_code: "",
      shipping_city: "",
      shipping_state: "",
      shipping_country: "",
      description: "",
      status: "",
      annual_revenue: "",
      member_of: "",
      industry: null,
      assigned_to: null,
      custom_fields: {},
    },
  });

  const onSubmit = async (data: NewAccountFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/crm/account", data);
      toast({
        title: "Success",
        description: "Account created successfully",
      });

      form.reset({
        name: "",
        office_phone: "",
        website: "",
        fax: "",
        company_id: "",
        vat: "",
        email: "",
        billing_street: "",
        billing_postal_code: "",
        billing_city: "",
        billing_state: "",
        billing_country: "",
        shipping_street: "",
        shipping_postal_code: "",
        shipping_city: "",
        shipping_state: "",
        shipping_country: "",
        description: "",
        status: "",
        annual_revenue: "",
        member_of: "",
        industry: null,
        assigned_to: null,
        custom_fields: {},
      });

      onFinish();

      if (response.data?.newAccount?.id) {
        router.push(`/crm/accounts/${response.data.newAccount.id}`);
      } else {
        router.refresh();
      }
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

  const customFieldGroups = customFieldDefs ? groupFieldsByTab(customFieldDefs) : {};
  const hasCustomFields = Object.keys(customFieldGroups).length > 0;

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
            <div className="grid grid-cols-1 gap-4">
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

            {hasCustomFields && (
              <div className="space-y-6 pt-6 -mx-10 px-10 border-t border-white/5 bg-white/[0.01]">
                {Object.entries(customFieldGroups).map(([tab, fields]) => {
                  const isCollection = fields[0]?.isCollection;
                  return (
                  <div key={tab} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
                          <Info size={14} />
                        </div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">{tab} Form Attributes</h3>
                        {isCollection && <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase font-bold">Repeatable</span>}
                    </div>
                    {isCollection ? (
                        <div className="border-l border-white/5 pl-4">
                            <CustomFieldCollection tab={tab} fields={fields} control={form.control} isLoading={isLoading} />
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l border-white/5 pl-4">
                        {fields.map(def => (
                          <FormField
                            key={def.key}
                            control={form.control}
                            name={`custom_fields.${def.key}` as any}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                    {def.label}
                                    {def.required && <span className="text-red-400 ml-1">*</span>}
                                </FormLabel>
                                <FormControl>
                                  <CustomFieldRenderInput def={def} field={field} isLoading={isLoading} />
                                </FormControl>
                                {def.description && (
                                    <p className="text-[10px] text-muted-foreground/40 mt-1">{def.description}</p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                    </div>
                    )}
                  </div>
                )})}
              </div>
            )}

          </div>
        </div>
        <div className="grid gap-2 py-5">
          <Button disabled={isLoading} type="submit">
            Create Account
          </Button>
        </div>
      </form>
    </Form>
  );
}
