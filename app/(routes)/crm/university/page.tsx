import UniversityDashboard from "./_components/UniversityDashboard";
import { getUser } from "@/actions/get-user";

export default async function UniversityPage() {
    const user = await getUser();
    const plan = user.assigned_team?.assigned_plan?.slug || user.assigned_team?.subscription_plan || "FREE";

    return (
        <div className="h-full w-full p-6 overflow-y-auto">
            <UniversityDashboard plan={plan} />
        </div>
    );
}
