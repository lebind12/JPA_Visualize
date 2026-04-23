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

export interface OsivToggleFlowProps {
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

interface StageNodeData {
  index: number
  label: string
  lines: string[]
  accent: string
  icon?: string
  [key: string]: unknown
}

interface ResultNodeData {
  tone: 'bad' | 'fixed'
  title: string
  lines: string[]
  [key: string]: unknown
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧']

function StageNode({ data }: NodeProps) {
  const { index, label, lines, accent, icon } = data as StageNodeData
  return (
    <div
      className="rounded-md border-2 bg-slate-900/85 backdrop-blur-sm px-3 py-2 shadow-md text-xs"
      style={{ borderColor: accent, minWidth: 180 }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 0 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 0 }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: 'transparent', border: 0 }} />
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

function ResultNode({ data }: NodeProps) {
  const { tone, title, lines } = data as ResultNodeData
  const isBad = tone === 'bad'
  const bg = isBad ? 'bg-rose-500/15' : 'bg-emerald-500/15'
  const borderColor = isBad ? COLOR.bad : COLOR.fixed
  const titleColor = isBad ? COLOR.bad : COLOR.fixed
  return (
    <div
      className={`rounded-md border-2 px-3 py-2 text-xs shadow-md ${bg}`}
      style={{ borderColor, minWidth: 170 }}
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
  stage: StageNode,
  result: ResultNode,
}

const ROW_Y = { top: 40, mid: 150, bottom: 260 } as const
const COL_X_START = 40
const COL_X_GAP = 230

type StageInput = {
  id: string
  row: 'top' | 'mid' | 'bottom'
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

function buildGraph(
  stages: StageInput[],
  opts: {
    result: { id: string; tone: 'bad' | 'fixed'; title: string; lines: string[]; col: number; row: 'top' | 'mid' | 'bottom' }
    edges: EdgeInput[]
  },
): { nodes: Node[]; edges: Edge[] } {
  const stageNodes: Node[] = stages.map((s, idx) => ({
    id: s.id,
    type: 'stage',
    position: { x: COL_X_START + s.col * COL_X_GAP, y: ROW_Y[s.row] },
    data: { index: idx, label: s.label, lines: s.lines, accent: s.accent, icon: s.icon } satisfies StageNodeData,
    draggable: false,
    selectable: false,
  }))

  const resultNode: Node = {
    id: opts.result.id,
    type: 'result',
    position: { x: COL_X_START + opts.result.col * COL_X_GAP, y: ROW_Y[opts.result.row] },
    data: { tone: opts.result.tone, title: opts.result.title, lines: opts.result.lines } satisfies ResultNodeData,
    draggable: false,
    selectable: false,
  }

  const edges: Edge[] = opts.edges.map((e) => ({
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

  return { nodes: [...stageNodes, resultNode], edges }
}

function useOsivFalseGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      { id: 'ba-tx', row: 'mid', col: 0, label: 'TX 시작/종료', lines: ['loadOrdersInTx', 'Order 리스트 로드'], accent: COLOR.badDim, icon: '🟢' },
      { id: 'ba-close', row: 'mid', col: 1, label: '세션 닫힘', lines: ['OSIV=false'], accent: COLOR.bad, icon: '🔒' },
      { id: 'ba-loop', row: 'mid', col: 2, label: 'for 루프 첫 반복', lines: ['order.getMember().getName()'], accent: COLOR.bad, icon: '🔁' },
      { id: 'ba-boom', row: 'mid', col: 3, label: 'LazyInitializationException', lines: ['첫 반복에서 즉시'], accent: COLOR.victim, icon: '💥' },
    ]
    const edges: EdgeInput[] = [
      { id: 'ba-e1', source: 'ba-tx', target: 'ba-close', color: COLOR.bad },
      { id: 'ba-e2', source: 'ba-close', target: 'ba-loop', color: COLOR.bad },
      { id: 'ba-e3', source: 'ba-loop', target: 'ba-boom', color: COLOR.bad },
      { id: 'ba-e4', source: 'ba-boom', target: 'ba-result', color: COLOR.bad, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'ba-result', tone: 'bad', col: 4, row: 'mid', title: 'exceptionCaught != null', lines: ['queryCount = 적음', 'touchedCount = 0'] },
      edges,
    })
  }, [])
}

function useOsivTrueGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      { id: 'bb-tx', row: 'mid', col: 0, label: 'TX 시작/종료', lines: ['loadOrdersInTx', 'Order 리스트 로드'], accent: COLOR.fixedDim, icon: '🟢' },
      { id: 'bb-keep', row: 'mid', col: 1, label: '세션 유지', lines: ['OSIV=true', '요청 끝까지 alive'], accent: COLOR.warn, icon: '🔓' },
      { id: 'bb-loop', row: 'mid', col: 2, label: 'for 루프 N회 반복', lines: ['매 반복 member SELECT', '매 반복 items SELECT'], accent: COLOR.warn, icon: '🔁' },
      { id: 'bb-n1', row: 'mid', col: 3, label: 'N+1 폭증', lines: ['limit=5 → 10+ 쿼리'], accent: COLOR.warn, icon: '📈' },
    ]
    const edges: EdgeInput[] = [
      { id: 'bb-e1', source: 'bb-tx', target: 'bb-keep', color: COLOR.warn },
      { id: 'bb-e2', source: 'bb-keep', target: 'bb-loop', color: COLOR.warn },
      { id: 'bb-e3', source: 'bb-loop', target: 'bb-n1', color: COLOR.warn },
      { id: 'bb-e4', source: 'bb-n1', target: 'bb-result', color: COLOR.warn, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'bb-result', tone: 'bad', col: 4, row: 'mid', title: '예외 없음, 쿼리 폭증', lines: ['queryCount ≥ 10', 'touchedCount = limit'] },
      edges,
    })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      { id: 'fx-tx', row: 'mid', col: 0, label: '@Transactional readOnly', lines: ['id 리스트 조회'], accent: COLOR.fixedDim, icon: '🟢' },
      { id: 'fx-dto', row: 'mid', col: 1, label: 'DTO 투영 루프', lines: ['findSummaryHeadById', 'findItemSummariesByOrderId'], accent: COLOR.fixed, icon: '🧾' },
      { id: 'fx-assemble', row: 'mid', col: 2, label: 'OrderSummaryDto 조립', lines: ['순수 Java 객체'], accent: COLOR.fixed, icon: '📦' },
      { id: 'fx-return', row: 'mid', col: 3, label: 'TX 종료', lines: ['DTO만 반환', 'OSIV 무관'], accent: COLOR.fixed, icon: '✅' },
    ]
    const edges: EdgeInput[] = [
      { id: 'fx-e1', source: 'fx-tx', target: 'fx-dto', color: COLOR.fixed },
      { id: 'fx-e2', source: 'fx-dto', target: 'fx-assemble', color: COLOR.fixed },
      { id: 'fx-e3', source: 'fx-assemble', target: 'fx-return', color: COLOR.fixed },
      { id: 'fx-e4', source: 'fx-return', target: 'fx-result', color: COLOR.fixed, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'fx-result', tone: 'fixed', col: 4, row: 'mid', title: 'OSIV=false / true 동일 응답', lines: ['queryCount 고정', 'exception 없음'] },
      edges,
    })
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

