import Chat from "./components/Chat";
import { Suspense } from "react";
import { UpgradeGate } from "@/components/UpgradeGate";

const ProfilePage = async () => {

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
