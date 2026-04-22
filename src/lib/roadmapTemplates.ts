import type {
  RoadmapTemplate,
  RoadmapMilestone,
  KeyNode,
} from '@/types/roadmap'
import { addDays, formatDateStr } from './timelineCalculator'

// UUID fallback for non-secure contexts (HTTP)
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID() } catch { /* fallback below */ }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ============================================================
// Roadmap Templates — built-in template definitions
// ============================================================

// ─── Agile Sprint (6 × 2-week sprints) ─────────────────────

const agileSprint: RoadmapTemplate = {
  id: 'agile-sprint',
  nameKey: 'roadmap.template.agileSprint.name',
  descriptionKey: 'roadmap.template.agileSprint.description',
  icon: '🏃',
  milestones: [
    { name: 'Sprint 1', startDayOffset: 0, endDayOffset: 14, status: 'planned' },
    { name: 'Sprint 2', startDayOffset: 14, endDayOffset: 28, status: 'planned' },
    { name: 'Sprint 3', startDayOffset: 28, endDayOffset: 42, status: 'planned' },
    { name: 'Sprint 4', startDayOffset: 42, endDayOffset: 56, status: 'planned' },
    { name: 'Sprint 5', startDayOffset: 56, endDayOffset: 70, status: 'planned' },
    { name: 'Sprint 6', startDayOffset: 70, endDayOffset: 84, status: 'planned' },
  ],
  nodes: [
    { name: 'Sprint Review', dayOffset: 14, type: 'review' },
    { name: 'Sprint Review', dayOffset: 28, type: 'review' },
    { name: 'Sprint Review', dayOffset: 42, type: 'review' },
    { name: 'Sprint Review', dayOffset: 56, type: 'review' },
    { name: 'Sprint Review', dayOffset: 70, type: 'review' },
    { name: 'Final Release', dayOffset: 84, type: 'release' },
  ],
}

// ─── Quarterly Planning (4 quarters) ────────────────────────

const quarterly: RoadmapTemplate = {
  id: 'quarterly',
  nameKey: 'roadmap.template.quarterly.name',
  descriptionKey: 'roadmap.template.quarterly.description',
  icon: '📅',
  milestones: [
    { name: 'Q1', startDayOffset: 0, endDayOffset: 90, status: 'planned' },
    { name: 'Q2', startDayOffset: 90, endDayOffset: 180, status: 'planned' },
    { name: 'Q3', startDayOffset: 180, endDayOffset: 270, status: 'planned' },
    { name: 'Q4', startDayOffset: 270, endDayOffset: 360, status: 'planned' },
  ],
  nodes: [
    { name: 'Quarterly Review', dayOffset: 90, type: 'review' },
    { name: 'Quarterly Review', dayOffset: 180, type: 'review' },
    { name: 'Quarterly Review', dayOffset: 270, type: 'review' },
    { name: 'Quarterly Review', dayOffset: 360, type: 'review' },
  ],
}

// ─── Product Launch (5 phases) ──────────────────────────────

const productLaunch: RoadmapTemplate = {
  id: 'product-launch',
  nameKey: 'roadmap.template.productLaunch.name',
  descriptionKey: 'roadmap.template.productLaunch.description',
  icon: '🚀',
  milestones: [
    { name: '需求分析', startDayOffset: 0, endDayOffset: 14, status: 'planned' },
    { name: '设计', startDayOffset: 14, endDayOffset: 28, status: 'planned' },
    { name: '开发', startDayOffset: 28, endDayOffset: 70, status: 'planned' },
    { name: '测试', startDayOffset: 70, endDayOffset: 84, status: 'planned' },
    { name: '发布', startDayOffset: 84, endDayOffset: 91, status: 'planned' },
  ],
  nodes: [
    { name: 'Design Review', dayOffset: 28, type: 'review' },
    { name: 'Beta Release', dayOffset: 84, type: 'release' },
    { name: 'GA Release', dayOffset: 91, type: 'release' },
  ],
}

// ─── Custom Blank ───────────────────────────────────────────

const customBlank: RoadmapTemplate = {
  id: 'custom-blank',
  nameKey: 'roadmap.template.customBlank.name',
  descriptionKey: 'roadmap.template.customBlank.description',
  icon: '✏️',
  milestones: [],
  nodes: [],
}

// ─── Exported template list ─────────────────────────────────

export const ROADMAP_TEMPLATES: RoadmapTemplate[] = [
  agileSprint,
  quarterly,
  productLaunch,
  customBlank,
]


// ─── applyTemplate ──────────────────────────────────────────

/**
 * Generate actual milestones and nodes from a template by adding
 * day offsets to the given base date.
 */
export function applyTemplate(
  template: RoadmapTemplate,
  baseDate: Date,
): { milestones: RoadmapMilestone[]; nodes: KeyNode[] } {
  const now = new Date().toISOString()

  const milestones: RoadmapMilestone[] = template.milestones.map((tm) => ({
    id: generateId(),
    name: tm.name,
    startDate: formatDateStr(addDays(baseDate, tm.startDayOffset)),
    endDate: formatDateStr(addDays(baseDate, tm.endDayOffset)),
    description: '',
    status: tm.status,
    createdAt: now,
    updatedAt: now,
  }))

  const nodes: KeyNode[] = template.nodes.map((tn) => ({
    id: generateId(),
    name: tn.name,
    date: formatDateStr(addDays(baseDate, tn.dayOffset)),
    type: tn.type,
    description: '',
    createdAt: now,
    updatedAt: now,
  }))

  return { milestones, nodes }
}
