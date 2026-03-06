import { prismadb } from "@/lib/prisma";

/**
 * Calculates the cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 means identical direction.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error("Vectors must have the same length for cosine similarity");
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieves the top K most relevant knowledge signals for a specific ContextNode 
 * (Account or Lead) using in-memory vector comparison.
 * 
 * Perfect for Community MongoDB since we only compare facts within a single 
 * customer's context scope (typically < 1000 facts), making this operation 
 * virtually instant in Node.js.
 */
export async function retrieveRelevantFacts({
    contextNodeId,
    queryEmbedding,
    topK = 5,
    minScore = 0.5
}: {
    contextNodeId: string;
    queryEmbedding: number[];
    topK?: number;
    minScore?: number;
}) {
    // 1. Fetch all vector embeddings scoped to this specific Account/Lead context
    const vectorRecords = await prismadb.vectorEmbedding.findMany({
        where: { contextNodeId },
        include: {
            knowledgeSignal: true
        }
    });

    if (!vectorRecords.length) return [];

    // 2. Score them using purely Node.js Math
    const scoredRecords = vectorRecords.map(record => {
        const score = cosineSimilarity(queryEmbedding, record.embedding);
        return {
            ...record,
            score
        };
    });

    // 3. Filter by threshold, sort by highest similarity, and take top K
    const bestMatches = scoredRecords
        .filter(record => record.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return bestMatches.map(match => ({
        id: match.knowledgeSignalId,
        text: match.text,
        type: match.knowledgeSignal?.type,
        source: match.knowledgeSignal?.sourceType,
        url: match.knowledgeSignal?.sourceUrl,
        score: match.score
    }));
}
