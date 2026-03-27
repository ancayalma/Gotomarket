import { prismadb } from "@/lib/prisma";
import Chat from "./components/Chat";

import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Container from "../components/ui/Container";
import { UpgradeGate } from "@/components/UpgradeGate";

const ProfilePage = async () => {
  const user = await getServerSession(authOptions);

  const openAiKeyUser = await prismadb.openAi_keys.findFirst({
    where: {
      user: user?.user?.id,
    },
  });

  const openAiKeySystem = await prismadb.systemServices.findFirst({
    where: {
      name: "openAiKey",
    },
  });

  const hasAzureConfigured =
    !!process.env.AZURE_OPENAI_ENDPOINT &&
    !!process.env.AZURE_OPENAI_API_KEY &&
    !!process.env.AZURE_OPENAI_API_VERSION &&
    !!process.env.AZURE_OPENAI_DEPLOYMENT;

  const hasOpenAiKey =
    !!openAiKeyUser ||
    !!openAiKeySystem ||
    !!process.env.OPENAI_API_KEY ||
    !!process.env.OPEN_AI_API_KEY;

  if (!hasAzureConfigured && !hasOpenAiKey)
    return (
      <UpgradeGate featureId="ai_lab" title="Varuni AI Locked" description="The Varuni AI assistant requires a Growth plan or higher.">
        <Container
          title="Chat with Varuni"
          description={"Ask anything you need to know"}
        >
          <div>
            <h1>AI configuration not found</h1>
            <p>
              Please configure Azure OpenAI in your environment or add your OpenAI API key in your{" "}
              <Link href={"/profile"} className="text-primary">
                profile settings page{" "}
              </Link>
              to use the assistant.
            </p>
          </div>
        </Container>
      </UpgradeGate>
    );

  return (
    <UpgradeGate featureId="ai_lab" title="Varuni AI Locked" description="The Varuni AI assistant requires a Growth plan or higher.">
      <div className="flex-1 h-full md:border-l border-border bg-background">
        <Suspense fallback={<div>Loading...</div>}>
          <Chat />
        </Suspense>
      </div>
    </UpgradeGate>
  );
};

export default ProfilePage;
