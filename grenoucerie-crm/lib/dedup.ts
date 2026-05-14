/**
 * BasaltLens Deduplication Engine
 * 
 * Industry-leading duplicate detection using multi-signal similarity scoring:
 * - Jaro-Winkler distance for fuzzy string matching
 * - Normalized comparison for phones, emails, identifiers
 * - Composite row-level scoring with configurable thresholds
 * - Golden Record merge strategy (most-complete, best-formatted values win)
 */

// ── Jaro-Winkler Distance ──
// Standard record-linkage algorithm used by census bureaus and financial institutions
function jaroDistance(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;
    const len1 = s1.length, len2 = s2.length;
    if (len1 === 0 || len2 === 0) return 0.0;

    const matchWindow = Math.max(0, Math.floor(Math.max(len1, len2) / 2) - 1);
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, len2);
        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    for (let i = 0; i < len1; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    return (
        (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
    );
}

function jaroWinkler(s1: string, s2: string, prefixScale = 0.1): number {
    const jaro = jaroDistance(s1, s2);
    let prefixLen = 0;
    for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
        if (s1[i] === s2[i]) prefixLen++;
        else break;
    }
    return jaro + prefixLen * prefixScale * (1 - jaro);
}

// ── Normalization ──
function normalize(value: string): string {
    return value
        .toLowerCase()
        .replace(/[\s\-_.,:;\/\\()]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizePhone(value: string): string {
    return value.replace(/[^\d+]/g, "").replace(/^(\+?1)/, "");
}

function normalizeEmail(value: string): string {
    return value.toLowerCase().trim();
}

// ── Field-Type Detection ──
function detectFieldType(header: string, values: string[]): "phone" | "email" | "name" | "number" | "text" {
    const h = header.toLowerCase();
    if (h.includes("phone") || h.includes("tel") || h.includes("mobile") || h.includes("fax")) return "phone";
    if (h.includes("email") || h.includes("e-mail")) return "email";
    if (h.includes("name") || h.includes("first") || h.includes("last") || h.includes("company")) return "name";
    
    // Check values
    const sample = values.filter(Boolean).slice(0, 5);
    if (sample.length > 0) {
        const phonePattern = /^[\d\s\-().+]{7,}$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (sample.every(v => phonePattern.test(v))) return "phone";
        if (sample.every(v => emailPattern.test(v))) return "email";
        if (sample.every(v => !isNaN(Number(v.replace(/[,$]/g, ""))))) return "number";
    }
    return "text";
}

// ── Pairwise Cell Similarity ──
function cellSimilarity(v1: string, v2: string, fieldType: string): number {
    if (!v1 && !v2) return 1.0; // Both empty = match
    if (!v1 || !v2) return 0.0; // One empty = no match

    switch (fieldType) {
        case "phone":
            return normalizePhone(v1) === normalizePhone(v2) ? 1.0 : 0.0;
        case "email":
            return normalizeEmail(v1) === normalizeEmail(v2) ? 1.0 : jaroWinkler(normalizeEmail(v1), normalizeEmail(v2));
        case "number":
            const n1 = parseFloat(v1.replace(/[,$\s]/g, ""));
            const n2 = parseFloat(v2.replace(/[,$\s]/g, ""));
            if (isNaN(n1) || isNaN(n2)) return jaroWinkler(normalize(v1), normalize(v2));
            return n1 === n2 ? 1.0 : 0.0;
        case "name":
            return jaroWinkler(normalize(v1), normalize(v2));
        default:
            return jaroWinkler(normalize(v1), normalize(v2));
    }
}

// ── Row Similarity ──
// Weighted composite: identity fields (name, email, phone) carry 2x weight
function rowSimilarity(
    row1: Record<string, string>,
    row2: Record<string, string>,
    headers: string[],
    fieldTypes: Record<string, string>
): number {
    let totalWeight = 0;
    let totalScore = 0;

    for (const h of headers) {
        const ft = fieldTypes[h] || "text";
        // Identity fields get higher weight
        const weight = ["name", "email", "phone"].includes(ft) ? 2.0 : 1.0;
        const sim = cellSimilarity(row1[h] || "", row2[h] || "", ft);
        totalScore += sim * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// ── Duplicate Group Detection ──
export interface DuplicateGroup {
    id: string;
    rowIndices: number[]; // 0-based indices into the data array
    similarity: number;   // Average similarity score within group
}

export function detectDuplicates(
    data: Record<string, string>[],
    headers: string[],
    threshold = 0.82
): DuplicateGroup[] {
    if (data.length < 2) return [];

    // Detect field types
    const fieldTypes: Record<string, string> = {};
    for (const h of headers) {
        const values = data.map(row => row[h] || "");
        fieldTypes[h] = detectFieldType(h, values);
    }

    // Build similarity matrix and find connected components
    const visited = new Set<number>();
    const groups: DuplicateGroup[] = [];

    for (let i = 0; i < data.length; i++) {
        if (visited.has(i)) continue;

        const group: number[] = [i];
        let groupSim = 0;
        let pairCount = 0;

        for (let j = i + 1; j < data.length; j++) {
            if (visited.has(j)) continue;
            const sim = rowSimilarity(data[i], data[j], headers, fieldTypes);
            if (sim >= threshold) {
                // Also check against all existing group members (transitive closure)
                let allMatch = true;
                for (const gi of group) {
                    if (gi === i) continue;
                    const crossSim = rowSimilarity(data[gi], data[j], headers, fieldTypes);
                    if (crossSim < threshold * 0.9) { // Slight relaxation for transitive matches
                        allMatch = false;
                        break;
                    }
                }
                if (allMatch) {
                    group.push(j);
                    groupSim += sim;
                    pairCount++;
                }
            }
        }

        if (group.length > 1) {
            group.forEach(idx => visited.add(idx));
            groups.push({
                id: `dup_${groups.length}`,
                rowIndices: group,
                similarity: pairCount > 0 ? groupSim / pairCount : 1.0,
            });
        }
    }

    return groups;
}

// ── Build Duplicate Map ──
// Returns a map: rowIndex -> display string like "→ #3, #7"
export function buildDuplicateMap(
    groups: DuplicateGroup[]
): Record<number, { groupId: string; references: string; similarity: number }> {
    const map: Record<number, { groupId: string; references: string; similarity: number }> = {};

    for (const group of groups) {
        for (const idx of group.rowIndices) {
            const others = group.rowIndices
                .filter(i => i !== idx)
                .map(i => `#${i + 1}`)
                .join(", ");
            map[idx] = {
                groupId: group.id,
                references: others,
                similarity: group.similarity,
            };
        }
    }

    return map;
}

// ── Golden Record Merge ──
// Creates the best possible merged record from a set of duplicate rows
// Strategy: For each field, pick the "best" value using a quality heuristic
export function goldenRecordMerge(
    rows: Record<string, string>[],
    headers: string[]
): Record<string, string> {
    const merged: Record<string, string> = {};

    for (const h of headers) {
        const values = rows.map(r => r[h] || "").filter(Boolean);
        if (values.length === 0) { merged[h] = ""; continue; }
        if (values.length === 1) { merged[h] = values[0]; continue; }

        // Quality scoring for each candidate value
        const scored = values.map(v => ({
            value: v,
            score: valueQualityScore(v, h),
        }));

        // Pick highest quality
        scored.sort((a, b) => b.score - a.score);
        merged[h] = scored[0].value;
    }

    return merged;
}

function valueQualityScore(value: string, header: string): number {
    let score = 0;

    // Longer values tend to be more complete
    score += Math.min(value.length / 50, 1) * 20;

    // Proper case is preferred over ALL CAPS or all lowercase
    const isProperCase = /^[A-Z][a-z]/.test(value);
    const isAllCaps = value === value.toUpperCase() && /[A-Z]/.test(value);
    const isAllLower = value === value.toLowerCase() && /[a-z]/.test(value);
    if (isProperCase) score += 15;
    else if (isAllCaps) score += 5;
    else if (isAllLower) score += 3;

    // Has no trailing/leading whitespace
    if (value === value.trim()) score += 10;

    // Email-specific: has @ and valid domain
    if (header.toLowerCase().includes("email") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        score += 25;
    }

    // Phone-specific: longer (more complete with area code)
    if (header.toLowerCase().includes("phone") || header.toLowerCase().includes("number")) {
        const digits = value.replace(/\D/g, "").length;
        score += Math.min(digits / 10, 1) * 20;
    }

    // No OCR artifacts (special chars, weird sequences)
    const hasArtifacts = /[|{}\[\]~`^]/.test(value);
    if (!hasArtifacts) score += 10;

    return score;
}

// ── Merge All Groups ──
export function mergeAllDuplicates(
    data: Record<string, string>[],
    headers: string[],
    groups: DuplicateGroup[]
): Record<string, string>[] {
    // Rows that belong to a group
    const groupedIndices = new Set<number>();
    groups.forEach(g => g.rowIndices.forEach(i => groupedIndices.add(i)));

    // Start with non-duplicate rows (preserving order)
    const result: Record<string, string>[] = [];
    const mergedGroupIds = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        if (!groupedIndices.has(i)) {
            result.push({ ...data[i] });
        } else {
            // Find this row's group
            const group = groups.find(g => g.rowIndices.includes(i));
            if (group && !mergedGroupIds.has(group.id)) {
                // Merge this group and insert the golden record
                const groupRows = group.rowIndices.map(idx => data[idx]);
                const golden = goldenRecordMerge(groupRows, headers);
                result.push(golden);
                mergedGroupIds.add(group.id);
            }
            // Skip subsequent rows of already-merged groups
        }
    }

    return result;
}
