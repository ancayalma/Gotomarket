"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./ProfileForm";
import { ProfilePhotoForm } from "./ProfilePhotoForm";
import { PasswordChangeForm } from "./PasswordChange";

import { OpenAiForm } from "./OpenAiForm";
import SignatureBuilder from "@/components/SignatureBuilder";
import { Users } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import Container from "../../components/ui/Container";

import CalendarIntegrationPanel from "../../crm/leads/components/CalendarIntegrationPanel";
import CalendarAvailabilityPanel from "../../crm/leads/components/CalendarAvailabilityPanel";
import CalendarEventsPanel from "../../crm/leads/components/CalendarEventsPanel";
import SignaturesResourcesPanel from "../../crm/leads/components/SignaturesResourcesPanel";
import PortalSettingsPanel from "../../crm/leads/components/PortalSettingsPanel";
import DashboardCard from "../../crm/dashboard/_components/DashboardCard";
import { User, PenTool, Link, Clock, Calendar, MessageSquare, Shield } from "lucide-react";

import { checkTeamFeature } from "@/lib/subscription";

interface ProfileTabsProps {
    data: Users & {
        assigned_team: any;
    };
}

export function ProfileTabs({ data }: ProfileTabsProps) {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") || "general";
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Feature flagging
    const hasSignatureAccess = data.assigned_team ? checkTeamFeature(data.assigned_team, "personalized_signature") : false;

    const getHeader = () => {
        switch (activeTab) {
            case "signature":
                return {
                    title: "Email Signature",
                    description: "Design and customize your professional email signature with live preview."
                };
            case "integration":
                return {
                    title: "Integrations",
                    description: "Connect your calendar and external services."
                };
            case "availability":
                return {
                    title: "Availability",
                    description: "Set your working hours and meeting availability."
                };
            case "events":
                return {
                    title: "Event Types",
                    description: "Manage your meeting types and scheduling links."
                };
            case "signatures":
                return {
                    title: "Resources & Prompts",
                    description: "Manage your outreach buttons and AI prompts."
                };
            case "portal":
                return {
                    title: "SMS Portal Settings",
                    description: "Configure your client facing messaging portal."
                };
            default:
                return {
                    title: "Profile & Account",
                    description: "Manage your personal information, security, and integrations."
                };
        }
    };

    const { title, description } = getHeader();

    return (
        <Container title={title} description={description}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8 h-auto bg-transparent p-0">
                    <TabsTrigger value="general" asChild>
                        <DashboardCard
                            icon={User}
                            label="Profile"
                            description="Personal info"
                            variant="default"
                            hideIcon={true}
                            className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary/50"
                        />
                    </TabsTrigger>
                    <TabsTrigger value="signature" asChild>
                        <DashboardCard
                            icon={PenTool}
                            label="Signature"
                            description={hasSignatureAccess ? "Email identity" : "Premium Feature"}
                            variant="default"
                            hideIcon={true}
                            className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary/50"
                            isLocked={!hasSignatureAccess}
                        />
                    </TabsTrigger>
                    <TabsTrigger value="integration" asChild>
                        <DashboardCard
                            icon={Link}
                            label="Integrations"
                            description="Connect apps"
                            variant="info"
                            hideIcon={true}
                            className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary/50"
                        />
                    </TabsTrigger>
                    <TabsTrigger value="availability" asChild>
                        <DashboardCard
                            icon={Clock}
                            label="Availability"
                            description="Work hours"
                            variant="success"
                            hideIcon={true}
                            className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary/50"
                        />
                    </TabsTrigger>
                    <TabsTrigger value="events" asChild>
                        <DashboardCard
                            icon={Calendar}
                            label="Events"
                            description="Meeting types"
                            variant="violet"
                            hideIcon={true}
                            className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary/50"
                        />
                    </TabsTrigger>
                    <TabsTrigger value="signatures" asChild>
                        <DashboardCard
                            icon={Shield}
                            label="Resources"
                            description="Buttons & Prompts"
                            variant="warning"
                            hideIcon={true}
                            className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary/50"
                        />
                    </TabsTrigger>
                    <TabsTrigger value="portal" asChild>
                        <DashboardCard
                            icon={MessageSquare}
                            label="SMS Portal"
                            description="Messaging"
                            variant="violet"
                            hideIcon={true}
                            className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary/50"
                        />
                    </TabsTrigger>
                </TabsList>

                <div className="p-1">
                    <TabsContent value="general" className="space-y-8 mt-0">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-medium">Profile Picture</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Update your profile photo to be displayed across the platform.
                                </p>
                                <ProfilePhotoForm data={data} />
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-medium">Personal Information</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Manage your personal details and contact header.
                                </p>
                                <ProfileForm data={data} />
                            </div>
                            <Separator />
                            <div id="security">
                                <h3 className="text-lg font-medium">Security</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Manage your password and account security settings.
                                </p>
                                <PasswordChangeForm userId={data.id} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="signature" className="mt-0">
                        <SignatureBuilder hasAccess={hasSignatureAccess} />
                    </TabsContent>

                    <TabsContent value="integration" className="mt-0">
                        <CalendarIntegrationPanel />
                    </TabsContent>

                    <TabsContent value="availability" className="mt-0">
                        <CalendarAvailabilityPanel />
                    </TabsContent>

                    <TabsContent value="events" className="mt-0">
                        <CalendarEventsPanel />
                    </TabsContent>

                    <TabsContent value="signatures" className="mt-0">
                        <SignaturesResourcesPanel />
                    </TabsContent>

                    <TabsContent value="portal" className="mt-0">
                        <PortalSettingsPanel />
                    </TabsContent>
                </div>
            </Tabs>
        </Container>
    );
}
