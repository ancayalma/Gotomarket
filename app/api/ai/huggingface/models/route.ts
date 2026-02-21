import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for the Hugging Face Hub API model search.
 * GET /api/ai/huggingface/models?search=llama&limit=20
 *
 * Filters to text-generation and text2text-generation pipelines only.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const limit = searchParams.get("limit") || "20";
        const sort = searchParams.get("sort") || "downloads";

        // Build HF API URL
        const hfUrl = new URL("https://huggingface.co/api/models");
        if (search) hfUrl.searchParams.set("search", search);
        hfUrl.searchParams.set("limit", limit);
        hfUrl.searchParams.set("sort", sort);
        hfUrl.searchParams.set("direction", "-1"); // descending
        // Only text generation models
        hfUrl.searchParams.set("pipeline_tag", "text-generation");

        const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

        const headers: Record<string, string> = {
            "Accept": "application/json",
        };
        if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

        // Use axios with an agent to bypass SSL issues in dev
        const axios = (await import("axios")).default;
        const https = await import("https");
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(hfUrl.toString(), {
            headers,
            httpsAgent: agent,
            timeout: 10000,
        });

        const models = response.data;

        // Slim down the response to only what we need
        const simplified = (models as any[]).map(m => ({
            id: m.modelId || m.id,
            author: m.author || (m.id || "").split("/")[0],
            name: (m.id || "").split("/").pop(),
            downloads: m.downloads || 0,
            likes: m.likes || 0,
            tags: (m.tags || []).slice(0, 8),
            pipeline_tag: m.pipeline_tag,
            lastModified: m.lastModified,
            private: m.private || false,
        }));

        return NextResponse.json(simplified);
    } catch (error: any) {
        console.error("[HF_MODEL_SEARCH]", error);
        return NextResponse.json({ error: "Failed to search HuggingFace models" }, { status: 500 });
    }
}
