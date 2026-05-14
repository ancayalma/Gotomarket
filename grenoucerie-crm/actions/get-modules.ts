import { prismadb } from "@/lib/prisma";
import { cache } from "react";

/**
 * React.cache() deduplicate: getModules() is called from both
 * SideBar.tsx and DashboardRoleManager.tsx in the same RSC tree.
 * Without caching, the same DB query fires twice per request.
 */
export const getModules = cache(async () => {
  const data = await prismadb.system_Modules_Enabled.findMany({
    orderBy: [{ position: "asc" }],
  });
  return data;
});
