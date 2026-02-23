import { getUser } from "@/actions/get-user";
import { ProfileTabs } from "./components/ProfileTabs";
import { LearnLink } from "@/components/ui/LearnLink";

const ProfilePage = async () => {
  const data = await getUser();

  if (!data) {
    return <div>No user data.</div>;
  }

  return (
    <>
      <LearnLink
        tab="profile"
        overviewTitle="User Management & Preferences"
        overviewWhat="The personal command center for your CRM identity, where you manage authentication, regional preferences, and security credentials."
        overviewWhy="Your profile determines how the system interacts with you—from the language of the UI to the specific email signatures used in your outreach campaigns."
        overviewHow="Update your contact details, set your preferred timezone to ensure calendar sync accuracy, and manage your linked integration accounts for external services."
      />
      <ProfileTabs data={data} />
    </>
  );
};

export default ProfilePage;
