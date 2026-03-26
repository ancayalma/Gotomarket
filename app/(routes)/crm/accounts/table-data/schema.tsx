import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const accountSchema = z.object({
  id: z.string(),
  createdAt: z.date().optional(),
  name: z.string(),
  assigned_to_user: z.object({ name: z.string().optional().nullable() }).nullable().optional(),
  contacts: z
    .array(
      z.object({
        first_name: z.string().nullable().optional(),
        last_name: z.string(),
      })
    )
    .optional(),
  email: z.string().nullable().optional(),
  additional_emails: z.array(z.string()).nullable().optional(),
  status: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  // Location
  billing_city: z.string().nullable().optional(),
  billing_state: z.string().nullable().optional(),
  billing_country: z.string().nullable().optional(),
  // Finances
  employees: z.string().nullable().optional(),
  annual_revenue: z.string().nullable().optional(),
  vat: z.string().nullable().optional(),
  company_id: z.string().nullable().optional(),
  // Notes / Social
  description: z.string().nullable().optional(),
});

export type Account = z.infer<typeof accountSchema>;
