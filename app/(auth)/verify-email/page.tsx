import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata = {
    title: "Verify Your Email | BasaltCRM",
    description: "Verify your email address to continue using BasaltCRM.",
};

export default async function VerifyEmailPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return redirect("/sign-in");
    }

    // Check if already verified — redirect to dashboard
    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { email: true, sesEmailVerified: true, team_role: true, is_admin: true, assigned_role: { select: { name: true } } }
    });

    if (user?.sesEmailVerified) {
        return redirect("/");
    }

    const role = (user?.team_role || '').trim().toUpperCase();
    const pRole = (user?.assigned_role?.name || '').trim().toUpperCase();
    const isPlatformAdmin = user?.is_admin === true || ['PLATFORM_ADMIN', 'SYSADM', 'PLATFORM ADMIN'].includes(role) || pRole === 'SUPERADMIN';

    return <VerifyEmailClient userEmail={user?.email || session.user.email || ""} isPlatformAdmin={isPlatformAdmin} />;
}
