const { z } = require("zod");
const { tool } = require("ai");

const myTool = tool({
    description: "test",
    parameters: z.object({
        timeframe: z.enum(["all_time"]).describe("timeframe")
    }),
    execute: async () => {}
});

console.log(JSON.stringify(myTool.parameters, null, 2));
