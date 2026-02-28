import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import Link from "next/link";
import { ArrowLeft, Github, Laptop, Code2, Database, Shield, Zap, Info, CheckCircle2, Terminal } from "lucide-react";

export const metadata = {
    title: "Contributing - BasaltCRM Developers",
    description: "Learn how to contribute to BasaltCRM. Guides on local setup, coding standards, and platform architecture.",
};

const cardClass = "p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-colors";
const codeBlockClass = "bg-[#0a0a0a] border border-white/10 rounded-xl p-5 font-mono text-sm overflow-x-auto text-gray-300 leading-relaxed";
const sectionTitle = "text-2xl font-semibold mt-14 mb-6 text-white flex items-center";

export default function ContributingPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>
            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="flex-grow pt-32 pb-20 px-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Back Link */}
                        <Link href="/developers" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors text-sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Developers
                        </Link>

                        {/* Hero */}
                        <div className="mb-16">
                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 mb-2">
                                Contributing
                            </h1>
                            <p className="text-lg text-gray-400 max-w-3xl">
                                Join the community of engineers building the world&apos;s most advanced AI-native CRM.
                                We welcome contributions to the core, documentation, and the agent ecosystem.
                            </p>
                        </div>

                        {/* Tech Stack Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                            {[
                                { icon: <Code2 className="w-5 h-5 text-cyan-400" />, name: "Next.js 16", version: "React 19" },
                                { icon: <Database className="w-5 h-5 text-emerald-400" />, name: "MongoDB", version: "Prisma v6" },
                                { icon: <Shield className="w-5 h-5 text-amber-400" />, name: "Tailwind", version: "shadcn/ui" },
                                { icon: <Zap className="w-5 h-5 text-purple-400" />, name: "Vercel AI", version: "Multi-Model" },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="mb-2">{item.icon}</div>
                                    <div className="text-sm font-bold">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.version}</div>
                                </div>
                            ))}
                        </div>

                        {/* Local Development */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-cyan-500 mr-3 rounded-full" />
                            Local Development
                        </h2>
                        <div className="space-y-6">
                            <p className="text-gray-400 leading-relaxed">
                                Getting BasaltCRM running on your local machine takes less than 5 minutes.
                                Ensure you have Node.js 20+ and a MongoDB instance (or Docker) ready.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">1</div>
                                        <span className="text-sm font-semibold text-white">Clone and Install</span>
                                    </div>
                                    <div className={codeBlockClass}>
                                        {`git clone https://github.com/BasaltHQ/crm-official.git
cd crm-official
npm install`}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">2</div>
                                        <span className="text-sm font-semibold text-white">Environment Setup</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">Copy the example file and add your MongoDB URI and NextAuth secret.</p>
                                    <div className={codeBlockClass}>
                                        {`cp .env.example .env
# Edit .env and set MONGODB_URI, NEXTAUTH_SECRET, etc.`}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">3</div>
                                        <span className="text-sm font-semibold text-white">Sync DB & Prime Content</span>
                                    </div>
                                    <div className={codeBlockClass}>
                                        {`npx prisma db push
npx prisma db seed
npm run dev`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Coding Standards */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-emerald-500 mr-3 rounded-full" />
                            Coding Standards
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6 mb-12">
                            <div className={cardClass}>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Functional first
                                </h3>
                                <p className="text-sm text-gray-500">We favor functional components and React Hooks. Use Server Components by default; only use &apos;use client&apos; when interactivity is required.</p>
                            </div>
                            <div className={cardClass}>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Type Safety
                                </h3>
                                <p className="text-sm text-gray-500">Strict TypeScript is mandatory. Avoid &apos;any&apos; at all costs. Every API route and server action must have typed requests and responses.</p>
                            </div>
                            <div className={cardClass}>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Atomic Design
                                </h3>
                                <p className="text-sm text-gray-500">Keep components small and focused. Shared UI elements live in /components/ui, while features live in their respective route folders.</p>
                            </div>
                            <div className={cardClass}>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI Optimization
                                </h3>
                                <p className="text-sm text-gray-500">Document your code thoroughly so AI assistants (like this one!) can understand intent and provide better pair-programming support.</p>
                            </div>
                        </div>

                        {/* Git Workflow */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-amber-500 mr-3 rounded-full" />
                            Git Workflow
                        </h2>
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-16">
                            <p className="text-gray-400 mb-6 font-medium">We follow the Feature Branch workflow:</p>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="shrink-0 pt-1 text-amber-400"><Terminal className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-white mb-1">Feature Branching</div>
                                        <p className="text-xs text-gray-500">Create a branch from main: <code className="text-amber-400">feature/xyz-feature-name</code></p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="shrink-0 pt-1 text-amber-400"><Terminal className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-white mb-1">Commit Message Format</div>
                                        <p className="text-xs text-gray-500">Use conventional commits: <code className="text-amber-400">feat: ...</code>, <code className="text-amber-400">fix: ...</code>, <code className="text-amber-400">docs: ...</code></p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="shrink-0 pt-1 text-amber-400"><Terminal className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-white mb-1">Pull Requests</div>
                                        <p className="text-xs text-gray-500">Submit a PR to main. Ensure all lint checks and tests pass before requesting a review.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Community */}
                        <div className="mt-16 p-8 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-center">
                            <Github className="w-8 h-8 text-white mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-3">Ready to contribute?</h3>
                            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                                Check out our open issues on GitHub or start a discussion in the Discord.
                                We&apos;re currently prioritizing AI Agent extensions and Data Enrichment providers.
                            </p>
                            <div className="flex gap-4 justify-center flex-wrap">
                                <a href="https://github.com/BasaltHQ/crm-official" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full transition-colors hover:bg-gray-200">
                                    Browse GitHub <Laptop className="ml-1 w-4 h-4" />
                                </a>
                                <a href="https://discord.gg/G9Sp8CAQmV" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-colors">
                                    Join Discord
                                </a>
                            </div>
                        </div>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
