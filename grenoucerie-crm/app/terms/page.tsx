// @ts-nocheck
export const dynamic = "force-dynamic";
import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";

export const metadata = {
    title: "Terms of Service - BasaltCRM",
    description: "BasaltCRM Terms of Service.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">Terms of Service</h1>
                        <p className="text-gray-400 mb-12">Last updated: December 1, 2025</p>

                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-12">
                             <section>
                                <p className="text-zinc-200 leading-relaxed font-bold uppercase tracking-wide">
                                    Master Terms of Service Agreement
                                </p>
                                <p className="text-zinc-400 mt-2">
                                    Effective Date: April 1, 2026.
                                </p>
                                <p className="mt-4">
                                    This Master Terms of Service Agreement ("Agreement" or "Terms") constitutes a legally binding contract between you (referred to herein as "Customer", "Subscriber", "Licensee", or "Authorized User") and BasaltHQ Inc., a corporation organized and existing under the laws of the State of Delaware (referred to herein as "Company", "we", "us", "our", or "Licensor"). This Agreement meticulously governs your access to, integration with, and utilization of the BasaltCRM enterprise platform, interconnected artificial intelligence networks, proprietary data scraping utilities, and all associated communication infrastructure architectures (collectively, the "Service").
                                </p>
                                <p className="mt-4">
                                    BY EXECUTING AN ORDER FORM THAT REFERENCES THIS AGREEMENT, BY DEPRESSING THE "I AGREE", "AUTHORIZE", OR "ACCEPT" BUTTON ASSOCIATED WITH THIS AGREEMENT, OR BY ACCESSING OR CONTINUING TO UTILIZE THE SERVICE IN ANY CAPACITY, YOU EXPRESSLY SIGNIFY YOUR UNEQUIVOCAL, UNCONDITIONAL, AND ABSOLUTE CONSENT TO BE BOUND BY THESE TERMS. IF YOU ARE ENTERING INTO THIS AGREEMENT ON BEHALF OF A CORPORATE ENTITY, LIMITED LIABILITY COMPANY, PARTNERSHIP, OR OTHER LEGAL ORGANIZATION, YOU HEREBY REPRESENT, WARRANT, AND COVENANT THAT YOU POSSESS THE REQUISITE LEGAL AUTHORITY TO BIND SUCH ENTITY AND ITS AFFILIATES TO THESE TERMS. IF YOU LACK SUCH AUTHORITY, OR IF YOU DO NOT WHOLLY AGREE WITH EVERY PROVISION SET FORTH HEREIN, YOU MUST NOT ACCEPT THIS AGREEMENT AND MAY NOT ACCESS OR USE THE SERVICE.
                                </p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">1. Definitions</h3>
                                <p><strong>1.1. "Affiliate"</strong> means any entity that directly or indirectly controls, is controlled by, or is under common control with the subject entity.</p>
                                <p><strong>1.2. "Authorized User"</strong> means an individual who is explicitly authorized by the Customer to use a Service, for whom Customer has purchased a subscription (or in the case of any Services provided by Us without charge, for whom a Service has been provisioned), and to whom Customer (or, when applicable, Us at Customer's request) has supplied a user identification and password.</p>
                                <p><strong>1.3. "Customer Data"</strong> means electronic data and information submitted by or for Customer to the Services, excluding content from third-party applications.</p>
                                <p><strong>1.4. "Malicious Code"</strong> means code, files, scripts, agents, or programs intended to do harm, including, for example, viruses, worms, time bombs, and Trojan horses.</p>
                                <p><strong>1.5. "Order Form"</strong> means an ordering document or online order specifying the Services to be provided hereunder that is entered into between Customer and Us.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">2. Grant of License and Scope of Use</h3>
                                <p><strong>2.1. Provision of Services.</strong> We will (a) make the Services and Content available to Customer pursuant to this Agreement, and the applicable Order Forms and Documentation, (b) provide applicable standard support for the Services to Customer at no additional charge, and (c) use commercially reasonable efforts to make the online Services available 24 hours a day, 7 days a week, except for: (i) planned downtime (of which We shall give advance electronic notice), and (ii) any unavailability caused by circumstances beyond Our reasonable control.</p>
                                <p><strong>2.2. Non-Exclusive License.</strong> Subject to Customer's strict adherence to this Agreement and timely remittance of all due pecuniary obligations, BasaltHQ grants Customer a localized, non-exclusive, non-transferable, non-sublicensable, and completely revocable right to access and leverage the Service strictly for Customer's internal business operations.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">3. Restrictions on Use</h3>
                                <p><strong>3.1. Prohibited Actions.</strong> Customer shall not entirely, nor permit any third party under its direction or control to: (a) permit any third party to access the Services except as permitted herein; (b) create derivate works based on the Services; (c) copy, frame, or mirror any part or content of the Services; (d) reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code, object code, or underlying structure, ideas, or algorithms of the Services; (e) access the Services in order to build a competitive product or service; or (f) utilize the Services to traffic maliciously, including but not limited to the distribution of malware, facilitation of phishing operations, or unregulated predatory data harvesting.</p>
                                <p><strong>3.2. Rate Limiting.</strong> Interfacing with our API endpoints is subject to hard programmatic rate limits designed to insulate the architectural integrity of our shared ecosystem. Customers engaging in "DDoS-style" requests or circumventing standard pagination limits will face immediate API key nullification without preliminary warning.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">4. Customer Responsibilities</h3>
                                <p><strong>4.1. Account Sovereignty.</strong> Customer is solely accountable for the fidelity, quality, legality, and operational implications of Customer Data, the means by which Customer acquired Customer Data, and Customer's utilization of Customer Data with the Services. Customer will apply commercially reasonable methodologies to thwart unauthorized access to or use of Services and Content.</p>
                                <p><strong>4.2. Regulatory Strictures.</strong> The Customer assumes an absolute, non-delegable duty to ensure all communication dispatches (e.g., SMTP polling, SMS routing, Voice synthesis) initiated via BasaltCRM adhere strictly to prevailing multi-jurisdictional frameworks, encompassing, but not relegated to, the Telephone Consumer Protection Act (TCPA), the CAN-SPAM Act, the Telemarketing Sales Rule (TSR), and the General Data Protection Regulation (GDPR).</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">5. Fees and Payment for Purchased Services</h3>
                                <p><strong>5.1. Fees.</strong> Customer will pay all fees specified in Order Forms. Except as otherwise specified herein or in an Order Form, (i) fees are based on Services and Content subscriptions purchased and not actual usage, (ii) payment obligations are non-cancelable and fees paid are non-refundable, and (iii) quantities purchased cannot be decreased during the relevant subscription term.</p>
                                <p><strong>5.2. Invoicing and Payment.</strong> Customer will provide Us with valid and updated credit card information, or with a valid purchase order or alternative document reasonably acceptable to Us. If Customer provides credit card information, Customer authorizes Us to charge such credit card for all Purchased Services. Charges shall be made in advance, either annually or in accordance with any different billing frequency stated.</p>
                                <p><strong>5.3. Overdue Charges & Chargebacks.</strong> If any invoiced amount is not received by Us by the due date, then without limiting Our rights or remedies, those charges may accrue late interest at the rate of 1.5% of the outstanding balance per month, or the maximum rate permitted by law, whichever is lower. The initiation of an uncoordinated bank chargeback against properly rendered services will constitute an immediate, material breach resulting in terminal systemic suspension.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">6. Proprietary Rights and Licenses</h3>
                                <p><strong>6.1. Reservation of Rights.</strong> Subject to the limited rights expressly granted hereunder, We reserve all of Our right, title and interest in and to the Services and Content, including all of Our related intellectual property rights. No rights are granted to Customer hereunder other than as expressly set forth herein.</p>
                                <p><strong>6.2. License by Customer.</strong> Customer grants Us, Our Affiliates, and applicable contractors a worldwide, limited-term license to host, copy, transmit and display Customer Data as necessary for Us to provide the Services in accordance with this Agreement. Subject to the limited licenses granted herein, We acquire no right, title or interest from Customer under this Agreement in or to any Customer Data.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">7. Confidentiality</h3>
                                <p><strong>7.1. Definition of Confidential Information.</strong> "Confidential Information" means all information disclosed by a party ("Disclosing Party") to the other party ("Receiving Party"), whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.</p>
                                <p><strong>7.2. Protection of Confidential Information.</strong> The Receiving Party will use the same degree of care that it uses to protect the confidentiality of its own confidential information of like kind (but not less than reasonable care) to (i) not use any Confidential Information of the Disclosing Party for any purpose outside the scope of this Agreement and (ii) except as otherwise authorized by the Disclosing Party in writing, limit access to Confidential Information.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">8. Representations, Warranties, Exclusive Remedies and Disclaimers</h3>
                                <p><strong>8.1. Mutual Representations.</strong> Each party represents that it has validly entered into this Agreement and has the legal power to do so.</p>
                                <p><strong>8.2. Disclaimers.</strong> EXCEPT AS EXPRESSLY PROVIDED HEREIN, NEITHER PARTY MAKES ANY WARRANTY OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, AND EACH PARTY SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW. CONTENT AND BETA SERVICES ARE PROVIDED "AS IS," EXCLUSIVE OF ANY WARRANTY WHATSOEVER.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">9. Mutual Indemnification</h3>
                                <p><strong>9.1. Indemnification by Us.</strong> We will defend Customer against any claim, demand, suit or proceeding made or brought against Customer by a third party alleging that any Service infringes or misappropriates such third party's intellectual property rights, and will indemnify Customer from any damages, attorney fees and costs finally awarded against Customer.</p>
                                <p><strong>9.2. Indemnification by Customer.</strong> Customer will defend Us against any claim, demand, suit or proceeding made or brought against Us by a third party alleging that any Customer Data or Customer's use of Customer Data with the Services, or Customer's use of the Services in breach of this Agreement, infringes or misappropriates such third party's intellectual property rights or violates applicable law (including but not limited to TCPA, CAN-SPAM, GDPR).</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">10. Limitation of Liability</h3>
                                <p><strong>10.1. Limitation of Liability.</strong> IN NO EVENT SHALL THE MAXIMUM AGGREGATE LIABILITY OF EITHER PARTY TOGETHER WITH ALL OF ITS AFFILIATES ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE TOTAL AMOUNT PAID BY CUSTOMER AND ITS AFFILIATES HEREUNDER FOR THE SERVICES GIVING RISE TO THE LIABILITY IN THE TWELVE MONTHS PRECEDING THE FIRST INCIDENT OUT OF WHICH THE LIABILITY AROSE.</p>
                                <p><strong>10.2. Exclusion of Consequential Damages.</strong> IN NO EVENT WILL EITHER PARTY OR ITS AFFILIATES HAVE ANY LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT FOR ANY LOST PROFITS, REVENUES, GOODWILL, OR INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, COVER, BUSINESS INTERRUPTION OR PUNITIVE DAMAGES, WHETHER AN ACTION IS IN CONTRACT OR TORT.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">11. Term and Termination</h3>
                                <p><strong>11.1. Term of Agreement.</strong> This Agreement commences on the date Customer first accepts it and continues until all subscriptions hereunder have expired or have been terminated.</p>
                                <p><strong>11.2. Termination.</strong> A party may terminate this Agreement for cause (i) upon 30 days written notice to the other party of a material breach if such breach remains uncured at the expiration of such period, or (ii) if the other party becomes the subject of a petition in bankruptcy or any other proceeding relating to insolvency.</p>
                             </section>

                             <section className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-l-2 border-primary pl-3">12. General Provisions</h3>
                                <p><strong>12.1. Export Compliance.</strong> The Services, Content, other technology We make available, and derivatives thereof may be subject to export laws and regulations of the United States and other jurisdictions. Each party represents that it is not named on any U.S. government denied-party list.</p>
                                <p><strong>12.2. Entire Agreement and Order of Precedence.</strong> This Agreement is the entire agreement between Customer and Us regarding Customer's use of Services and Content and supersedes all prior and contemporaneous agreements, proposals or representations, written or oral, concerning its subject matter.</p>
                                <p><strong>12.3. Governing Law and Jurisdiction.</strong> This Agreement, and any disputes arising out of or related hereto, shall be governed exclusively by the internal laws of the State of Delaware, without regard to its conflicts of laws rules or the United Nations Convention on the International Sale of Goods.</p>
                             </section>

                             <section>
                                 <h2 className="text-2xl font-bold text-white mb-4">13. Contact Legal Operations</h2>
                                 <p>
                                     If you require specific redline variations of these Terms, please contact our Legal Operations team directly at <a href="mailto:legal@basalthq.com" className="text-primary hover:underline">legal@basalthq.com</a>.
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
