import { redirect } from "next/navigation";

export default function OutreachPage() {
    // Redirect to campaigns for now as Outreach is being integrated
    return redirect("/campaigns");
}
