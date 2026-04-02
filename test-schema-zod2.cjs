const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const searchCompaniesSchema = z.object({
  query: z.string().describe("The search query to find companies (e.g., 'SaaS companies in San Francisco')"),
  count: z.number().optional().describe("Number of results to return (1-50), defaults to 20"),
});

console.log(JSON.stringify(zodToJsonSchema(searchCompaniesSchema), null, 2));
