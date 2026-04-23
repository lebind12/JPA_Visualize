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

export interface PropagationFlowProps {
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
  warn: '#fb923c',
  proxy: '#8b5cf6',
  proxyDim: '#c4b5fd',
  neutral: '#64748b',
  release: '#38bdf8',
  db: '#0ea5e9',
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
      <Handle type="target" position={Position.Top} id="top" style={{ background: 'transparent', border: 0 }} />
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

type EdgeInput = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  color: string
  label?: string
  dasharray?: string
  animated?: boolean
}

function buildLaneGraph(
  steps: StepInput[],
  edges: EdgeInput[],
  result: { id: string; tone: 'bad' | 'fixed'; title: string; lines: string[]; col: number },
  laneColor: { T1: string; T2: string },
): { nodes: Node[]; edges: Edge[] } {
  const stepNodes: Node[] = steps.map((s, idx) => ({
    id: s.id,
    type: 'step',
    position: { x: STEP_X_START + s.col * STEP_X_GAP, y: LANE_Y[s.lane] },
    data: { index: idx, label: s.label, lines: s.lines, accent: s.accent, icon: s.icon } satisfies StepNodeData,
    draggable: false,
    selectable: false,
  }))

  const laneLabels: Node[] = [
    { id: 'lane-t1', type: 'laneLabel', position: { x: LANE_LABEL_X, y: LANE_Y.T1 + 8 }, data: { label: 'T1 (outer)', color: laneColor.T1 } satisfies LaneLabelNodeData, draggable: false, selectable: false },
    { id: 'lane-t2', type: 'laneLabel', position: { x: LANE_LABEL_X, y: LANE_Y.T2 + 8 }, data: { label: 'T2 (inner)', color: laneColor.T2 } satisfies LaneLabelNodeData, draggable: false, selectable: false },
  ]

  const resultNode: Node = {
    id: result.id,
    type: 'result',
    position: { x: STEP_X_START + result.col * STEP_X_GAP, y: LANE_Y.T1 },
    data: { tone: result.tone, title: result.title, lines: result.lines } satisfies ResultNodeData,
    draggable: false,
    selectable: false,
  }

  const builtEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'smoothstep',
    animated: e.animated ?? true,
    label: e.label,
    labelStyle: { fill: e.color, fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    style: { stroke: e.color, strokeWidth: 1.8, strokeDasharray: e.dasharray ?? '6 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: e.color, width: 16, height: 16 },
  }))

  return { nodes: [...laneLabels, ...stepNodes, resultNode], edges: builtEdges }
}

