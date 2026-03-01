import { PrismaClient } from "@prisma/client";
const TENANT_SCOPED_MODELS = ["crm_Accounts"];

const client = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (TENANT_SCOPED_MODELS.includes(model)) {
          console.log("extending!");
        }
        return query(args);
      }
    }
  }
});

export type MyPrisma = typeof client;
