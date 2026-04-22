import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export interface OptimisticLockTimelineProps {
  mode?: 'bad' | 'fixed' | 'both'
  className?: string
}

const COLOR = {
  bad: '#f43f5e',
  badDim: '#fda4af',
  fixed: '#10b981',
  fixedDim: '#6ee7b7',
  conflict: '#f59e0b',
  conflictDim: '#fcd34d',
  neutral: '#64748b',
  laneLabel: '#cbd5e1',
}

// ── 커스텀 노드 데이터 타입 ─────────────────────────────────────────────

interface StepNodeData {
  index: number
  label: string
  lines: string[]
  accent: string
  [key: string]: unknown
}

interface LaneLabelNodeData {
  label: string
  color: string
  [key: string]: unknown
}

interface ResultNodeData {
  tone: 'bad' | 'fixed'
  title: string
  lines: string[]
  [key: string]: unknown
}

// ── 커스텀 노드 컴포넌트 ───────────────────────────────────────────────

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨']

function StepNode({ data }: NodeProps) {
  const { index, label, lines, accent } = data as StepNodeData
  return (
    <div
      className="rounded-md border-2 bg-slate-900/85 backdrop-blur-sm px-3 py-2 shadow-md text-xs"
      style={{ borderColor: accent, minWidth: 160 }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 0 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 0 }} />
      <div className="font-semibold flex items-center gap-1" style={{ color: accent }}>
        <span>{CIRCLED[index] ?? index + 1}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1 space-y-0.5 text-[11px] text-slate-300">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  )
}

function LaneLabelNode({ data }: NodeProps) {
  const { label, color } = data as LaneLabelNodeData
  return (
    <div className="text-sm font-bold tracking-wider" style={{ color }}>
      {label}
      <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 0 }} />
    </div>
  )
}

function ResultNode({ data }: NodeProps) {
  const { tone, title, lines } = data as ResultNodeData
  const isBad = tone === 'bad'
  const bg = isBad ? 'bg-rose-500/15' : 'bg-emerald-500/15'
  const borderColor = isBad ? COLOR.bad : COLOR.fixed
  const titleColor = isBad ? COLOR.bad : COLOR.fixed
  return (
    <div
      className={`rounded-md border-2 px-3 py-2 text-xs shadow-md ${bg}`}
      style={{ borderColor, minWidth: 140 }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 0 }} />
      <div className="font-bold" style={{ color: titleColor }}>
        {title}
      </div>
      <div className="mt-1 space-y-0.5 text-[11px] text-slate-300">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  step: StepNode,
  laneLabel: LaneLabelNode,
  result: ResultNode,
}

// ── 공통 레이아웃 상수 ──────────────────────────────────────────────────

const LANE_Y = { T1: 40, T2: 220 } as const
const STEP_X_START = 140
const STEP_X_GAP = 200
const LANE_LABEL_X = 20

// ── 그래프 빌더 ────────────────────────────────────────────────────────

type StepInput = {
  id: string
  lane: 'T1' | 'T2'
  label: string
  lines: string[]
  accent: string
}

function stepsToGraph(
  steps: StepInput[],
  opts: {
    result: { id: string; tone: 'bad' | 'fixed'; title: string; lines: string[] }
    edgeColor?: string
    highlightEdges?: Record<string, string> // edge id → stroke color
  },
): { nodes: Node[]; edges: Edge[] } {
  const laneT1Color = opts.result.tone === 'bad' ? COLOR.bad : COLOR.fixed
  const laneT2Color = opts.result.tone === 'bad' ? COLOR.bad : COLOR.fixed

  const laneNodes: Node[] = [
    {
      id: 'lane-t1',
      type: 'laneLabel',
      position: { x: LANE_LABEL_X, y: LANE_Y.T1 + 12 },
      data: { label: 'T1', color: laneT1Color } satisfies LaneLabelNodeData,
      draggable: false,
      selectable: false,
    },
    {
      id: 'lane-t2',
      type: 'laneLabel',
      position: { x: LANE_LABEL_X, y: LANE_Y.T2 + 12 },
      data: { label: 'T2', color: laneT2Color } satisfies LaneLabelNodeData,
      draggable: false,
      selectable: false,
    },
  ]

  const stepNodes: Node[] = steps.map((s, idx) => ({
    id: s.id,
    type: 'step',
    position: { x: STEP_X_START + idx * STEP_X_GAP, y: LANE_Y[s.lane] },
    data: {
      index: idx,
      label: s.label,
      lines: s.lines,
      accent: s.accent,
    } satisfies StepNodeData,
    draggable: false,
    selectable: false,
  }))

  const resultX = STEP_X_START + steps.length * STEP_X_GAP
  const resultNode: Node = {
    id: opts.result.id,
    type: 'result',
    position: { x: resultX, y: (LANE_Y.T1 + LANE_Y.T2) / 2 + 10 },
    data: {
      tone: opts.result.tone,
      title: opts.result.title,
      lines: opts.result.lines,
    } satisfies ResultNodeData,
    draggable: false,
    selectable: false,
  }

  const defaultEdgeColor = opts.edgeColor ?? COLOR.neutral
  const edges: Edge[] = []
  for (let i = 0; i < steps.length - 1; i++) {
    const edgeId = `e-${steps[i].id}-${steps[i + 1].id}`
    const stroke = opts.highlightEdges?.[edgeId] ?? defaultEdgeColor
    edges.push({
      id: edgeId,
      source: steps[i].id,
      target: steps[i + 1].id,
      type: 'smoothstep',
      animated: true,
      style: { stroke, strokeWidth: 1.6, strokeDasharray: '6 4' },
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
    })
  }
  // 마지막 스텝 → 결과
  if (steps.length > 0) {
    const lastId = steps[steps.length - 1].id
    edges.push({
      id: `e-${lastId}-${opts.result.id}`,
      source: lastId,
      target: opts.result.id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: defaultEdgeColor, strokeWidth: 1.6, strokeDasharray: '2 3' },
      markerEnd: { type: MarkerType.ArrowClosed, color: defaultEdgeColor, width: 14, height: 14 },
    })
  }

  return {
    nodes: [...laneNodes, ...stepNodes, resultNode],
    edges,
  }
}

