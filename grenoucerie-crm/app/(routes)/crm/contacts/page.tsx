import { Suspense } from "react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { LearnLink } from "@/components/ui/LearnLink";

import SuspenseLoading from "@/components/loadings/suspense";

import ContactsView from "../components/ContactsView";
import { getContacts } from "@/actions/crm/get-contacts";
import { getAllCrmData } from "@/actions/crm/get-crm-data";

const AccountsPage = async () => {
  const crmData = await getAllCrmData();
  const contacts = await getContacts();
  return (
    <div>
      <LearnLink
        tab="contacts"
        overviewTitle="Contacts Management"
        overviewWhat="The definitive master list of all individual people associated with your business ecosystem, regardless of which account they belong to."
        overviewWhy="Unlike Accounts (which track companies), the Contacts list allows you to filter and search for specific individuals, tracking their unique engagement and activity metrics."
        overviewHow="Use the filters to find contacts by job title, location, or tag, and click their name to access their specific activity timeline and related cases."
      />
      <div className="p-4 md:px-6 lg:px-8 pb-2">
        <Heading
          title="Contacts"
          description="Everything you need to know about your contacts"
        />
        <Separator className="mt-4" />
      </div>
      <div className="px-4 md:px-6 lg:px-8 pb-20 md:pb-4">
        <Suspense fallback={<SuspenseLoading />}>
          <ContactsView crmData={crmData} data={contacts} />
        </Suspense>
      </div>
    </div>
  );
};

export default AccountsPage;
