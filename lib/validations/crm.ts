import { z } from "zod";

export const leadSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  company: z.string().max(200).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  lead_source: z.string().max(100).optional().nullable(),
  refered_by: z.string().max(100).optional().nullable(),
  social_twitter: z.string().max(255).optional().nullable(),
  social_facebook: z.string().max(255).optional().nullable(),
  social_linkedin: z.string().max(255).optional().nullable(),
  assigned_to: z.string().length(24, "Invalid user ID").optional().nullable(),
  accountIDs: z.array(z.string().length(24)).optional(),
  project: z.string().max(200).optional().nullable(),
});

export type LeadInput = z.infer<typeof leadSchema>;
