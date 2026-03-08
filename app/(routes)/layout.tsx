import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import Header from "./components/Header";
import SideBar from "./components/SideBar";
import Footer from "./components/Footer";
import { Metadata } from "next";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";
import ForcePasswordChangeCheck from "@/components/auth/ForcePasswordChangeCheck";
import TermsConsentCheck from "@/components/auth/TermsConsentCheck";
import IdleSessionTimeout from "@/components/auth/IdleSessionTimeout";
import ThemeGuard from "@/components/ThemeGuard";
import UtilityBar from "@/components/UtilityBar";
import { prismadb } from "@/lib/prisma";
import { BrandSetupInterceptor } from "@/components/modals/BrandSetupInterceptor";


function getSafeMetadataBase(): URL {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const PRODUCTION_FALLBACK = "https://crm.basalthq.com";

  if (!envUrl || envUrl.trim() === "") {
    return new URL(PRODUCTION_FALLBACK);
  }

  const trimmed = envUrl.trim();

  // Skip localhost URLs in production
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return new URL(PRODUCTION_FALLBACK);
  }

  // Ensure URL has protocol
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return new URL(`https://${trimmed}`);
  }

  return new URL(trimmed);
}

export const metadata: Metadata = {
  metadataBase: getSafeMetadataBase(),
  title: "BasaltCRM Dashboard",
  description: "Manage your sales and support with AI.",
  openGraph: {
    images: [
      {
        url: "/api/og?title=Dashboard&description=Manage%20your%20business",
        width: 1200,
        height: 630,
        alt: "BasaltCRM Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/api/og?title=Dashboard&description=Manage%20your%20business",
        width: 1200,
        height: 630,
        alt: "BasaltCRM Dashboard",
      },
    ],
  },
};
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  //console.log(session, "session");

  if (!session) {
    return redirect("/sign-in");
  }

  const user = session?.user;

  if (user?.userStatus === "PENDING") {
    return redirect("/pending");
  }

  if (user?.userStatus === "INACTIVE") {
    return redirect("/inactive");
  }

  let needsBrandSetup = false;
  let userTeamId = "";
  
  if (session?.user?.id) {
      const fullUser = await prismadb.users.findUnique({
          where: { id: session.user.id },
          select: { team_id: true, team_role: true, is_admin: true, assigned_role: { select: { name: true } } }
      });
      if (fullUser?.team_id) {
          userTeamId = fullUser.team_id;
          const role = (fullUser.team_role || '').trim().toUpperCase();
          const pRole = (fullUser.assigned_role?.name || '').trim().toUpperCase();
          const isSuperAdmin = fullUser.is_admin === true || ['SUPER_ADMIN', 'OWNER', 'PLATFORM_ADMIN', 'SYSADM', 'PLATFORM ADMIN', 'ADMIN'].includes(role) || pRole === 'SUPERADMIN';
          if (isSuperAdmin) {
              const brandIdentity = await prismadb.teamBrandIdentity.findUnique({
                  where: { team_id: userTeamId }
              });
              if (!brandIdentity || !brandIdentity.setup_completed) {
                  needsBrandSetup = true;
              }
          }
      }
  }

  if (user?.userStatus === "INACTIVE") {
    return redirect("/inactive");
  }

  return (
    <ThemeGuard>
      <BrandSetupInterceptor isOpen={needsBrandSetup} teamId={userTeamId} />
      <IdleSessionTimeout />
      <TermsConsentCheck />
      <ForcePasswordChangeCheck />
      <div className="fixed inset-0 flex h-[100dvh] overflow-hidden">
        <SideBar />
        <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">
          <Header
            id={session.user.id as string}
            name={session.user.name as string}
            email={session.user.email as string}
            avatar={session.user.image as string}
            lang={session.user.userLanguage as string}
          />
          <SmartBreadcrumb className="shrink-0" />
          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
          <div className="shrink-0">
            <UtilityBar />
            <Footer />
          </div>
        </div>
      </div>
    </ThemeGuard>
  );
}