function OsivFalsePanel() {
  const { nodes, edges } = useOsivFalseGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.bad }}>BAD</span>
        <span className="ml-2 text-xs text-muted-foreground">OSIV=false, TX 밖 LAZY 접근 → LazyInitializationException</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="BAD OSIV=false: 트랜잭션 종료 후 세션이 닫혀 첫 LAZY 접근 시 LazyInitializationException이 발생한다." height={260} />
    </section>
  )
}

function OsivTruePanel() {
  const { nodes, edges } = useOsivTrueGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.warn }}>BAD</span>
        <span className="ml-2 text-xs text-muted-foreground">OSIV=true, 세션 유지 → N+1 폭증</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="BAD OSIV=true: 세션이 요청 끝까지 유지되어 예외는 없지만 매 반복마다 개별 SELECT가 발행되어 N+1 쿼리가 폭증한다." height={260} />
    </section>
  )
}

function FixedPanel() {
  const { nodes, edges } = useFixedGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.fixed }}>FIXED</span>
        <span className="ml-2 text-xs text-muted-foreground">DTO 투영, OSIV 설정과 무관</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="FIXED: DTO 투영으로 조립하여 반환하면 OSIV 설정과 무관하게 예외와 N+1 모두 없는 일관된 응답을 반환한다." height={260} />
    </section>
  )
}

export function OsivToggleFlow({ mode = 'both', className }: OsivToggleFlowProps) {
  if (mode === 'bad') {
    return (
      <div className={`flex flex-col gap-6 ${className ?? ''}`}>
        <OsivFalsePanel />
        <OsivTruePanel />
      </div>
    )
  }
  if (mode === 'fixed') {
    return (
      <div className={className ?? ''}>
        <FixedPanel />
      </div>
    )
  }
  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <OsivFalsePanel />
      <OsivTruePanel />
      <FixedPanel />
    </div>
  )
}

export default OsivToggleFlow
