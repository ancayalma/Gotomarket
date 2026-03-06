// @ts-nocheck
export const dynamic = "force-dynamic";
import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";

export const metadata = {
    title: "Training Data Transparency - BasaltHQ",
    description: "Overview of datasets used to train BasaltHQ AI models in compliance with California AB 2013.",
};

export default function TrainingDataPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">Training Data Transparency</h1>
                        <p className="text-gray-400 mb-12">Last updated: March 6, 2026</p>

                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-12">
                            <section>
                                <p className="lead text-xl text-gray-200">
                                    At BasaltHQ, we are committed to transparency and compliance in our AI development practices. In accordance with California AB 2013, this page outlines the high-level origins, nature, and licensing of the datasets used to train or fine-tune our models since January 1, 2022.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-6">Data Inventory & Origin Mapping</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-700 bg-gray-800/50">
                                                <th className="p-4 font-semibold text-gray-200">Dataset Category</th>
                                                <th className="p-4 font-semibold text-gray-200">Origin / Source</th>
                                                <th className="p-4 font-semibold text-gray-200">License Status</th>
                                                <th className="p-4 font-semibold text-gray-200">IP & Privacy Audit (CCPA)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                <td className="p-4">General Web Conversations (Anonymized)</td>
                                                <td className="p-4">Public Domain Crawls</td>
                                                <td className="p-4">Open Source / Public Iteration</td>
                                                <td className="p-4">Cleared. Pre-processed to remove PII.</td>
                                            </tr>
                                            <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                <td className="p-4">Proprietary Sales Interaction Data</td>
                                                <td className="p-4">Licensed Vendors</td>
                                                <td className="p-4">Commercial License</td>
                                                <td className="p-4">Cleared. Subject to vendor indemnification. No user PI included.</td>
                                            </tr>
                                            <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                <td className="p-4">Opt-In Customer Telemetry</td>
                                                <td className="p-4">BasaltHQ Internal Platform</td>
                                                <td className="p-4">First-Party (Terms of Service)</td>
                                                <td className="p-4">Ongoing. Users have the right to opt-out. Data is aggregated and anonymized.</td>
                                            </tr>
                                            <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                <td className="p-4">Synthetic Enterprise Scenarios</td>
                                                <td className="p-4">Internally Generated (Base Models)</td>
                                                <td className="p-4">Proprietary</td>
                                                <td className="p-4">Cleared. Wholly synthetic, no real-world IP or PII included.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">Privacy & Copyright Safeguards</h2>
                                <p>
                                    Our IP and Privacy Audit processes strictly flag any data ingestion that includes copyrighted works (without license) or Personal Information (PI) as defined by the California Consumer Privacy Act (CCPA).
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-4">
                                    <li><strong>Personal Information (PI):</strong> We employ automated scrubbing routines to remove names, contact information, and specific identifiers from any data used for fine-tuning. Opt-in customer data used for training is aggregated.</li>
                                    <li><strong>Copyrighted Works:</strong> We rely exclusively on licensed, proprietary, or public domain data specifically cleared for commercial AI training. We honor standard opt-out protocols (like robots.txt exclusions) in any public domain data curation.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">User Opt-Out</h2>
                                <p>
                                    BasaltHQ allows workspace administrators and individual users to opt-out of their tenant data being utilized for ongoing model fine-tuning. For more details on managing your data preferences, please refer to your Workspace Settings or our <a href="/privacy" className="text-cyan-500 hover:underline">Privacy Policy</a>.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
                                <p>
                                    For inquiries regarding our data transparency practices or AI compliance programs, please contact our privacy compliance team at <a href="mailto:privacy@basalthq.com" className="text-cyan-500 hover:underline">privacy@basalthq.com</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
