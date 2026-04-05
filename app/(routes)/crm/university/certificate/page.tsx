import { getUser } from "@/actions/get-user";
import { notFound } from "next/navigation";
import crypto from "crypto";
import CertificateClient from "./_components/CertificateClient";

const PHASES = [
    { title: "The Foundation", level_req: 5, color: "from-blue-400 to-blue-600", border: "border-blue-500/30" },
    { title: "Data Pioneer", level_req: 10, color: "from-cyan-400 to-cyan-600", border: "border-cyan-500/30" },
    { title: "Outreach Architect", level_req: 15, color: "from-emerald-400 to-emerald-600", border: "border-emerald-500/30" },
    { title: "Automation Specialist", level_req: 20, color: "from-violet-400 to-violet-600", border: "border-violet-500/30" },
    { title: "Strategic Master", level_req: 25, color: "from-amber-400 to-amber-600", border: "border-amber-500/30" },
];

export default async function CertificatePage({ searchParams }: { searchParams: { phase?: string } }) {
    const user = await getUser();
    if (!user) return notFound();

    const userLevel = user.university_level || 1;

    let targetPhaseObj = null;
    
    // Reverse find the highest phase they qualify for if no phase param passes,
    // OR find the exact phase requested if they qualify
    const reversedPhases = [...PHASES].reverse();

    if (searchParams.phase) {
         targetPhaseObj = PHASES.find(p => p.title.toLowerCase().replace(" ", "-") === searchParams.phase);
         // Double check if they actually reached it
         if (targetPhaseObj && userLevel < targetPhaseObj.level_req) {
             targetPhaseObj = null; // not qualified
         }
    }

    if (!targetPhaseObj) {
         targetPhaseObj = reversedPhases.find(p => userLevel >= p.level_req);
    }

    if (!targetPhaseObj) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-black italic">Unauthorized</h1>
                    <p className="text-gray-400 border border-white/10 px-6 py-4 rounded-xl bg-white/5">
                        You have not completed any Mastery Phases yet. Head back to the University and complete Chapter 1!
                    </p>
                </div>
            </div>
        );
    }

    // Fake issue date based on when they hit the level, or just current date if schema doesn't have it
    const issueDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const certHash = crypto.createHash("sha256").update(user.id + targetPhaseObj.title).digest("hex").substring(0, 12).toUpperCase();

    return (
        <CertificateClient 
            user={user} 
            phaseTitle={targetPhaseObj.title} 
            colorClass={targetPhaseObj.color} 
            borderClass={targetPhaseObj.border}
            issueDate={issueDate}
            certHash={certHash}
        />
    );
}
