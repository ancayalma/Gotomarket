"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

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
import { Switch } from "@/components/ui/switch";

type NewTaskFormProps = {
  users: any[];
  accounts: any[];
  onFinish: () => void;
};

export function NewContactForm({
  users,
  accounts,
  onFinish,
}: NewTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formSchema = z.object({
    birthday_year: z.string().optional().nullable(),
    birthday_month: z.string().optional().nullable(),
    birthday_day: z.string().optional().nullable(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().min(1, "Last name is required"),
    description: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    personal_email: z.string().optional().nullable(),
    office_phone: z.string().optional().nullable(),
    mobile_phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    status: z.boolean(),
    type: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
    assigned_account: z.string().optional().nullable(),
    social_twitter: z.string().optional().nullable(),
    social_facebook: z.string().optional().nullable(),
    social_linkedin: z.string().optional().nullable(),
    social_skype: z.string().optional().nullable(),
    social_youtube: z.string().optional().nullable(),
    social_tiktok: z.string().optional().nullable(),
  });

  type NewAccountFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewAccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: true,
      first_name: "",
      last_name: "",
      description: "",
      email: "",
      personal_email: "",
      office_phone: "",
      mobile_phone: "",
      website: "",
      position: "",
      type: null,
      assigned_to: null,
      assigned_account: null,
      social_twitter: "",
      social_facebook: "",
      social_linkedin: "",
      social_skype: "",
      social_youtube: "",
      social_tiktok: "",
      birthday_year: null,
      birthday_month: null,
      birthday_day: null,
    },
  });

  const contactType = [
    { name: "Customer", id: "Customer" },
    { name: "Partner", id: "Partner" },
    { name: "Vendor", id: "Vendor" },
  ];

  const yearArray = Array.from(
    { length: 100 },
    (_, i) => i + 1923
  );

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, "");

    // If it's exactly 10 digits, assume US and add +1
    if (phoneNumber.length === 10) {
      return `+1${phoneNumber}`;
    }

    // If it's 11 digits and starts with 1, add +
    if (phoneNumber.length === 11 && phoneNumber.startsWith("1")) {
      return `+${phoneNumber}`;
    }

    // If it already starts with +, just return digits (keeping +)
    if (value.startsWith("+")) {
      return `+${phoneNumber}`;
    }

    // Default to +1 if it doesn't have a plus and is less than 10 digits but more than 0?
    // Maybe just leave it for the user to finish if it's not a clear match.
    return value;
  };

  const onSubmit = async (data: NewAccountFormValues) => {
    setIsLoading(true);
    try {
      await axios.post("/api/crm/contacts", data);
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data,
      });
    } finally {
      setIsLoading(false);
      form.reset();
      router.refresh();
      onFinish();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-10">
        <div className="w-full max-w-[800px] text-sm mx-auto">
          <div className="pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">First name</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="John" {...field} value={field.value ?? ""} className="h-8" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Last name</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="Doe" {...field} value={field.value ?? ""} className="h-8" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobile_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Mobile phone</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="+15550000000"
                        {...field}
                        value={field.value ?? ""}
                        className="h-8"
                        onBlur={(e) => {
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
                          const formatted = formatPhoneNumber(e.target.value);
                          field.onChange(formatted);
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Work Email</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="john@domain.com"
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
                name="personal_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Personal email</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="littlejohny@gmail.com"
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
              <div className="space-y-1">
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Birthday - (optional)</FormLabel>
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="birthday_year"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <SelectTrigger className="h-8 text-xs">Year</SelectTrigger>
                          <SelectContent>
                            {yearArray.map((yearOption) => (
                              <SelectItem key={yearOption} value={yearOption.toString()}>{yearOption}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthday_month"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <SelectTrigger className="h-8 text-xs">Month</SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((monthOption) => (
                              <SelectItem key={monthOption} value={monthOption.toString()}>{monthOption}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthday_day"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <SelectTrigger className="h-8 text-xs">Day</SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((dayOption) => (
                              <SelectItem key={dayOption} value={dayOption.toString()}>{dayOption}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
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
                      placeholder="Useful information about the contact"
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[60px] text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Assigned user</FormLabel>
                      <FormControl>
                        <Combobox
                          options={users.map((item: any) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select assigned user"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_account"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Assign an Account</FormLabel>
                      <FormControl>
                        <Combobox
                          options={accounts.map((account: any) => ({
                            label: account.name,
                            value: account.id,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select assigned account"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Position</FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="CTO" {...field} value={field.value ?? ""} className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Contact type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactType.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 p-2 px-3">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Active?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2 border-l border-white/5 pl-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Social Profiles</p>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="social_twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Twitter URL" {...field} value={field.value ?? ""} className="h-7 text-[10px]" />
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
                          <Input disabled={isLoading} placeholder="Facebook URL" {...field} value={field.value ?? ""} className="h-7 text-[10px]" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="social_linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Linkedin URL" {...field} value={field.value ?? ""} className="h-7 text-[10px]" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="social_skype"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="Skype URL" {...field} value={field.value ?? ""} className="h-7 text-[10px]" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="social_youtube"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="YouTube URL" {...field} value={field.value ?? ""} className="h-7 text-[10px]" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="social_tiktok"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input disabled={isLoading} placeholder="TikTok URL" {...field} value={field.value ?? ""} className="h-7 text-[10px]" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-2 py-5">
          <Button disabled={isLoading} type="submit">
            {isLoading ? (
              <span className="flex items-center animate-pulse">
                Saving data ...
              </span>
            ) : (
              "Create contact"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
