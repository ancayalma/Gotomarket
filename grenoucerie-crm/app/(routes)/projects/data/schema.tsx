import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  visibility: z.string().nullable().optional(),
  assigned_user: z
    .object({
      name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  brand_logo_url: z.string().optional().nullable(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  date_created: z.union([z.string(), z.date()]).optional(),
});

export type Task = z.infer<typeof taskSchema>;
