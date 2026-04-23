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

export interface ReadOnlyVsWriteFlowProps {
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
    data: {
      index: idx,
      label: s.label,
      lines: s.lines,
      accent: s.accent,
      icon: s.icon,
    } satisfies StageNodeData,
    draggable: false,
    selectable: false,
  }))

  const resultNode: Node = {
    id: opts.result.id,
    type: 'result',
    position: { x: COL_X_START + opts.result.col * COL_X_GAP, y: ROW_Y[opts.result.row] },
    data: {
      tone: opts.result.tone,
      title: opts.result.title,
      lines: opts.result.lines,
    } satisfies ResultNodeData,
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
    style: {
      stroke: e.color,
      strokeWidth: 1.8,
      strokeDasharray: e.dasharray ?? '6 4',
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: e.color, width: 16, height: 16 },
  }))

  return { nodes: [...stageNodes, resultNode], edges }
}

function useBadGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      { id: 'b-tx', row: 'mid', col: 0, label: 'TX 시작', lines: ['@Transactional (readOnly=false)', 'FlushMode.AUTO'], accent: COLOR.neutral, icon: '🟢' },
      { id: 'b-load', row: 'mid', col: 1, label: 'findById(memberId)', lines: ['SELECT members', '스냅샷 뜸'], accent: COLOR.badDim, icon: '📸' },
      { id: 'b-mutate', row: 'mid', col: 2, label: 'renameTo(...)', lines: ['세션 내 name 변경', '스냅샷과 diff 발생'], accent: COLOR.bad, icon: '✏️' },
      { id: 'b-flush', row: 'mid', col: 3, label: '커밋 직전 flush', lines: ['dirty checking', '→ UPDATE 발행'], accent: COLOR.bad, icon: '💾' },
    ]
    const edges: EdgeInput[] = [
      { id: 'b-e1', source: 'b-tx', target: 'b-load', color: COLOR.bad },
      { id: 'b-e2', source: 'b-load', target: 'b-mutate', color: COLOR.bad },
      { id: 'b-e3', source: 'b-mutate', target: 'b-flush', color: COLOR.bad },
      { id: 'b-e4', source: 'b-flush', target: 'b-result', color: COLOR.bad, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'b-result', tone: 'bad', col: 4, row: 'mid', title: 'DB name = "원본 (oops-BAD)"', lines: ['SELECT + UPDATE 2건', 'sqlLog에 UPDATE 존재'] },
      edges,
    })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      { id: 'f-tx', row: 'mid', col: 0, label: 'TX 시작', lines: ['@Transactional(readOnly=true)', 'FlushMode.MANUAL'], accent: COLOR.neutral, icon: '🟢' },
      { id: 'f-load', row: 'mid', col: 1, label: 'findById(memberId)', lines: ['SELECT members', '스냅샷 미보관'], accent: COLOR.fixedDim, icon: '🛡' },
      { id: 'f-mutate', row: 'mid', col: 2, label: 'renameTo(...)', lines: ['세션 내 name 변경', '비교 기준 없음'], accent: COLOR.warn, icon: '✏️' },
      { id: 'f-flush', row: 'mid', col: 3, label: '커밋 직전', lines: ['dirty checking 대상 0', 'UPDATE 발행 없음'], accent: COLOR.fixed, icon: '✅' },
    ]
    const edges: EdgeInput[] = [
      { id: 'f-e1', source: 'f-tx', target: 'f-load', color: COLOR.fixed },
      { id: 'f-e2', source: 'f-load', target: 'f-mutate', color: COLOR.fixed },
      { id: 'f-e3', source: 'f-mutate', target: 'f-flush', color: COLOR.fixed },
      { id: 'f-e4', source: 'f-flush', target: 'f-result', color: COLOR.fixed, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'f-result', tone: 'fixed', col: 4, row: 'mid', title: 'DB name = "원본" 유지', lines: ['SELECT 1건만', 'UPDATE 없음'] },
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
        <span className="ml-2 text-xs text-muted-foreground">@Transactional, 스냅샷 보관 → dirty checking 발동</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="BAD: @Transactional 기본값으로 스냅샷이 보관되어 커밋 직전 dirty checking이 UPDATE를 발행한다." height={260} />
    </section>
  )
}

function FixedPanel() {
  const { nodes, edges } = useFixedGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.fixed }}>FIXED</span>
        <span className="ml-2 text-xs text-muted-foreground">@Transactional(readOnly=true), 스냅샷 미보관 + FlushMode.MANUAL</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="FIXED: readOnly=true로 스냅샷을 뜨지 않고 FlushMode.MANUAL로 전환되어 UPDATE가 발행되지 않는다." height={260} />
    </section>
  )
}

export function ReadOnlyVsWriteFlow({ mode = 'both', className }: ReadOnlyVsWriteFlowProps) {
  if (mode === 'bad') return <div className={className ?? ''}><BadPanel /></div>
  if (mode === 'fixed') return <div className={className ?? ''}><FixedPanel /></div>
  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <BadPanel />
      <FixedPanel />
    </div>
  )
}

export default ReadOnlyVsWriteFlow
