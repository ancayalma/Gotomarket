import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const color = url.searchParams.get("color");

  if (!name) return new NextResponse("Missing name", { status: 400 });

  // Basic path validation to prevent directory traversal
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    let svgRaw: string | null = null;

    // Strategy 1: Try reading from filesystem (works in dev and some hosts)
    const filePath = path.join(process.cwd(), "public", "icons", "lucide", `${safeName}.svg`);
    try {
      if (fs.existsSync(filePath)) {
        svgRaw = fs.readFileSync(filePath, "utf-8");
      }
    } catch {}

    // Strategy 2: Fetch from the app's own public URL (works on serverless/Vercel)
    if (!svgRaw) {
      const origin = url.origin; // e.g., https://myapp.vercel.app
      const publicUrl = `${origin}/icons/lucide/${safeName}.svg`;
      try {
        const res = await fetch(publicUrl, { cache: "force-cache" });
        if (res.ok) {
          svgRaw = await res.text();
        }
      } catch {}
    }

    if (!svgRaw) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Always replace currentColor (doesn't resolve inside <img> tags)
    const safeColor = color
      ? color.replace(/[^a-fA-F0-9]/g, "")
      : "000000"; // default black — CSS dark:invert flips to white
    svgRaw = svgRaw.replace(/currentColor/g, `#${safeColor}`);

    return new NextResponse(svgRaw, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Error reading icon", { status: 500 });
  }
}
