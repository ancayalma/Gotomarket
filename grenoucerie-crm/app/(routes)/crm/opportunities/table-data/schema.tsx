import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const opportunitySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  next_step: z.string().nullable(),
  close_date: z.any().nullable(),
  status: z.string().nullable(),
  budget: z.number().nullable(),
  expected_revenue: z.number().nullable(),
  assigned_account: z.any().optional().nullable(),
  assigned_sales_stage: z.any().optional().nullable(),
  assigned_to_user: z.any().optional().nullable(),
  assigned_lead: z.any().optional().nullable(),
});

export type Opportunity = z.infer<typeof opportunitySchema>;
