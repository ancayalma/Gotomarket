import { redirect } from "next/navigation";

export default function LeadWizardPage() {
    // Redirect to accounts wizard
    return redirect("/crm/accounts?tab=wizard");
}
