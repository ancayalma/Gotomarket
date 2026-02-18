import { getUser } from "@/actions/get-user";
import { ProfileTabs } from "./components/ProfileTabs";

const ProfilePage = async () => {
  const data = await getUser();

  if (!data) {
    return <div>No user data.</div>;
  }

  return <ProfileTabs data={data} />;
};

export default ProfilePage;
