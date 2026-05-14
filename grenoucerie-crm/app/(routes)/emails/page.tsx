import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { MailComponent } from "./components/mail";
import { accounts, mails } from "@/app/(routes)/emails/data";
import Container from "../components/ui/Container";
import SuspenseLoading from "@/components/loadings/suspense";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionaries";
import { redirect } from "next/navigation";

import { LearnLink } from "@/components/ui/LearnLink";

const EmailRoute = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }
  //Get user language
  const lang = session.user.userLanguage;

  //Fetch translations from dictionary
  const dict = await getDictionary(lang as "en" | "cz" | "de");

  const layout = (await cookies()).get("react-resizable-panels:layout");
  const collapsed = (await cookies()).get("react-resizable-panels:collapsed");
  //console.log(layout, collapsed, "layout, collapsed");

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  return (
    <Container
      title={dict.ModuleMenu.emails}
      description={
        "This module is in development. Now it is only frontend demo."
      }
    >
      <LearnLink
        tab="emails"
        overviewTitle="External Communications Hub"
        overviewWhat="The primary interface for managing cross-channel email correspondence with leads and clients."
        overviewWhy="Consolidating your business email within the CRM allows the AI to automatically parse sentiments and log interaction timelines without manual entry."
        overviewHow="Connect your SMTP or Resend credentials in settings. Once active, use this console to manage threads, apply labels, and archive resolved conversations."
      />
      <Suspense fallback={<SuspenseLoading />}>
        <MailComponent
          accounts={accounts}
          mails={mails}
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
        />
      </Suspense>
    </Container>
  );
};

export default EmailRoute;
