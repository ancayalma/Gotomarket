const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const schema = z.object({
        timeframe: z.enum(["all_time"]).describe("timeframe")
    });
console.log(JSON.stringify(zodToJsonSchema(schema), null, 2));

const schema2 = z.object({
        intent: z.string().describe("Intent"),
        search: z.string().optional().describe("Search"),
    });
console.log(JSON.stringify(zodToJsonSchema(schema2), null, 2));
