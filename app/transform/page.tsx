import { Metadata } from "next";
import { Suspense } from "react";
import { TransformClient } from "./_components/TransformClient";

export const metadata: Metadata = {
    title: "BasaltLens | BasaltHQ",
    description: "Convert massive PDFs and documents into structured data instantly with AI.",
};

export default function TransformPage() {
    return (
        <Suspense fallback={<div className="h-full w-full" />}>
            <TransformClient />
        </Suspense>
    );
}
