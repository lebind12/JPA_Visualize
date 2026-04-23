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

export interface DirtyVsSaveFlowProps {
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
      { id: 'b-load', row: 'top', col: 0, label: '별도 TX readOnly', lines: ['loadDetached() 반환', '→ detached 인스턴스'], accent: COLOR.badDim, icon: '📤' },
      { id: 'b-enter', row: 'top', col: 1, label: '@Transactional 진입', lines: ['runBad(detached)'], accent: COLOR.neutral, icon: '🟢' },
      { id: 'b-rename', row: 'top', col: 2, label: 'detached.renameTo(...)', lines: ['영속 컨텍스트 무관', '필드만 변경'], accent: COLOR.badDim, icon: '✏️' },
      { id: 'b-save', row: 'top', col: 3, label: 'repository.save(detached)', lines: ['isNew=false → em.merge'], accent: COLOR.bad, icon: '🔀' },
      { id: 'b-merge-sel', row: 'bottom', col: 3, label: 'em.merge 내부 SELECT', lines: ['동일 id 재로드', 'managed 복제본 생성'], accent: COLOR.bad, icon: '🔍' },
      { id: 'b-update', row: 'top', col: 4, label: '커밋: UPDATE 발행', lines: ['복제본 기준 dirty'], accent: COLOR.bad, icon: '💾' },
    ]
    const edges: EdgeInput[] = [
      { id: 'be-1', source: 'b-load', target: 'b-enter', color: COLOR.bad },
      { id: 'be-2', source: 'b-enter', target: 'b-rename', color: COLOR.bad },
      { id: 'be-3', source: 'b-rename', target: 'b-save', color: COLOR.bad },
      { id: 'be-4', source: 'b-save', target: 'b-merge-sel', sourceHandle: 'bottom', targetHandle: 'top', color: COLOR.bad, label: 'em.merge 사전 로드' },
      { id: 'be-5', source: 'b-merge-sel', target: 'b-update', sourceHandle: 'bottom', targetHandle: 'bottom', color: COLOR.bad, dasharray: '4 3', label: '복제본 기준 flush' },
      { id: 'be-6', source: 'b-update', target: 'b-result', color: COLOR.bad, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'b-result', tone: 'bad', col: 5, row: 'top', title: 'SELECT + UPDATE', lines: ['mergeReturnedDifferentInstance = true', 'sqlLog에 SELECT 추가'] },
      edges,
    })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      { id: 'f-enter', row: 'top', col: 0, label: '@Transactional 진입', lines: ['runFixed(memberId)'], accent: COLOR.fixedDim, icon: '🟢' },
      { id: 'f-find', row: 'top', col: 1, label: 'findById(memberId)', lines: ['SELECT members', 'managed 상태'], accent: COLOR.fixed, icon: '🔍' },
      { id: 'f-rename', row: 'top', col: 2, label: 'managed.renameTo(...)', lines: ['세션 내 name 변경', 'save() 호출 없음'], accent: COLOR.fixed, icon: '✏️' },
      { id: 'f-dirty', row: 'bottom', col: 2, label: 'dirty checking', lines: ['스냅샷 vs 현재 비교'], accent: COLOR.fixed, icon: '🧭' },
      { id: 'f-update', row: 'top', col: 3, label: '커밋: UPDATE 발행', lines: ['자동 flush'], accent: COLOR.fixed, icon: '💾' },
    ]
    const edges: EdgeInput[] = [
      { id: 'fe-1', source: 'f-enter', target: 'f-find', color: COLOR.fixed },
      { id: 'fe-2', source: 'f-find', target: 'f-rename', color: COLOR.fixed },
      { id: 'fe-3', source: 'f-rename', target: 'f-dirty', sourceHandle: 'bottom', targetHandle: 'top', color: COLOR.proxy, label: '커밋 직전 비교' },
      { id: 'fe-4', source: 'f-dirty', target: 'f-update', sourceHandle: 'bottom', targetHandle: 'bottom', color: COLOR.proxy, dasharray: '4 3' },
      { id: 'fe-5', source: 'f-update', target: 'f-result', color: COLOR.fixed, dasharray: '2 3', animated: false },
    ]
    return buildGraph(stages, {
      result: { id: 'f-result', tone: 'fixed', col: 4, row: 'top', title: 'SELECT + UPDATE 2건', lines: ['saveCalled = false', 'em.merge 미경로'] },
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
        <span className="ml-2 text-xs text-muted-foreground">detached + save() → em.merge → 사전 SELECT</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="BAD: detached 엔티티에 save()를 호출하면 em.merge 경로를 타고 사전 SELECT가 발행된다." height={300} />
    </section>
  )
}

function FixedPanel() {
  const { nodes, edges } = useFixedGraph()
  return (
    <section className="flex flex-col gap-2">
      <header>
        <span className="text-sm font-bold" style={{ color: COLOR.fixed }}>FIXED</span>
        <span className="ml-2 text-xs text-muted-foreground">findById → dirty checking으로 UPDATE 자동 발행</span>
      </header>
      <FlowCanvas nodes={nodes} edges={edges} ariaLabel="FIXED: findById로 managed 엔티티를 조회한 뒤 필드만 변경하면 dirty checking이 UPDATE를 자동 발행한다." height={260} />
    </section>
  )
}

export function DirtyVsSaveFlow({ mode = 'both', className }: DirtyVsSaveFlowProps) {
  if (mode === 'bad') return <div className={className ?? ''}><BadPanel /></div>
  if (mode === 'fixed') return <div className={className ?? ''}><FixedPanel /></div>
  return (
    <div className={`flex flex-col gap-6 ${className ?? ''}`}>
      <BadPanel />
      <FixedPanel />
    </div>
  )
}

export default DirtyVsSaveFlow
