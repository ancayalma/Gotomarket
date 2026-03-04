import UniversityDashboard from "./_components/UniversityDashboard";
import { getUser } from "@/actions/get-user";

export default async function UniversityPage() {
    const user = await getUser();
    const plan = user.assigned_team?.assigned_plan?.slug || user.assigned_team?.subscription_plan || "FREE";

    // Use the actual tracked gamification level for the user
    // Defaults to 1 for new users
    const masteryLevel = user?.university_level || 1;

    return (
        <div className="h-full w-full p-6 overflow-y-auto">
            <UniversityDashboard plan={plan} userLevel={masteryLevel} user={user} />
        </div>
    );
}
