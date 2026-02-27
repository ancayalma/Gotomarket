import { redirect } from "next/navigation";

export default function LeadPoolsPage() {
    // Redirect to leads for now
    return redirect("/crm/leads");
}
