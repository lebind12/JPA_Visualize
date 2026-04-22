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

export interface DeadlockTimelineProps {
  mode?: 'bad' | 'fixed' | 'both'
  className?: string
}

const COLOR = {
  bad: '#f43f5e',
  fixed: '#10b981',
  wait: '#f59e0b',
  release: '#38bdf8',
  neutral: '#64748b',
  victim: '#ef4444',
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
      {
        id: 'bad-1',
        lane: 'T1',
        col: 0,
        label: 'T1: SELECT A FOR UPDATE',
        lines: ['A.X-lock 획득'],
        accent: COLOR.bad,
        icon: '🔒',
      },
      {
        id: 'bad-2',
        lane: 'T2',
        col: 1,
        label: 'T2: SELECT B FOR UPDATE',
        lines: ['B.X-lock 획득'],
        accent: COLOR.bad,
        icon: '🔒',
      },
      {
        id: 'bad-3',
        lane: 'T1',
        col: 2,
        label: 'T1: SELECT B FOR UPDATE',
        lines: ['B는 T2 점유', '대기 ⏸'],
        accent: COLOR.wait,
        icon: '⏸',
      },
      {
        id: 'bad-4',
        lane: 'T2',
        col: 3,
        label: 'T2: SELECT A FOR UPDATE',
        lines: ['A는 T1 점유', '대기 ⏸'],
        accent: COLOR.wait,
        icon: '⏸',
      },
      {
        id: 'bad-5',
        lane: 'T2',
        col: 4,
        label: 'InnoDB 감지 → T2 rollback',
        lines: ['deadlock 감지', 'victim 선정'],
        accent: COLOR.victim,
        icon: '💥',
      },
      {
        id: 'bad-6',
        lane: 'T1',
        col: 5,
        label: 'T1 commit',
        lines: ['A,B 차감 완료'],
        accent: COLOR.fixed,
      },
    ]
    return buildGraph(steps, {
      result: {
        id: 'bad-result',
        tone: 'bad',
        title: 'T2 rollback, T1만 성공',
        lines: ['데드락 1건', '결국 부분 실패', '재시도 정책 필요'],
      },
      edgeColor: COLOR.neutral,
      extraEdges: [
        {
          id: 'e-cycle-bad3-bad2',
          source: 'bad-3',
          target: 'bad-2',
          color: COLOR.wait,
          label: 'B 대기 (T2 보유)',
        },
        {
          id: 'e-cycle-bad4-bad1',
          source: 'bad-4',
          target: 'bad-1',
          color: COLOR.wait,
          label: 'A 대기 (T1 보유)',
        },
      ],
      laneColor: { T1: COLOR.bad, T2: COLOR.bad },
    })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const steps: StepInput[] = [
      {
        id: 'fixed-1',
        lane: 'T1',
        col: 0,
        label: 'T1: SELECT A FOR UPDATE',
        lines: ['A.X-lock 획득'],
        accent: COLOR.fixed,
        icon: '🔒',
      },
      {
        id: 'fixed-2',
        lane: 'T2',
        col: 1,
        label: 'T2: SELECT A FOR UPDATE',
        lines: ['T1 점유', '대기 ⏸'],
        accent: COLOR.wait,
        icon: '⏸',
      },
      {
        id: 'fixed-3',
        lane: 'T1',
        col: 2,
        label: 'T1: SELECT B FOR UPDATE',
        lines: ['B.X-lock 획득'],
        accent: COLOR.fixed,
        icon: '🔒',
      },
      {
        id: 'fixed-4',
        lane: 'T1',
        col: 3,
        label: 'T1 commit',
        lines: ['A,B 차감 완료', '락 해제'],
        accent: COLOR.fixed,
      },
      {
        id: 'fixed-5',
        lane: 'T2',
        col: 4,
        label: 'T2: SELECT A FOR UPDATE 재개',
        lines: ['락 획득'],
        accent: COLOR.release,
        icon: '▶',
      },
      {
        id: 'fixed-6',
        lane: 'T2',
        col: 5,
        label: 'T2: SELECT B + commit',
        lines: ['A,B 차감 완료'],
        accent: COLOR.fixed,
      },
    ]
    return buildGraph(steps, {
      result: {
        id: 'fixed-result',
        tone: 'fixed',
        title: 'T1, T2 순차 성공',
        lines: ['데드락 0건', '전원 성공', '재시도 불필요'],
      },
      edgeColor: COLOR.neutral,
      highlightEdges: {
        'e-fixed-1-fixed-2': COLOR.wait,
        'e-fixed-2-fixed-3': COLOR.wait,
      },
      extraEdges: [
        {
          id: 'e-release-fixed-4-fixed-5',
          source: 'fixed-4',
          target: 'fixed-5',
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
          역순 락 획득 → cycle → InnoDB가 victim 롤백
        </span>
      </header>
      <TimelineFlow
        nodes={nodes}
        edges={edges}
        ariaLabel="BAD: 역순 락 획득으로 cycle 발생 시 InnoDB deadlock 감지 후 victim 롤백"
        height={320}
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
          id 오름차순 획득 → cycle 불가 → 대기 후 순차 실행
        </span>
      </header>
      <TimelineFlow
        nodes={nodes}
        edges={edges}
        ariaLabel="FIXED: id 오름차순 락 획득으로 cycle 원천 차단 후 순차 성공"
        height={320}
      />
    </section>
  )
}

export function DeadlockTimeline({ mode = 'both', className }: DeadlockTimelineProps) {
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

export default DeadlockTimeline
