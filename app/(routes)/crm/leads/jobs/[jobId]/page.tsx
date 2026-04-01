import { redirect } from "next/navigation";

// Redirect old /crm/leads/jobs/[jobId] to /lists/jobs/[jobId]
export default async function LegacyJobRedirect({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  redirect(`/lists/jobs/${jobId}`);
}
