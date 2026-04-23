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

export interface SelfInvocationFlowProps {
  mode?: 'bad' | 'fixed' | 'both'
  className?: string
}

const COLOR = {
  bad: '#f43f5e',
  badDim: '#fda4af',
  fixed: '#10b981',
  fixedDim: '#6ee7b7',
  proxy: '#8b5cf6',
  proxyDim: '#c4b5fd',
  neutral: '#64748b',
  db: '#0ea5e9',
}

interface StageNodeData {
  index: number
  label: string
  lines: string[]
  accent: string
  icon?: string
  muted?: boolean
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
  const { index, label, lines, accent, icon, muted } = data as StageNodeData
  return (
    <div
      className="rounded-md border-2 bg-slate-900/85 backdrop-blur-sm px-3 py-2 shadow-md text-xs"
      style={{
        borderColor: accent,
        minWidth: 180,
        opacity: muted ? 0.45 : 1,
        borderStyle: muted ? 'dashed' : 'solid',
      }}
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

type StageInput = {
  id: string
  row: 'top' | 'mid' | 'bottom'
  col: number
  label: string
  lines: string[]
  accent: string
  icon?: string
  muted?: boolean
}

type EdgeInput = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  color: string
  label?: string
  dashed?: boolean
  animated?: boolean
}

const COL_X_START = 40
const COL_X_GAP = 230

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
      muted: s.muted,
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
      strokeDasharray: e.dashed === false ? undefined : '6 4',
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: e.color, width: 16, height: 16 },
  }))

  return {
    nodes: [...stageNodes, resultNode],
    edges,
  }
}

function useBadGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      {
        id: 'b-caller',
        row: 'mid',
        col: 0,
        label: 'runBad(orderId)',
        lines: ['@Transactional 없음'],
        accent: COLOR.neutral,
      },
      {
        id: 'b-proxy',
        row: 'top',
        col: 1,
        label: 'AOP 프록시',
        lines: ['this. 호출은', '여기를 건너뜀'],
        accent: COLOR.proxyDim,
        icon: '🚫',
        muted: true,
      },
      {
        id: 'b-inner',
        row: 'mid',
        col: 1,
        label: 'this.innerBad()',
        lines: ['@Transactional(REQUIRES_NEW)', '→ 미적용 (프록시 우회)'],
        accent: COLOR.bad,
      },
      {
        id: 'b-save',
        row: 'mid',
        col: 2,
        label: 'saveAndFlush(order)',
        lines: ['save의 자체 @Transactional', '짧은 TX 열고 UPDATE 커밋'],
        accent: COLOR.bad,
        icon: '💾',
      },
      {
        id: 'b-throw',
        row: 'mid',
        col: 3,
        label: 'throw',
        lines: ['IllegalStateException', '이미 커밋된 뒤'],
        accent: COLOR.bad,
        icon: '💥',
      },
    ]
    const edges: EdgeInput[] = [
      {
        id: 'b-caller-b-inner',
        source: 'b-caller',
        target: 'b-inner',
        color: COLOR.bad,
        label: '프록시 우회',
        animated: true,
      },
      {
        id: 'b-caller-b-proxy',
        source: 'b-caller',
        target: 'b-proxy',
        color: COLOR.proxyDim,
        label: '거치지 않음',
        animated: false,
        dashed: true,
      },
      {
        id: 'b-inner-b-save',
        source: 'b-inner',
        target: 'b-save',
        color: COLOR.bad,
      },
      {
        id: 'b-save-b-throw',
        source: 'b-save',
        target: 'b-throw',
        color: COLOR.bad,
      },
    ]
    return buildGraph(stages, {
      result: {
        id: 'b-result',
        tone: 'bad',
        col: 4,
        row: 'mid',
        title: 'DB: status = COMPLETED',
        lines: ['saveAndFlush의 짧은 TX가', '이미 커밋했으므로', '예외로도 되돌릴 수 없음'],
      },
      edges: [
        ...edges,
        {
          id: 'b-throw-b-result',
          source: 'b-throw',
          target: 'b-result',
          color: COLOR.bad,
          dashed: true,
        },
      ],
    })
  }, [])
}

function useFixedGraph() {
  return useMemo(() => {
    const stages: StageInput[] = [
      {
        id: 'f-caller',
        row: 'mid',
        col: 0,
        label: 'runFixed(orderId)',
        lines: ['self.innerFixed(...)', '또는 AopContext / 별도 빈'],
        accent: COLOR.neutral,
      },
      {
        id: 'f-proxy',
        row: 'mid',
        col: 1,
        label: 'AOP 프록시 경유',
        lines: ['@Transactional(REQUIRES_NEW)', '새 TX 시작'],
        accent: COLOR.proxy,
        icon: '🛡',
      },
      {
        id: 'f-inner',
        row: 'mid',
        col: 2,
        label: 'innerFixed()',
        lines: ['활성 TX 안에서 실행'],
        accent: COLOR.fixed,
      },
      {
        id: 'f-save',
        row: 'mid',
        col: 3,
        label: 'saveAndFlush(order)',
        lines: ['바깥 REQUIRES_NEW TX에', '합류해서 UPDATE 예약'],
        accent: COLOR.fixed,
        icon: '💾',
      },
      {
        id: 'f-throw',
        row: 'mid',
        col: 4,
        label: 'throw',
        lines: ['IllegalStateException', 'TX 어드바이스가 감지'],
        accent: COLOR.fixed,
        icon: '💥',
      },
    ]
    const edges: EdgeInput[] = [
      {
        id: 'f-caller-f-proxy',
        source: 'f-caller',
        target: 'f-proxy',
        color: COLOR.proxy,
        label: '프록시 경유',
      },
      {
        id: 'f-proxy-f-inner',
        source: 'f-proxy',
        target: 'f-inner',
        color: COLOR.fixed,
      },
      {
        id: 'f-inner-f-save',
        source: 'f-inner',
        target: 'f-save',
        color: COLOR.fixed,
      },
      {
        id: 'f-save-f-throw',
        source: 'f-save',
        target: 'f-throw',
        color: COLOR.fixed,
      },
    ]
    return buildGraph(stages, {
      result: {
        id: 'f-result',
        tone: 'fixed',
        col: 5,
        row: 'mid',
        title: 'DB: status = PENDING',
        lines: ['TX 어드바이스가 롤백', '합류돼 있던 UPDATE도 함께', '원복'],
      },
      edges: [
        ...edges,
        {
          id: 'f-throw-f-result',
          source: 'f-throw',
          target: 'f-result',
          color: COLOR.fixed,
          dashed: true,
        },
      ],
    })
  }, [])
}

function FlowCanvas({
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
          this.innerBad() — 프록시 우회, saveAndFlush의 짧은 TX가 단독 커밋
        </span>
      </header>
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        ariaLabel="BAD: this.innerBad() 호출이 AOP 프록시를 우회해 @Transactional(REQUIRES_NEW)이 적용되지 않음. saveAndFlush가 짧은 트랜잭션으로 단독 커밋 후 예외 발생."
        height={300}
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
          self.innerFixed() / AopContext / 별도 빈 — 프록시 경유로 REQUIRES_NEW 정상 적용
        </span>
      </header>
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        ariaLabel="FIXED: 프록시를 경유해 @Transactional(REQUIRES_NEW)이 적용되고, saveAndFlush 쓰기가 같은 트랜잭션에 합류한 뒤 예외 시 함께 롤백."
        height={260}
      />
    </section>
  )
}

export function SelfInvocationFlow({ mode = 'both', className }: SelfInvocationFlowProps) {
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

export default SelfInvocationFlow
