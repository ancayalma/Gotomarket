/**
 * Seed AWS Bedrock models into the AiModel table
 * 
 * Run with: npx tsx scripts/seed-bedrock-models.ts
 * 
 * Adds all available AWS Bedrock text/chat models under the existing AZURE
 * provider slug (which already has a card in the AI Settings UI).
 * 
 * Pricing: US East / US West On-Demand Standard tier, per 1M tokens.
 * Source: https://aws.amazon.com/bedrock/pricing/  (verified 2026-03-15)
 * 
 * Idempotent — safe to re-run.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROVIDER = "BEDROCK";  // Matches existing provider slug in openai.ts

// All prices are per 1M tokens, US East/West On-Demand Standard tier
const BEDROCK_MODELS = [
  // ── Anthropic Claude ──────────────────────────────────────────────
  {
    name: "Claude Opus 4",
    modelId: "us.anthropic.claude-opus-4-20250514-v1:0",
    description: "Most powerful Claude. Sustained complex reasoning, coding, and research.",
    inputPrice: 15.00,
    outputPrice: 75.00,
    maxContext: 200000,
  },
  {
    name: "Claude Sonnet 4",
    modelId: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    description: "Best balance of intelligence and speed. Ideal for complex analysis.",
    inputPrice: 3.00,
    outputPrice: 15.00,
    maxContext: 200000,
  },
  {
    name: "Claude 3.5 Sonnet v2",
    modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    description: "Previous gen Sonnet. Reliable for general-purpose AI tasks.",
    inputPrice: 3.00,
    outputPrice: 15.00,
    maxContext: 200000,
  },
  {
    name: "Claude Haiku 4.5",
    modelId: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
    description: "Fastest Claude model. Great for high-volume, cost-sensitive tasks.",
    inputPrice: 0.80,
    outputPrice: 4.00,
    maxContext: 200000,
  },
  {
    name: "Claude 3.5 Haiku",
    modelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
    description: "Previous gen Haiku. Fast and affordable.",
    inputPrice: 0.80,
    outputPrice: 4.00,
    maxContext: 200000,
  },

  // ── Qwen (Alibaba Cloud) ─────────────────────────────────────────
  {
    name: "Qwen3 Next 80B A3B",
    modelId: "qwen.qwen3-next-80b-a3b",
    description: "Ultra-efficient MoE model. 80B params, 3B active. Cheapest agentic model.",
    inputPrice: 0.15,
    outputPrice: 1.20,
    maxContext: 131072,
  },
  {
    name: "Qwen3 Vision 235B",
    modelId: "qwen.qwen3-vl-235b-a22b",
    description: "Multi-modal model providing high accuracy in interpreting images, documents, and visual structures.",
    inputPrice: 0.53,
    outputPrice: 2.66,
    maxContext: 131072,
  },
  {
    name: "Qwen3 Coder Next",
    modelId: "qwen.qwen3-coder-next-v1:0",
    description: "Latest Qwen coding model. Optimized for software engineering tasks.",
    inputPrice: 0.50,
    outputPrice: 1.20,
    maxContext: 131072,
  },
  {
    name: "Qwen3 Coder 30B A3B",
    modelId: "qwen.qwen3-coder-30b-a3b-instruct-v1:0",
    description: "Lightweight 30B MoE coder. 3B active params. Fast and cost-effective.",
    inputPrice: 0.15,
    outputPrice: 0.62,
    maxContext: 131072,
  },
  {
    name: "Qwen3 32B Dense",
    modelId: "qwen.qwen3-32b-v1:0",
    description: "Dense 32B model. Consistent performance, low latency.",
    inputPrice: 0.15,
    outputPrice: 0.62,
    maxContext: 131072,
  },
  {
    name: "Qwen3 235B A22B",
    modelId: "qwen.qwen3-235b-a22b-instruct-2507-v1:0",
    description: "General-purpose 235B MoE model. 22B active. Strong reasoning.",
    inputPrice: 0.23,
    outputPrice: 0.91,
    maxContext: 131072,
  },

  // ── Meta Llama ────────────────────────────────────────────────────
  {
    name: "Llama 4 Maverick 17B",
    modelId: "meta.llama4-maverick-17b-instruct-v1:0",
    description: "Llama 4 Maverick. Fast instruction-following with MoE architecture.",
    inputPrice: 0.19,
    outputPrice: 0.85,
    maxContext: 131072,
  },
  {
    name: "Llama 4 Scout 17B",
    modelId: "meta.llama4-scout-17b-instruct-v1:0",
    description: "Llama 4 Scout. Optimized for search and retrieval workloads.",
    inputPrice: 0.15,
    outputPrice: 0.56,
    maxContext: 131072,
  },
  {
    name: "Llama 3.3 70B",
    modelId: "meta.llama3-3-70b-instruct-v1:0",
    description: "Robust 70B instruction model. Good balance of capability and cost.",
    inputPrice: 0.72,
    outputPrice: 0.72,
    maxContext: 128000,
  },

  // ── Amazon Nova ───────────────────────────────────────────────────
  {
    name: "Amazon Nova Pro",
    modelId: "amazon.nova-pro-v1:0",
    description: "Amazon's flagship model. Strong general-purpose reasoning.",
    inputPrice: 0.80,
    outputPrice: 3.20,
    maxContext: 300000,
  },
  {
    name: "Amazon Nova Lite",
    modelId: "amazon.nova-lite-v1:0",
    description: "Lightweight Amazon model. Very fast and cost-effective.",
    inputPrice: 0.06,
    outputPrice: 0.24,
    maxContext: 300000,
  },
  {
    name: "Amazon Nova Micro",
    modelId: "amazon.nova-micro-v1:0",
    description: "Smallest Amazon model. Text-only, ultra-low latency.",
    inputPrice: 0.035,
    outputPrice: 0.14,
    maxContext: 128000,
  },

  // ── DeepSeek ──────────────────────────────────────────────────────
  {
    name: "DeepSeek V3.2",
    modelId: "deepseek.deepseek-v3-2-v1:0",
    description: "DeepSeek V3.2. Strong reasoning, code, and math. MoE architecture.",
    inputPrice: 0.62,
    outputPrice: 1.85,
    maxContext: 128000,
  },

  // ── Mistral AI ────────────────────────────────────────────────────
  {
    name: "Mistral Large 3",
    modelId: "mistral.mistral-large-3-v1:0",
    description: "Mistral's most capable model. Strong multilingual and code support.",
    inputPrice: 0.50,
    outputPrice: 1.50,
    maxContext: 128000,
  },
  {
    name: "Devstral 2 135B",
    modelId: "mistral.devstral-2-135b-v1:0",
    description: "Mistral's dedicated coding model. 135B params. Advanced code generation.",
    inputPrice: 0.40,
    outputPrice: 2.00,
    maxContext: 128000,
  },
  {
    name: "Magistral Small 1.2",
    modelId: "mistral.magistral-small-1-2-v1:0",
    description: "Compact reasoning model. High efficiency for structured tasks.",
    inputPrice: 0.50,
    outputPrice: 1.50,
    maxContext: 128000,
  },

  // ── Google ────────────────────────────────────────────────────────
  {
    name: "Gemma 3 27B",
    modelId: "google.gemma-3-27b-v1:0",
    description: "Google's largest open model on Bedrock. Strong general-purpose performance.",
    inputPrice: 0.23,
    outputPrice: 0.38,
    maxContext: 128000,
  },
  {
    name: "Gemma 3 12B",
    modelId: "google.gemma-3-12b-v1:0",
    description: "Mid-size Google model. Good balance of speed and quality.",
    inputPrice: 0.09,
    outputPrice: 0.29,
    maxContext: 128000,
  },
  {
    name: "Gemma 3 4B",
    modelId: "google.gemma-3-4b-v1:0",
    description: "Smallest Gemma. Ultra-fast and extremely affordable.",
    inputPrice: 0.04,
    outputPrice: 0.08,
    maxContext: 128000,
  },

  // ── MiniMax AI ────────────────────────────────────────────────────
  {
    name: "MiniMax M2.1",
    modelId: "minimax.minimax-m2-1-v1:0",
    description: "MiniMax M2.1. Strong reasoning at competitive pricing.",
    inputPrice: 0.30,
    outputPrice: 1.20,
    maxContext: 128000,
  },

  // ── Z AI (Zhipu) ─────────────────────────────────────────────────
  {
    name: "GLM 4.7",
    modelId: "z-ai.glm-4-7-v1:0",
    description: "Z AI flagship model. Strong multilingual reasoning.",
    inputPrice: 0.60,
    outputPrice: 2.20,
    maxContext: 128000,
  },
  {
    name: "GLM 4.7 Flash",
    modelId: "z-ai.glm-4-7-flash-v1:0",
    description: "Z AI fast model. Ultra-low cost for simple tasks.",
    inputPrice: 0.07,
    outputPrice: 0.40,
    maxContext: 128000,
  },

  // ── Writer ────────────────────────────────────────────────────────
  {
    name: "Palmyra X5",
    modelId: "writer.palmyra-x5-v1:0",
    description: "Writer's latest model. Optimized for enterprise content generation.",
    inputPrice: 0.60,
    outputPrice: 6.00,
    maxContext: 128000,
  },
];

async function main() {
  console.log("🚀 Seeding AWS Bedrock models under BEDROCK provider...\n");

  // 1. Ensure SystemAiConfig for BEDROCK exists
  try {
    await (prisma as any).systemAiConfig.upsert({
      where: { provider: PROVIDER },
      update: {
        isActive: true,
      },
      create: {
        provider: PROVIDER,
        apiKey: "MANAGED_BY_IAM",
        defaultModelId: "qwen.qwen3-next-80b-a3b",
        isActive: true,
      },
    });
    console.log("✅ SystemAiConfig: BEDROCK verified/created\n");
  } catch (e: any) {
    console.warn("⚠️  SystemAiConfig upsert skipped:", e.message);
  }

  // 2. Upsert each model
  let created = 0;
  let updated = 0;

  for (const model of BEDROCK_MODELS) {
    const existing = await (prisma as any).aiModel.findFirst({
      where: { modelId: model.modelId },
    });

    if (existing) {
      await (prisma as any).aiModel.update({
        where: { id: existing.id },
        data: {
          name: model.name,
          provider: PROVIDER,
          description: model.description,
          inputPrice: model.inputPrice,
          outputPrice: model.outputPrice,
          maxContext: model.maxContext,
          defaultMarkup: 50.0,
          isActive: true,
        },
      });
      updated++;
      console.log(`  📝 Updated: ${model.name} (${model.modelId})`);
    } else {
      await (prisma as any).aiModel.create({
        data: {
          name: model.name,
          modelId: model.modelId,
          provider: PROVIDER,
          description: model.description,
          inputPrice: model.inputPrice,
          outputPrice: model.outputPrice,
          maxContext: model.maxContext,
          defaultMarkup: 50.0,
          isActive: true,
          isDefault: model.modelId === "qwen.qwen3-next-80b-a3b",
        },
      });
      created++;
      console.log(`  ✨ Created: ${model.name} (${model.modelId})`);
    }
  }

  console.log(`\n🎉 Done! Created: ${created}, Updated: ${updated}, Total: ${BEDROCK_MODELS.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
