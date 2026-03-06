import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BrandClient from "./components/brand-client";

export default async function BrandIdentityPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/sign-in");
    }

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id }
    });

    if (!user || (!user.is_admin && user.team_role !== "SUPER_ADMIN" && user.team_role !== "OWNER" && user.team_role !== "ADMIN")) {
        redirect("/crm/dashboard");
    }

    let initialData = null;
    if (user.team_id) {
        initialData = await prismadb.teamBrandIdentity.findUnique({
            where: { team_id: user.team_id }
        });
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full h-[calc(100vh-64px)] overflow-hidden">
            <BrandClient initialData={initialData} />
        </div>
    );
}
