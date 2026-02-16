import { getNavigationConfig } from "@/actions/navigation/get-navigation-config";
import { DEFAULT_NAV_STRUCTURE, NavItem } from "@/lib/navigation-defaults";
import DynamicModuleMenu from "./dynamic-navigation/DynamicModuleMenu";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModules } from "@/actions/get-modules";
import { prismadb } from "@/lib/prisma";
import { getCaseStats } from "@/actions/crm/cases/get-case-stats";
import { getDictionary } from "@/dictionaries";

const SideBar = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  const [modules, user, caseStats, dbNavConfig] = await Promise.all([
    getModules(),
    (prismadb.users as any).findUnique({
      where: { id: session.user.id },
      include: {
        assigned_team: {
          include: { assigned_plan: true }
        }
      }
    }),
    getCaseStats(),
    getNavigationConfig()
  ]);

  if (!modules) return null;

  //Get user language
  const lang = session.user.userLanguage;

  //Fetch translations from dictionary
  const dict = await getDictionary(lang as "en" | "cz" | "de");

  if (!dict) return null;

  const team = (user as any)?.assigned_team;
  let features: string[] = [];

  if (team?.assigned_plan) {
    features = team.assigned_plan.features;
  } else {
    // Fallback import
    const { getSubscriptionPlan } = await import("@/lib/subscription");
    const slug = team?.subscription_plan || "FREE";
    features = getSubscriptionPlan(slug).features;
  }

  const teamRole = (user as any)?.team_role || "MEMBER";
  const isPartnerAdmin = (user as any).is_admin || teamRole === "PLATFORM_ADMIN" || (user as any).assigned_team?.slug === "basalt" || (user as any).assigned_team?.slug === "basalthq";

  // Resolve Navigation Structure
  const rawNavStructure = (dbNavConfig as NavItem[]) || DEFAULT_NAV_STRUCTURE;

  // Patch: Ensure Projects doesn't route to Campaigns due to outdated DB config
  const activeNavStructure = rawNavStructure.map(item => {
    // 1. Inject Accounts into Marketing Hub if missing
    // 1. Marketing Hub Patches
    if (item.id === "group_marketing") {
      let newChildren = [...(item.children || [])];

      // Inject Accounts if missing
      const hasAccounts = newChildren.some(c => c.id === "nav_accounts");
      if (!hasAccounts) {
        const defaultAccounts = DEFAULT_NAV_STRUCTURE
          .find(g => g.id === "group_marketing")
          ?.children?.find(c => c.id === "nav_accounts");
        if (defaultAccounts) newChildren.push(defaultAccounts);
      }

      // Inject Lists if missing
      const hasLists = newChildren.some(c => c.id === "nav_lists");
      if (!hasLists) {
        newChildren.push({
          id: "nav_lists",
          type: "item",
          label: "Lists",
          iconName: "List",
          href: "/lists",
          badge: undefined,
          permissions: { minRole: "ADMIN" }
        } as any);
      }

      // Inject Campaigns if missing
      const hasCampaigns = newChildren.some(c => c.id === "nav_campaigns");
      if (!hasCampaigns) {
        newChildren.push({
          id: "nav_campaigns",
          type: "item",
          label: "Campaigns",
          iconName: "Megaphone",
          href: "/campaigns",
          badge: undefined,
          permissions: { minRole: "ADMIN" }
        } as any);
      }

      // Remove deprecated Outreach if it exists
      newChildren = newChildren.filter(c => c.id !== "nav_outreach");

      return {
        ...item,
        children: newChildren
      };
    }

    // 2. Clean up Leads (remove Wizard/Pools)
    if (item.id === "group_sales") {
      if (item.children) {
        return {
          ...item,
          children: item.children.map(child => {
            if (child.id === "nav_leads") {
              // Return clean leads structure from defaults to ensure no stale children
              const defaultLeads = DEFAULT_NAV_STRUCTURE
                .find(g => g.id === "group_sales")
                ?.children?.find(c => c.id === "nav_leads");
              return defaultLeads || child;
            }
            return child;
          })
        };
      }
    }

    if (item.id === "nav_projects" && (item.href?.startsWith("/campaigns") || item.href === "/crm/outreach")) {
      return { ...item, href: "/projects" };
    }
    if (item.children) {
      return {
        ...item,
        children: item.children
          .filter(child => !["sub_projects_gantt", "sub_projects_calendar", "sub_projects_docs"].includes(child.id))
          .map(child => {
            // Fix main All Projects link
            if (child.id === "sub_projects_all" && (child.href?.startsWith("/campaigns") || child.href === "/projects" || child.href === "/crm/outreach")) {
              return { ...child, href: "/projects/all" };
            }
            // Fix Overview link
            if (child.id === "sub_projects_overview" && (child.href?.startsWith("/campaigns") || child.href === "/crm/outreach")) {
              return { ...child, href: "/projects" };
            }
            // Fix other project links that might have leaked from old config
            if (child.id.startsWith("sub_projects_") && child.href?.startsWith("/campaigns")) {
              return { ...child, href: child.href.replace("/campaigns", "/projects") };
            }
            // Fix parent link if it appears in children list accidentally
            if (child.id === "nav_projects" && (child.href?.startsWith("/campaigns") || child.href === "/crm/outreach")) {
              return { ...child, href: "/projects" };
            }
            return child;
          })
      };
    }
    return item;
  });

  return <DynamicModuleMenu
    navStructure={activeNavStructure}
    modules={modules}
    dict={dict}
    features={features}
    isPartnerAdmin={isPartnerAdmin}
    teamRole={teamRole}
    serviceBadge={caseStats?.openCases || 0}
  />;
};
export default SideBar;
