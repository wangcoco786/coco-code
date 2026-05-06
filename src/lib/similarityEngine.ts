import type { SimilarityResult } from '@/types/platform'

// ─── Core Functions ─────────────────────────────────────────

/**
 * Computes bigram-based Jaccard similarity between two texts.
 * - Symmetric: similarity(A, B) === similarity(B, A)
 * - Identity: similarity(A, A) === 1.0
 * - Returns value in [0, 1]
 */
export function computeTextSimilarity(text1: string, text2: string): number {
  const normalized1 = text1.toLowerCase().trim()
  const normalized2 = text2.toLowerCase().trim()

  // Identity case
  if (normalized1 === normalized2) return 1.0

  // Empty string handling
  if (normalized1.length === 0 && normalized2.length === 0) return 1.0
  if (normalized1.length === 0 || normalized2.length === 0) return 0

  const bigrams1 = getBigrams(normalized1)
  const bigrams2 = getBigrams(normalized2)

  // Handle single-character strings (no bigrams possible)
  if (bigrams1.size === 0 && bigrams2.size === 0) {
    return normalized1 === normalized2 ? 1.0 : 0
  }
  if (bigrams1.size === 0 || bigrams2.size === 0) return 0

  // Jaccard similarity: |intersection| / |union|
  let intersectionSize = 0
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) {
      intersectionSize++
    }
  }

  const unionSize = bigrams1.size + bigrams2.size - intersectionSize
  if (unionSize === 0) return 0

  return intersectionSize / unionSize
}

/**
 * Finds issues with similarity above threshold, sorted by similarity descending.
 */
export function findSimilarIssues(
  newTitle: string,
  existingIssues: { id: string; title: string }[],
  threshold: number = 0.8
): SimilarityResult[] {
  if (!newTitle.trim()) return []

  const results: SimilarityResult[] = []

  for (const issue of existingIssues) {
    const similarity = computeTextSimilarity(newTitle, issue.title)
    if (similarity >= threshold) {
      results.push({
        issueId: issue.id,
        issueTitle: issue.title,
        similarity,
      })
    }
  }

  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity)

  return results
}

// ─── Helpers ────────────────────────────────────────────────

function getBigrams(text: string): Set<string> {
  const bigrams = new Set<string>()
  for (let i = 0; i < text.length - 1; i++) {
    bigrams.add(text.substring(i, i + 2))
  }
  return bigrams
}
