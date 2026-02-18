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

interface ProfileTabsProps {
    data: Users;
}

export function ProfileTabs({ data }: ProfileTabsProps) {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") || "general";
    const [activeTab, setActiveTab] = useState(defaultTab);

    const getHeader = () => {
        if (activeTab === "signature") {
            return {
                title: "Email Signature",
                description: "Design and customize your professional email signature with live preview."
            };
        }
        return {
            title: "Profile",
            description: "Manage your account settings, personal information, and security."
        };
    };

    const { title, description } = getHeader();

    return (
        <Container title={title} description={description}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <TabsList className="bg-transparent p-0 w-full justify-start h-auto gap-8 border-b border-white/5 pb-0 mb-6 rounded-none">
                    <TabsTrigger
                        value="general"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-1 py-4 text-sm font-medium text-muted-foreground transition-all hover:text-primary"
                    >
                        General
                    </TabsTrigger>
                    <TabsTrigger
                        value="signature"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-1 py-4 text-sm font-medium text-muted-foreground transition-all hover:text-primary"
                    >
                        Signature
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
                        <SignatureBuilder hasAccess={true} />
                    </TabsContent>
                </div>
            </Tabs>
        </Container>
    );
}
