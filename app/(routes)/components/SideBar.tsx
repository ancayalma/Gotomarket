import { getNavigationConfig } from "@/actions/navigation/get-navigation-config";
import { DEFAULT_NAV_STRUCTURE, NavItem } from "@/lib/navigation-defaults";
import DynamicModuleMenu from "./dynamic-navigation/DynamicModuleMenu";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModules } from "@/actions/get-modules";
import { prismadb } from "@/lib/prisma";
import { getCaseStats } from "@/actions/crm/cases/get-case-stats";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUserTeamId } from "@/lib/team-utils";

const SideBar = async () => {
  const currentUserInfo = await getCurrentUserTeamId();
  if (!currentUserInfo) return null;

  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [modules, user, caseStats, dbNavConfig] = await Promise.all([
    getModules(),
    (prismadb.users as any).findUnique({
      where: { id: currentUserInfo.userId },
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
  const planSlug = team?.assigned_plan?.slug || team?.subscription_plan || "FREE";
  let features: string[] = [];

  if (team?.assigned_plan) {
    features = team.assigned_plan.features;
  } else {
    // Fallback import
    const { getSubscriptionPlan } = await import("@/lib/subscription");
    const slug = team?.subscription_plan || "FREE";
    features = getSubscriptionPlan(slug).features;
  }

  // Add overrides to features list
  if (team?.module_overrides) {
    features = Array.from(new Set([...features, ...team.module_overrides]));
  }

  const teamRole = currentUserInfo.teamRole || "MEMBER";
  const isPartnerAdmin = currentUserInfo.isPlatformAdmin || (user as any).assigned_team?.slug === "basalt" || (user as any).assigned_team?.slug === "basalthq";

  // Resolve Navigation Structure (Now synced via DB Migration)
  const config = dbNavConfig as any;
  const rawStructure = config?.structure || DEFAULT_NAV_STRUCTURE;

  // Utility to ensure unique IDs across the entire structure
  const deduplicateStructure = (items: NavItem[]): NavItem[] => {
    const seen = new Set<string>();
    const process = (list: NavItem[]): NavItem[] => {
      const result: NavItem[] = [];
      list.forEach(item => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          const processedItem = { ...item };
          if (item.children) {
            processedItem.children = process(item.children);
          }
          result.push(processedItem);
        }
      });
      return result;
    };
    return process(items);
  };

  // Migrate any DB-stored /partners hrefs to /platform
  const migratePartnersToPlatform = (items: NavItem[]): NavItem[] => {
    return items.map(item => {
      const migrated = { ...item };
      if (migrated.href?.startsWith('/partners')) {
        migrated.href = migrated.href.replace('/partners', '/platform');
      }
      if (migrated.label === 'Team Management') {
        migrated.label = 'Company Management';
      }
      if (migrated.label === 'Deals') {
        migrated.label = 'Opportunities';
      }
      if (migrated.children) {
        migrated.children = migratePartnersToPlatform(migrated.children);
      }
      return migrated;
    });
  };

  const activeNavStructure = deduplicateStructure(migratePartnersToPlatform(rawStructure));

  const ensurePlatformMenu = (items: NavItem[]) => {
    if (!isPartnerAdmin) return;
    const systemGroup = items.find(i => i.id === "group_system");
    if (systemGroup && systemGroup.children) {
      const hasPlatform = systemGroup.children.some((i: any) => i.id === "nav_platform");
      if (!hasPlatform) {
        systemGroup.children.push({
          id: "nav_platform",
          type: "item",
          label: "Platform",
          iconName: "Globe",
          href: "/platform",
          permissions: { minRole: "PLATFORM_ADMIN" },
          children: [
            { id: "sub_platform_team", type: "item", label: "Company Management", href: "/platform" },
            { id: "sub_platform_keys", type: "item", label: "System Keys", href: "/platform/ai-system-config" },
            { id: "sub_platform_pricing", type: "item", label: "Model Pricing", href: "/platform/ai-pricing" },
            { id: "sub_platform_email", type: "item", label: "System Email", href: "/platform/email-system-config" },
            { id: "sub_platform_plans", type: "item", label: "Manage Plans", href: "/platform/plans" }
          ]
        });
      }
    }
  };
  ensurePlatformMenu(activeNavStructure);

  const styleTag = `
    :root {
      --nav-title-font: ${config?.titleFont ? `'${config?.titleFont}', sans-serif` : 'inherit'};
      --nav-title-size: ${config?.titleFontSize || '10px'};
      --nav-title-weight: ${config?.titleFontWeight || '900'};
      --nav-title-style: ${config?.titleFontStyle || 'normal'};
      --nav-item-font: ${config?.itemFont ? `'${config?.itemFont}', sans-serif` : 'inherit'};
      --nav-item-size: ${config?.itemFontSize || '18px'};
      --nav-item-weight: ${config?.itemFontWeight || '900'};
      --nav-item-style: ${config?.itemFontStyle || 'normal'};
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleTag }} />
      <DynamicModuleMenu
        navStructure={activeNavStructure}
        titleFont={config?.titleFont}
        titleFontSize={config?.titleFontSize}
        titleFontWeight={config?.titleFontWeight}
        titleFontStyle={config?.titleFontStyle}
        itemFont={config?.itemFont}
        itemFontSize={config?.itemFontSize}
        itemFontWeight={config?.itemFontWeight}
        itemFontStyle={config?.itemFontStyle}
        modules={modules}
        dict={dict}
        features={features}
        isPartnerAdmin={isPartnerAdmin}
        teamRole={teamRole}
        serviceBadge={caseStats?.openCases || 0}
        isImpersonating={currentUserInfo.isImpersonating}
        impersonatedTeamName={team?.name}
        planSlug={planSlug}
      />
    </>
  );
};
export default SideBar;
