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

export interface PessimisticLockTimelineProps {
  mode?: 'bad' | 'fixed' | 'both'
  className?: string
}

const COLOR = {
  bad: '#f43f5e',
  badDim: '#fda4af',
  fixed: '#10b981',
  fixedDim: '#6ee7b7',
  wait: '#f59e0b',
  waitDim: '#fcd34d',
  release: '#38bdf8',
  neutral: '#64748b',
}

interface StepNodeData {
  index: number
  label: string
  lines: string[]
  accent: string
  icon?: string
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

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨']

function StepNode({ data }: NodeProps) {
  const { index, label, lines, accent, icon } = data as StepNodeData
  return (
    <div
      className="rounded-md border-2 bg-slate-900/85 backdrop-blur-sm px-3 py-2 shadow-md text-xs"
      style={{ borderColor: accent, minWidth: 170 }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 0 }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: 'transparent', border: 0 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'transparent', border: 0 }} />
      <div className="font-semibold flex items-center gap-1" style={{ color: accent }}>
        <span>{CIRCLED[index] ?? index + 1}</span>
        {icon ? <span>{icon}</span> : null}
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
      style={{ borderColor, minWidth: 150 }}
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

const LANE_Y = { T1: 40, T2: 220 } as const
const STEP_X_START = 140
const STEP_X_GAP = 210
const LANE_LABEL_X = 20

type StepInput = {
  id: string
  lane: 'T1' | 'T2'
  col: number
  label: string
  lines: string[]
  accent: string
  icon?: string
}

type ExtraEdgeInput = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  color: string
  label?: string
  dashed?: boolean
}

