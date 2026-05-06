import { describe, it, expect } from 'vitest'
import { computeTextSimilarity, findSimilarIssues } from './similarityEngine'

// ─── computeTextSimilarity ──────────────────────────────────

describe('computeTextSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(computeTextSimilarity('hello world', 'hello world')).toBe(1.0)
  })

  it('returns 1.0 for identical strings with different casing', () => {
    expect(computeTextSimilarity('Hello World', 'hello world')).toBe(1.0)
  })

  it('is symmetric: similarity(A, B) === similarity(B, A)', () => {
    const a = 'user login page'
    const b = 'login page design'
    expect(computeTextSimilarity(a, b)).toBe(computeTextSimilarity(b, a))
  })

  it('returns value in [0, 1]', () => {
    const result = computeTextSimilarity('abc', 'xyz')
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })

  it('returns 0 for completely different strings', () => {
    const result = computeTextSimilarity('abcdef', 'zyxwvu')
    expect(result).toBe(0)
  })

  it('returns higher similarity for more similar strings', () => {
    const base = 'implement user authentication'
    const similar = 'implement user authorization'
    const different = 'fix database connection pool'

    const simScore = computeTextSimilarity(base, similar)
    const diffScore = computeTextSimilarity(base, different)
    expect(simScore).toBeGreaterThan(diffScore)
  })

  it('handles empty strings', () => {
    expect(computeTextSimilarity('', '')).toBe(1.0)
    expect(computeTextSimilarity('hello', '')).toBe(0)
    expect(computeTextSimilarity('', 'hello')).toBe(0)
  })

  it('handles single character strings', () => {
    expect(computeTextSimilarity('a', 'a')).toBe(1.0)
    expect(computeTextSimilarity('a', 'b')).toBe(0)
  })

  it('handles whitespace-only strings', () => {
    expect(computeTextSimilarity('   ', '   ')).toBe(1.0)
  })
})

// ─── findSimilarIssues ──────────────────────────────────────

describe('findSimilarIssues', () => {
  const existingIssues = [
    { id: 'DTS-1', title: '实现用户登录功能' },
    { id: 'DTS-2', title: '实现用户注册功能' },
    { id: 'DTS-3', title: '修复数据库连接问题' },
    { id: 'DTS-4', title: '实现用户登录功能优化' },
  ]

  it('returns issues above threshold sorted by similarity desc', () => {
    const results = findSimilarIssues('实现用户登录功能', existingIssues, 0.5)
    expect(results.length).toBeGreaterThan(0)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity)
    }
  })

  it('returns empty array for empty title', () => {
    const results = findSimilarIssues('', existingIssues)
    expect(results).toHaveLength(0)
  })

  it('returns empty array when no issues match threshold', () => {
    const results = findSimilarIssues('completely unrelated topic xyz', existingIssues, 0.99)
    expect(results).toHaveLength(0)
  })

  it('returns exact match with similarity 1.0', () => {
    const results = findSimilarIssues('实现用户登录功能', existingIssues, 0.8)
    const exactMatch = results.find((r) => r.issueId === 'DTS-1')
    expect(exactMatch).toBeDefined()
    expect(exactMatch!.similarity).toBe(1.0)
  })

  it('uses default threshold of 0.8', () => {
    const results = findSimilarIssues('实现用户登录功能', existingIssues)
    // Should find at least the exact match
    expect(results.length).toBeGreaterThanOrEqual(1)
    for (const result of results) {
      expect(result.similarity).toBeGreaterThanOrEqual(0.8)
    }
  })

  it('handles empty existing issues array', () => {
    const results = findSimilarIssues('some title', [])
    expect(results).toHaveLength(0)
  })

  it('each result has correct structure', () => {
    const results = findSimilarIssues('实现用户登录功能', existingIssues, 0.3)
    for (const result of results) {
      expect(result.issueId).toBeTruthy()
      expect(result.issueTitle).toBeTruthy()
      expect(result.similarity).toBeGreaterThanOrEqual(0)
      expect(result.similarity).toBeLessThanOrEqual(1)
    }
  })
})
