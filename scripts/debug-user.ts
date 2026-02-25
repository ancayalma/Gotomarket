import { prismadb } from "../lib/prisma";

async function checkUser(email: string) {
    const user = await (prismadb.users as any).findUnique({
        where: { email },
        select: {
            id: true,
            team_id: true,
            team_role: true,
            is_admin: true
        }
    });
    console.log("User Context:", JSON.stringify(user, null, 2));

    if (user?.team_id) {
        const team = await prismadb.team.findUnique({
            where: { id: user.team_id }
        });
        console.log("Team Context:", JSON.stringify(team, null, 2));
    }
}

// I need the user's email. I'll search for "SysAdm" or get all users.
async function findSysAdm() {
    const users = await (prismadb.users as any).findMany({
        where: { name: { contains: "SysAdm", mode: 'insensitive' } }
    });
    for (const u of users) {
        await checkUser(u.email);
    }
}

findSysAdm().catch(console.error);
