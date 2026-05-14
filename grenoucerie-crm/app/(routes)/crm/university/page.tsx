import UniversityDashboard from "./_components/UniversityDashboard";
import { getUser } from "@/actions/get-user";
import { evaluateMasteryProgress } from "@/actions/university/evaluate-progress";

export default async function UniversityPage() {
    const user = await getUser();
    const plan = user.assigned_team?.assigned_plan?.slug || user.assigned_team?.subscription_plan || "FREE";

    // Evaluate progression strictly on the server
    const verification = await evaluateMasteryProgress(user.id);
    const masteryLevel = verification?.level || user?.university_level || 1;
    const resolvedFlags = verification?.flags || {};

    return (
        <div className="h-full w-full p-6 overflow-y-auto">
            <UniversityDashboard plan={plan} userLevel={masteryLevel} user={user} dynamicFlags={resolvedFlags} />
        </div>
    );
}