function buildGraph(
  steps: StepInput[],
  opts: {
    result: { id: string; tone: 'bad' | 'fixed'; title: string; lines: string[] }
    edgeColor?: string
    highlightEdges?: Record<string, string>
    extraEdges?: ExtraEdgeInput[]
    laneColor: { T1: string; T2: string }
  },
): { nodes: Node[]; edges: Edge[] } {
  const laneNodes: Node[] = [
    {
      id: 'lane-t1',
      type: 'laneLabel',
      position: { x: LANE_LABEL_X, y: LANE_Y.T1 + 12 },
      data: { label: 'T1', color: opts.laneColor.T1 } satisfies LaneLabelNodeData,
      draggable: false,
      selectable: false,
    },
    {
      id: 'lane-t2',
      type: 'laneLabel',
      position: { x: LANE_LABEL_X, y: LANE_Y.T2 + 12 },
      data: { label: 'T2', color: opts.laneColor.T2 } satisfies LaneLabelNodeData,
      draggable: false,
      selectable: false,
    },
  ]

  const stepNodes: Node[] = steps.map((s, idx) => ({
    id: s.id,
    type: 'step',
    position: { x: STEP_X_START + s.col * STEP_X_GAP, y: LANE_Y[s.lane] },
    data: {
      index: idx,
      label: s.label,
      lines: s.lines,
      accent: s.accent,
      icon: s.icon,
    } satisfies StepNodeData,
    draggable: false,
    selectable: false,
  }))

  const maxCol = steps.reduce((m, s) => Math.max(m, s.col), 0)
  const resultX = STEP_X_START + (maxCol + 1) * STEP_X_GAP
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
  if (opts.extraEdges) {
    for (const ex of opts.extraEdges) {
      edges.push({
        id: ex.id,
        source: ex.source,
        target: ex.target,
        sourceHandle: ex.sourceHandle,
        targetHandle: ex.targetHandle,
        type: 'smoothstep',
        animated: true,
        label: ex.label,
        labelStyle: { fill: ex.color, fontSize: 11, fontWeight: 600 },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        style: {
          stroke: ex.color,
          strokeWidth: 1.8,
          strokeDasharray: ex.dashed === false ? undefined : '4 3',
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: ex.color, width: 16, height: 16 },
      })
    }
  }
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
      { id: 'bad-1', lane: 'T1', col: 0, label: 'T1 SELECT', lines: ['stock → 100'], accent: COLOR.badDim },
      { id: 'bad-2', lane: 'T2', col: 1, label: 'T2 SELECT', lines: ['stock → 100'], accent: COLOR.badDim },
      { id: 'bad-3', lane: 'T1', col: 2, label: 'T1 UPDATE', lines: ['stock = 99 커밋'], accent: COLOR.bad },
      {
        id: 'bad-4',
        lane: 'T2',
        col: 3,
        label: 'T2 UPDATE',
        lines: ['stock = 99 커밋', 'T1 갱신 덮어씀'],
        accent: COLOR.bad,
      },
    ]
    return buildGraph(steps, {
      result: {
        id: 'bad-result',
        tone: 'bad',
        title: '최종 stock = 99',
        lines: ['2회 차감 의도', '→ 1회만 반영', 'Lost Update'],
      },
      edgeColor: COLOR.neutral,
      laneColor: { T1: COLOR.bad, T2: COLOR.bad },
    })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const steps: StepInput[] = [
      {
        id: 'fx-1',
        lane: 'T1',
        col: 0,
        label: 'T1 SELECT FOR UPDATE',
        lines: ['stock=100', 'X-lock 획득'],
        accent: COLOR.fixed,
        icon: '🔒',
      },
      {
        id: 'fx-2',
        lane: 'T2',
        col: 1,
        label: 'T2 SELECT FOR UPDATE',
        lines: ['T1 락 보유 중', 'DB가 블로킹'],
        accent: COLOR.wait,
        icon: '⏸',
      },
      {
        id: 'fx-3',
        lane: 'T1',
        col: 2,
        label: 'T1 UPDATE + COMMIT',
        lines: ['stock=99 커밋', '락 해제'],
        accent: COLOR.fixed,
      },
      {
        id: 'fx-4',
        lane: 'T2',
        col: 3,
        label: 'T2 대기 해제',
        lines: ['stock=99 읽음', 'X-lock 획득'],
        accent: COLOR.release,
        icon: '▶',
      },
      {
        id: 'fx-5',
        lane: 'T2',
        col: 4,
        label: 'T2 UPDATE + COMMIT',
        lines: ['stock=98 커밋', '락 해제'],
        accent: COLOR.fixed,
      },
    ]
    return buildGraph(steps, {
      result: {
        id: 'fx-result',
        tone: 'fixed',
        title: '최종 stock = 98',
        lines: ['재시도 없음', '예외 없음', '직렬화 처리'],
      },
      edgeColor: COLOR.neutral,
      highlightEdges: {
        'e-fx-1-fx-2': COLOR.wait,
        'e-fx-2-fx-3': COLOR.wait,
      },
      extraEdges: [
        {
          id: 'e-release-fx-3-fx-4',
          source: 'fx-3',
          target: 'fx-4',
          sourceHandle: 'bottom',
          targetHandle: 'top',
          color: COLOR.release,
          label: '락 해제 → T2 재개',
        },
      ],
      laneColor: { T1: COLOR.fixed, T2: COLOR.fixed },
    })
  }, [])
}

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

function BadPanel() {
  const { nodes, edges } = useBadGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.bad }}>
          BAD
        </span>
        <span className="ml-2 text-xs text-muted-foreground">
          락 없이 읽고-계산-쓰기 → Lost Update
        </span>
      </header>
      <TimelineFlow
        nodes={nodes}
        edges={edges}
        ariaLabel="BAD: 락 없이 동시 UPDATE 발생 시 Lost Update"
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
          SELECT ... FOR UPDATE — T2는 T1 커밋까지 대기 후 순차 실행
        </span>
      </header>
      <TimelineFlow
        nodes={nodes}
        edges={edges}
        ariaLabel="FIXED: SELECT FOR UPDATE로 T2가 T1 커밋까지 블로킹 대기 후 직렬화"
        height={320}
      />
    </section>
  )
}

export function PessimisticLockTimeline({ mode = 'both', className }: PessimisticLockTimelineProps) {
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

export default PessimisticLockTimeline
