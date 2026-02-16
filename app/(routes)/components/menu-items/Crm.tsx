"use client";

import React from "react";
import { Users, Wand2, List, Megaphone, Settings, Target } from "lucide-react";
import { usePathname } from "next/navigation";
import ExpandableMenuItem, { SubMenuItemType } from "./ExpandableMenuItem";

type Props = {
  open: boolean;
  localizations: any;
  isMobile?: boolean;
};

const CrmModuleMenu = ({ open, localizations, isMobile = false }: Props) => {
  const pathname = usePathname();

  // Active if any of the sub-paths match
  const isPath =
    /^\/([a-z]{2}\/)?crm\/leads/.test(pathname) ||
    /^\/([a-z]{2}\/)?crm\/lead-wizard/.test(pathname) ||
    /^\/([a-z]{2}\/)?crm\/lead-pools/.test(pathname);

  // Sub-menu items matching screenshot
  const subItems: SubMenuItemType[] = [
    { label: "LeadGen Wizard", href: "/crm/lead-wizard", icon: Wand2 },
    { label: "Lists", href: "/crm/lead-pools", icon: List },
    { label: "Outreach", href: "/campaigns", icon: Megaphone },
    { label: "Settings", href: "/crm/leads?tab=settings", icon: Settings },
  ];

  return (
    <ExpandableMenuItem
      href="/crm/leads"
      icon={Users}
      title="Leads Manager"
      isOpen={open}
      isActive={isPath}
      items={subItems}
      isMobile={isMobile}
    />
  );
};

export default CrmModuleMenu;
