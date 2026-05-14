import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import FreemailNoticeClient from "./FreemailNoticeClient";

export const metadata = {
    title: "Personal Email Notice | BasaltCRM",
    description: "Important information about using a personal email address with BasaltCRM.",
};

export default async function FreemailNoticePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return redirect("/sign-in");
    }

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { email: true, isFreemailAccount: true, freemailWarningAcknowledged: true }
    });

    // Already acknowledged or not a freemail user — go to dashboard
    if (!user || !user.isFreemailAccount || user.freemailWarningAcknowledged) {
        return redirect("/");
    }

    return <FreemailNoticeClient userEmail={user.email} />;
}
