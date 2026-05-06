// Server imports removed for local unauthenticated access
import { JobsClient } from "./JobsClient";

export const metadata = {
    title: "Current Jobs | BasaltLens",
    description: "View background document extraction tasks",
};

export default async function JobsPage() {
    return <JobsClient />;
}
