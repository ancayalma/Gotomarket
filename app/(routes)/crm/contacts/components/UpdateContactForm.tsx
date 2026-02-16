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
import fetcher from "@/lib/fetcher";
import useSWR from "swr";
import SuspenseLoading from "@/components/loadings/suspense";

//TODO: fix all the types
type NewTaskFormProps = {
  initialData: any;
  setOpen: (value: boolean) => void;
};

export function UpdateContactForm({ initialData, setOpen }: NewTaskFormProps) {
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

  const users = userResponse?.members || [];

  const [searchTerm, setSearchTerm] = useState("");

  const formSchema = z.object({
    id: z.string().min(5).max(30),
    birthday_year: z.string().optional().nullable(),
    birthday_month: z.string().optional().nullable(),
    birthday_day: z.string().optional().nullable(),
    first_name: z.string().nullable().optional(),
    last_name: z.string(),
    description: z.string().nullable().optional(),
    email: z.string(),
    personal_email: z.string().nullable().optional(),
    office_phone: z.string().nullable().optional(),
    mobile_phone: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    status: z.boolean(),
    type: z.string(),
    assigned_to: z.string().optional().nullable(),
    accountsIDs: z.string().nullable().optional(),
    assigned_account: z.string().nullable().optional(),
    social_twitter: z.string().nullable().optional(),
    social_facebook: z.string().nullable().optional(),
    social_linkedin: z.string().nullable().optional(),
    social_skype: z.string().nullable().optional(),
    social_youtube: z.string().nullable().optional(),
    social_tiktok: z.string().nullable().optional(),
  });

  type NewAccountFormValues = z.infer<typeof formSchema>;

  //TODO: fix this any
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const contactType = [
    { name: "Customer", id: "Customer" },
    { name: "Partner", id: "Partner" },
    { name: "Vendor", id: "Vendor" },
  ];

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length === 10) return `+1${phoneNumber}`;
    if (phoneNumber.length === 11 && phoneNumber.startsWith("1")) return `+${phoneNumber}`;
    if (value.startsWith("+")) return `+${phoneNumber}`;
    return value;
  };

  const onSubmit = async (data: NewAccountFormValues) => {
    setIsLoading(true);
    try {
      await axios.put("/api/crm/contacts", data);
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data,
      });
    } finally {
      setIsLoading(false);
      router.refresh();
      setOpen(false);
    }
  };

  if (isLoadingUsers || isLoadingAccounts)
    return (
      <div>
        <SuspenseLoading />
      </div>
    );

  const yearArray = Array.from(
    //start in 1923 and count to +100 years
    { length: 100 },
    (_, i) => i + 1923
  );


  if (!users || !accounts || !initialData)
    return <div>Something went wrong, there is no data for form</div>;

  //console.log(accounts, "accounts");
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-10">
        {/*    <div>
          <pre>
            <code>{JSON.stringify(form.formState.errors, null, 2)}</code>
          </pre>
        </div> */}
        {/*     <pre>
          <code>{JSON.stringify(initialData, null, 2)}</code>
        </pre> */}
        {/*   <div>
          <pre>
            <code>{JSON.stringify(form.watch(), null, 2)}</code>
          </pre>
        </div> */}
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
                      <Input disabled={isLoading} placeholder="John" {...field} className="h-8" />
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
                      <Input disabled={isLoading} placeholder="Doe" {...field} className="h-8" />
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
                          <SelectContent className="max-h-56">
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
                          options={users?.map((user: any) => ({
                            label: user.name || user.email,
                            value: user.id,
                          })) || []}
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
                          options={accounts?.map((account: any) => ({
                            label: account.name,
                            value: account.id,
                          })) || []}
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
                          <Input disabled={isLoading} placeholder="CTO" {...field} className="h-8" />
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
                          <Input disabled={isLoading} placeholder="Twitter URL" {...field} className="h-7 text-[10px]" />
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
                          <Input disabled={isLoading} placeholder="Facebook URL" {...field} className="h-7 text-[10px]" />
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
                          <Input disabled={isLoading} placeholder="Linkedin URL" {...field} className="h-7 text-[10px]" />
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
                          <Input disabled={isLoading} placeholder="Skype URL" {...field} className="h-7 text-[10px]" />
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
                          <Input disabled={isLoading} placeholder="YouTube URL" {...field} className="h-7 text-[10px]" />
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
                          <Input disabled={isLoading} placeholder="TikTok URL" {...field} className="h-7 text-[10px]" />
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
              "Update contact"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
