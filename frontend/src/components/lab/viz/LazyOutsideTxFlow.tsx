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

export interface LazyOutsideTxFlowProps {
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

function useBadGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      { id: 'b-req', row: 'top', col: 0, label: 'HTTP 요청', lines: ['GET …?variant=BAD'], accent: COLOR.neutral, icon: '🌐' },
      { id: 'b-tx-open', row: 'top', col: 1, label: 'TX 시작 (@Transactional)', lines: ['세션 열림'], accent: COLOR.badDim, icon: '🟢' },
      { id: 'b-select', row: 'top', col: 2, label: 'SELECT orders', lines: ['Order 로드', 'items = LAZY proxy', 'member = LAZY proxy'], accent: COLOR.badDim, icon: '📦' },
      { id: 'b-tx-close', row: 'top', col: 3, label: 'TX 종료', lines: ['세션 닫힘', '엔티티 detached'], accent: COLOR.bad, icon: '🔒' },
      { id: 'b-access', row: 'mid', col: 3, label: 'order.getItems().size()', lines: ['TX 밖 프록시 접근'], accent: COLOR.bad, icon: '⚠️' },
      { id: 'b-boom', row: 'mid', col: 4, label: 'LazyInitializationException', lines: ['no Session'], accent: COLOR.victim, icon: '💥' },
    ]
    const edges: EdgeInput[] = [
      { id: 'be-1', source: 'b-req', target: 'b-tx-open', color: COLOR.bad },
      { id: 'be-2', source: 'b-tx-open', target: 'b-select', color: COLOR.bad },
      { id: 'be-3', source: 'b-select', target: 'b-tx-close', color: COLOR.bad },
      { id: 'be-4', source: 'b-tx-close', target: 'b-access', sourceHandle: 'bottom', targetHandle: 'top', color: COLOR.bad, label: '엔티티 반환 후 접근' },
      { id: 'be-5', source: 'b-access', target: 'b-boom', color: COLOR.bad },
      { id: 'be-6', source: 'b-boom', target: 'b-result', color: COLOR.bad, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'b-result', tone: 'bad', col: 5, row: 'mid', title: '예외 발생', lines: ['exceptionCaught != null', 'itemsSize = -1 (미관측)'] },
      edges,
    })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      { id: 'f-req', row: 'top', col: 0, label: 'HTTP 요청', lines: ['GET …?variant=FIXED'], accent: COLOR.neutral, icon: '🌐' },
      { id: 'f-tx-open', row: 'top', col: 1, label: 'TX 시작 (@Transactional readOnly)', lines: ['세션 열림'], accent: COLOR.fixedDim, icon: '🟢' },
      { id: 'f-head', row: 'top', col: 2, label: 'findSummaryHeadById', lines: ['JPQL new …OrderSummaryHead(…)', '프록시 없음'], accent: COLOR.fixed, icon: '🧾' },
      { id: 'f-items', row: 'top', col: 3, label: 'findItemSummariesByOrderId', lines: ['JPQL new …OrderItemSummaryDto(…)', '프록시 없음'], accent: COLOR.fixed, icon: '🧾' },
      { id: 'f-assemble', row: 'top', col: 4, label: 'OrderSummaryDto 조립', lines: ['순수 Java 객체'], accent: COLOR.fixed, icon: '📦' },
      { id: 'f-tx-close', row: 'top', col: 5, label: 'TX 종료', lines: ['세션 닫힘', 'DTO만 살아남음'], accent: COLOR.fixedDim, icon: '🔒' },
      { id: 'f-serialize', row: 'mid', col: 5, label: 'JSON 직렬화', lines: ['프록시 없음', '예외 없음'], accent: COLOR.fixed, icon: '✅' },
    ]
    const edges: EdgeInput[] = [
      { id: 'fe-1', source: 'f-req', target: 'f-tx-open', color: COLOR.fixed },
      { id: 'fe-2', source: 'f-tx-open', target: 'f-head', color: COLOR.fixed },
      { id: 'fe-3', source: 'f-head', target: 'f-items', color: COLOR.fixed },
      { id: 'fe-4', source: 'f-items', target: 'f-assemble', color: COLOR.fixed },
      { id: 'fe-5', source: 'f-assemble', target: 'f-tx-close', color: COLOR.fixed },
      { id: 'fe-6', source: 'f-tx-close', target: 'f-serialize', sourceHandle: 'bottom', targetHandle: 'top', color: COLOR.fixed, label: 'DTO만 반환' },
      { id: 'fe-7', source: 'f-serialize', target: 'f-result', color: COLOR.fixed, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'f-result', tone: 'fixed', col: 6, row: 'mid', title: '정상 응답', lines: ['itemsSize = N', 'exception 없음'] },
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

function BadPanel() {
  const { nodes, edges } = useBadGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.bad }}>BAD</span>
        <span className="ml-2 text-xs text-muted-foreground">엔티티 반환, TX 밖 LAZY 접근 → LazyInitializationException</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="BAD: 트랜잭션 종료 후 엔티티를 반환하고 LAZY 프록시에 접근하면 LazyInitializationException이 발생한다." height={300} />
    </section>
  )
}

function FixedPanel() {
  const { nodes, edges } = useFixedGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.fixed }}>FIXED</span>
        <span className="ml-2 text-xs text-muted-foreground">DTO 투영 반환, 세션 독립</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="FIXED: TX 안에서 DTO로 투영하여 반환하면 세션 밖에서도 안전하게 직렬화할 수 있다." height={300} />
    </section>
  )
}

export function LazyOutsideTxFlow({ mode = 'both', className }: LazyOutsideTxFlowProps) {
  if (mode === 'bad') return <div className={className ?? ''}><BadPanel /></div>
  if (mode === 'fixed') return <div className={className ?? ''}><FixedPanel /></div>
  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <BadPanel />
      <FixedPanel />
    </div>
  )
}

export default LazyOutsideTxFlow
