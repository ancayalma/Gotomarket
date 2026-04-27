"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginComponent } from "./components/LoginComponent";
import ThirdwebLoginEmbed from "./components/ThirdwebLoginEmbed";

function SignInContent() {
  const searchParams = useSearchParams();
  const isLegacy = searchParams.get("legacy") === "true";

  if (isLegacy) {
    return <LoginComponent />;
  }

  return <ThirdwebLoginEmbed />;
}

export default function SignInClientPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-muted/10 rounded-lg" />}>
      <SignInContent />
    </Suspense>
  );
}
