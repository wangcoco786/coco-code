import { useState, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { useI18n } from '@/context/I18nContext'
import { useRoadmapStore } from '@/hooks/useRoadmapStore'
import { syncJiraVersions } from '@/lib/roadmapJiraSync'
import AIInsight from '@/components/AIInsight/AIInsight'
import Toolbar from './Toolbar'
import TimelineView from './TimelineView'
import MilestoneDialog from './MilestoneDialog'
import NodeDialog from './NodeDialog'
import TemplateDialog from './TemplateDialog'
import type { RoadmapMilestone, KeyNode, MilestoneFormData, NodeFormData } from '@/types/roadmap'
import styles from './Roadmap.module.css'

export default function Roadmap() {
  const { currentProjectKey } = useApp()
  const { t } = useI18n()
  const store = useRoadmapStore(currentProjectKey)

  // Dialog states
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<RoadmapMilestone | null>(null)
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<KeyNode | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // ── Milestone handlers ──
  const handleAddMilestone = () => {
    setEditingMilestone(null)
    setMilestoneDialogOpen(true)
  }

  const handleEditMilestone = (id: string) => {
    const ms = store.milestones.find((m) => m.id === id)
    if (ms) {
      setEditingMilestone(ms)
      setMilestoneDialogOpen(true)
    }
  }

  const handleSaveMilestone = (data: MilestoneFormData) => {
    if (editingMilestone) {
      store.updateMilestone(editingMilestone.id, data)
    } else {
      store.addMilestone(data)
    }
    setMilestoneDialogOpen(false)
  }

  const handleDeleteMilestone = () => {
    if (editingMilestone) {
      store.deleteMilestone(editingMilestone.id)
      setMilestoneDialogOpen(false)
    }
  }

  // ── Node handlers ──
  const handleAddNode = () => {
    setEditingNode(null)
    setNodeDialogOpen(true)
  }

  const handleEditNode = (id: string) => {
    const nd = store.nodes.find((n) => n.id === id)
    if (nd) {
      setEditingNode(nd)
      setNodeDialogOpen(true)
    }
  }

  const handleSaveNode = (data: NodeFormData) => {
    if (editingNode) {
      store.updateNode(editingNode.id, data)
    } else {
      store.addNode(data)
    }
    setNodeDialogOpen(false)
  }

  const handleDeleteNode = () => {
    if (editingNode) {
      store.deleteNode(editingNode.id)
      setNodeDialogOpen(false)
    }
  }

  // ── Template handler ──
  const handleApplyTemplate = (templateId: string) => {
    store.applyTemplate(templateId)
    setTemplateDialogOpen(false)
  }

  // ── Jira sync ──
  const handleSyncJira = async () => {
    if (!currentProjectKey) return
    setIsSyncing(true)
    try {
      const { milestones } = await syncJiraVersions(currentProjectKey, store.milestones)
      store.mergeSyncedMilestones(milestones)
    } catch {
      // Error handled by jiraClient
    } finally {
      setIsSyncing(false)
    }
  }

  // ── AI prompt builder ──
  const buildPrompt = useCallback(() => {
    const msInfo = store.milestones
      .map((m) => `- ${m.name} (${m.startDate} ~ ${m.endDate}) [${m.status}]`)
      .join('\n')
    const ndInfo = store.nodes
      .map((n) => `- ${n.name} (${n.date}) [${n.type}]`)
      .join('\n')
    return `请分析以下项目路线图的健康状况，给出风险提示和优化建议：\n\n里程碑：\n${msInfo || '无'}\n\n关键节点：\n${ndInfo || '无'}`
  }, [store.milestones, store.nodes])

  // ── Clear all with confirm ──
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const handleClearAll = () => {
    if (store.milestones.length === 0 && store.nodes.length === 0) return
    setShowClearConfirm(true)
  }

  // Get template display name
  const templateDisplayName = store.templateId
    ? (() => {
        const NAMES: Record<string, string> = {
          'agile-sprint': 'Agile Sprint',
          'quarterly': '季度规划',
          'product-launch': '产品发布',
          'custom-blank': '自定义',
        }
        return NAMES[store.templateId] ?? store.templateId
      })()
    : null

  // ── No project selected ──
  if (!currentProjectKey) {
    return (
      <div className={styles.page}>
        <div className={styles.noProject}>
          <div className={styles.noProjectIcon}>🗺️</div>
          <span>请先选择项目</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <AIInsight buildPrompt={buildPrompt} title="🗺️ 路线图健康分析" />

      <div className={styles.header}>
        <h1 className={styles.title}>{t('roadmap.title')}</h1>
        <Toolbar
          onAddMilestone={handleAddMilestone}
          onAddNode={handleAddNode}
          onSelectTemplate={() => setTemplateDialogOpen(true)}
          onSyncJira={handleSyncJira}
          onClearAll={handleClearAll}
          isSyncing={isSyncing}
          hasProject={!!currentProjectKey}
          hasData={store.milestones.length > 0 || store.nodes.length > 0}
          templateName={templateDisplayName}
        />
      </div>

      <TimelineView
        milestones={store.milestones}
        nodes={store.nodes}
        onEditMilestone={handleEditMilestone}
        onEditNode={handleEditNode}
      />

      <MilestoneDialog
        open={milestoneDialogOpen}
        milestone={editingMilestone}
        onSave={handleSaveMilestone}
        onDelete={editingMilestone ? handleDeleteMilestone : undefined}
        onClose={() => setMilestoneDialogOpen(false)}
      />

      <NodeDialog
        open={nodeDialogOpen}
        node={editingNode}
        onSave={handleSaveNode}
        onDelete={editingNode ? handleDeleteNode : undefined}
        onClose={() => setNodeDialogOpen(false)}
      />

      <TemplateDialog
        open={templateDialogOpen}
        onApply={handleApplyTemplate}
        onClose={() => setTemplateDialogOpen(false)}
        hasExistingData={store.milestones.length > 0 || store.nodes.length > 0}
      />

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <div className={styles.dialogOverlay} onClick={() => setShowClearConfirm(false)}>
          <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmDialog}>
              <p>确定清空所有路线图数据？此操作不可撤销。</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className={styles.btnSecondary} onClick={() => setShowClearConfirm(false)}>
                  取消
                </button>
                <button className={styles.btnDanger} onClick={() => { store.clearAll(); setShowClearConfirm(false) }}>
                  确定清空
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