function useBadGraph() {
  return useMemo(() => {
    const steps: StepInput[] = [
      { id: 'bad-1', lane: 'T1', label: 'T1 SELECT', lines: ['stock → 10'], accent: COLOR.badDim },
      { id: 'bad-2', lane: 'T2', label: 'T2 SELECT', lines: ['stock → 10'], accent: COLOR.badDim },
      { id: 'bad-3', lane: 'T1', label: 'T1 UPDATE', lines: ['stock = 10 − 1 = 9', '커밋 성공'], accent: COLOR.bad },
      { id: 'bad-4', lane: 'T2', label: 'T2 UPDATE', lines: ['stock = 10 − 1 = 9', 'T1 갱신 덮어씀', '커밋 성공'], accent: COLOR.bad },
    ]
    return stepsToGraph(steps, {
      result: {
        id: 'bad-result',
        tone: 'bad',
        title: '최종 stock = 9',
        lines: ['2회 차감 의도', '→ 1회만 반영', 'Lost Update'],
      },
      edgeColor: COLOR.neutral,
    })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const steps: StepInput[] = [
      { id: 'fx-1', lane: 'T1', label: 'T1 SELECT', lines: ['stock=10, version=0'], accent: COLOR.fixedDim },
      { id: 'fx-2', lane: 'T2', label: 'T2 SELECT', lines: ['stock=10, version=0'], accent: COLOR.fixedDim },
      { id: 'fx-3', lane: 'T1', label: 'T1 UPDATE', lines: ['WHERE version=0', '→ 1 row', 'version 0→1 커밋'], accent: COLOR.fixed },
      { id: 'fx-4', lane: 'T2', label: 'T2 UPDATE', lines: ['WHERE version=0', '→ 0 rows', '충돌 감지 (예외)'], accent: COLOR.conflict },
      { id: 'fx-5', lane: 'T2', label: 'T2 재조회', lines: ['stock=9, version=1'], accent: COLOR.fixedDim },
      { id: 'fx-6', lane: 'T2', label: 'T2 재시도', lines: ['WHERE version=1', '→ 1 row', 'version 1→2 커밋'], accent: COLOR.fixed },
    ]
    return stepsToGraph(steps, {
      result: {
        id: 'fx-result',
        tone: 'fixed',
        title: '최종 stock = 8',
        lines: ['version = 2', '정합성 유지'],
      },
      edgeColor: COLOR.neutral,
      highlightEdges: {
        'e-fx-3-fx-4': COLOR.conflict,
        'e-fx-4-fx-5': COLOR.conflict,
      },
    })
  }, [])
}

// ── ReactFlow 래퍼 ─────────────────────────────────────────────────────

function TimelineFlow({
  nodes,
  edges,
  ariaLabel,
  height,
}: {
  nodes: Node[]
  edges: Edge[]
  ariaLabel: string
  height: number
}) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{ height, width: '100%' }}
      className="rounded-lg border bg-background/40"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        preventScrolling={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
      </ReactFlow>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────

function BadPanel() {
  const { nodes, edges } = useBadGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.bad }}>
          BAD
        </span>
        <span className="ml-2 text-xs text-muted-foreground">
          @Version 없음 — 동시 UPDATE → Lost Update
        </span>
      </header>
      <TimelineFlow
        nodes={nodes}
        edges={edges}
        ariaLabel="BAD: 낙관적 락 없이 동시 UPDATE 발생 시 Lost Update"
        height={260}
      />
    </section>
  )
}

function FixedPanel() {
  const { nodes, edges } = useFixedGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.fixed }}>
          FIXED
        </span>
        <span className="ml-2 text-xs text-muted-foreground">
          @Version — 충돌 감지 후 재시도로 정합성 유지
        </span>
      </header>
      <TimelineFlow
        nodes={nodes}
        edges={edges}
        ariaLabel="FIXED: @Version으로 충돌 감지 후 재시도"
        height={300}
      />
    </section>
  )
}

export function OptimisticLockTimeline({ mode = 'both', className }: OptimisticLockTimelineProps) {
  if (mode === 'bad') {
    return (
      <div className={className}>
        <BadPanel />
      </div>
    )
  }
  if (mode === 'fixed') {
    return (
      <div className={className}>
        <FixedPanel />
      </div>
    )
  }
  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <BadPanel />
      <FixedPanel />
    </div>
  )
}

export default OptimisticLockTimeline
