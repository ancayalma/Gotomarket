import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const color = url.searchParams.get("color");

  if (!name) return new NextResponse("Missing name", { status: 400 });

  try {
    // Basic path validation to prevent directory traversal
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "");
    const filePath = path.join(process.cwd(), "public", "icons", "lucide", `${safeName}.svg`);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Not found", { status: 404 });
    }

    let svgRaw = fs.readFileSync(filePath, "utf-8");

    if (color) {
      // Must be safe hex
      const safeColor = color.replace(/[^a-fA-F0-9]/g, "");
      // Replace currentColor or generic hardcoded stroke if any
      svgRaw = svgRaw.replace(/currentColor/g, `#${safeColor}`);
    }

    return new NextResponse(svgRaw, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return new NextResponse("Error reading icon", { status: 500 });
  }
}