function useBadGraph() {
  return useMemo(() => {
    const steps: StepInput[] = [
      { id: 'b-1', lane: 'T1', col: 0, label: 'T1 시작', lines: ['runBad() 진입', '@Transactional'], accent: COLOR.badDim, icon: '🟢' },
      { id: 'b-2', lane: 'T1', col: 1, label: 'writeAuditRequired', lines: ['Propagation.REQUIRED', 'T1에 합류'], accent: COLOR.bad, icon: '🔗' },
      { id: 'b-3', lane: 'T1', col: 2, label: 'INSERT audit_logs', lines: ['T1 내 쓰기 예약', 'flush만, 커밋 전'], accent: COLOR.bad, icon: '💾' },
      { id: 'b-4', lane: 'T1', col: 3, label: 'IllegalStateException', lines: ['runBad 본체에서 throw'], accent: COLOR.victim, icon: '💥' },
      { id: 'b-5', lane: 'T1', col: 4, label: 'T1 rollback', lines: ['합류된 insert', '함께 사라짐'], accent: COLOR.bad, icon: '↩️' },
    ]
    const edges: EdgeInput[] = [
      { id: 'be-1', source: 'b-1', target: 'b-2', color: COLOR.bad },
      { id: 'be-2', source: 'b-2', target: 'b-3', color: COLOR.bad },
      { id: 'be-3', source: 'b-3', target: 'b-4', color: COLOR.bad },
      { id: 'be-4', source: 'b-4', target: 'b-5', color: COLOR.bad },
      { id: 'be-5', source: 'b-5', target: 'b-result', color: COLOR.bad, dasharray: '2 3', animated: false },
    ]
    return buildLaneGraph(steps, edges, { id: 'b-result', tone: 'bad', col: 5, title: 'audit_logs count = 0', lines: ['insert 2회 발행', 'rollback으로 전부 소실'] }, { T1: COLOR.bad, T2: COLOR.neutral })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const steps: StepInput[] = [
      { id: 'f-1', lane: 'T1', col: 0, label: 'T1 시작', lines: ['runFixed() 진입'], accent: COLOR.fixedDim, icon: '🟢' },
      { id: 'f-2', lane: 'T1', col: 1, label: 'writeAuditRequiresNew 호출', lines: ['T1 suspend'], accent: COLOR.proxy, icon: '⏸' },
      { id: 'f-3', lane: 'T2', col: 2, label: 'T2 시작', lines: ['Propagation.REQUIRES_NEW', '새 커넥션'], accent: COLOR.fixed, icon: '🟢' },
      { id: 'f-4', lane: 'T2', col: 3, label: 'INSERT audit_logs + commit', lines: ['T2 단독 커밋', 'row 확정'], accent: COLOR.fixed, icon: '✅' },
      { id: 'f-5', lane: 'T1', col: 4, label: 'T1 재개', lines: ['resume outer TX'], accent: COLOR.fixedDim, icon: '▶' },
      { id: 'f-6', lane: 'T1', col: 5, label: 'IllegalStateException', lines: ['runFixed 본체에서 throw'], accent: COLOR.victim, icon: '💥' },
      { id: 'f-7', lane: 'T1', col: 6, label: 'T1 rollback', lines: ['T1만 롤백', 'T2는 무관'], accent: COLOR.warn, icon: '↩️' },
    ]
    const edges: EdgeInput[] = [
      { id: 'fe-1', source: 'f-1', target: 'f-2', color: COLOR.fixed },
      { id: 'fe-2', source: 'f-2', target: 'f-3', sourceHandle: 'bottom', targetHandle: 'top', color: COLOR.proxy, label: 'T1 suspend' },
      { id: 'fe-3', source: 'f-3', target: 'f-4', color: COLOR.fixed },
      { id: 'fe-4', source: 'f-4', target: 'f-5', sourceHandle: 'bottom', targetHandle: 'top', color: COLOR.proxy, label: 'T1 resume' },
      { id: 'fe-5', source: 'f-5', target: 'f-6', color: COLOR.fixed },
      { id: 'fe-6', source: 'f-6', target: 'f-7', color: COLOR.warn },
      { id: 'fe-7', source: 'f-7', target: 'f-result', color: COLOR.fixed, dasharray: '2 3', animated: false },
    ]
    return buildLaneGraph(steps, edges, { id: 'f-result', tone: 'fixed', col: 7, title: 'audit_logs count = 1', lines: ['T2 commit 선행', 'T1 rollback과 독립'] }, { T1: COLOR.fixed, T2: COLOR.fixed })
  }, [])
}

function FlowCanvas({ nodes, edges, ariaLabel, height }: { nodes: Node[]; edges: Edge[]; ariaLabel: string; height: number }) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ height, width: '100%' }} className="rounded-lg border bg-background/40">
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
        <span className="text-sm font-bold" style={{ color: COLOR.bad }}>BAD</span>
        <span className="ml-2 text-xs text-muted-foreground">REQUIRED, 외부 TX 합류 → 함께 롤백</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="BAD: REQUIRED 전파로 외부 트랜잭션에 합류하여 외부 롤백 시 audit_logs insert도 함께 사라진다." height={260} />
    </section>
  )
}

function FixedPanel() {
  const { nodes, edges } = useFixedGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.fixed }}>FIXED</span>
        <span className="ml-2 text-xs text-muted-foreground">REQUIRES_NEW, 독립 TX로 감사 로그 커밋 보존</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="FIXED: REQUIRES_NEW로 독립 트랜잭션을 열어 audit_logs를 선 커밋한 뒤, 외부 TX 롤백과 무관하게 row가 보존된다." height={320} />
    </section>
  )
}

export function PropagationFlow({ mode = 'both', className }: PropagationFlowProps) {
  if (mode === 'bad') return <div className={className ?? ''}><BadPanel /></div>
  if (mode === 'fixed') return <div className={className ?? ''}><FixedPanel /></div>
  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <BadPanel />
      <FixedPanel />
    </div>
  )
}

export default PropagationFlow
