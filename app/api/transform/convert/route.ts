import { NextResponse } from "next/server";
import { convertFile, isConversionSupported } from "@/lib/convert";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const from = (formData.get("from") as string)?.toUpperCase();
        const to = (formData.get("to") as string)?.toUpperCase();

        if (!file || !from || !to) {
            return NextResponse.json(
                { error: "Missing required fields: file, from, to" },
                { status: 400 }
            );
        }

        if (!isConversionSupported(from, to)) {
            return NextResponse.json(
                { error: `Conversion ${from} -> ${to} is not supported` },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await convertFile(buffer, from, to, file.name);

        const baseName = file.name.replace(/\.[^/.]+$/, "");

        return new NextResponse(result.buffer as any, {
            status: 200,
            headers: {
                "Content-Type": result.mimeType,
                "Content-Disposition": `attachment; filename="${baseName}${result.extension}"`,
            },
        });
    } catch (error: any) {
        console.error("[CONVERT_ERROR]", error);
        return NextResponse.json(
            { error: error.message || "Conversion failed" },
            { status: 500 }
        );
    }
}
