import { useMemo } from 'react'
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { ENTITIES, RELATIONS, type EntityId } from './graph'
import { EntityNode, type EntityNodeData } from './entity-node'
import { PulseEdge } from './pulse-edge'

const nodeTypes = { entity: EntityNode }
const edgeTypes = { pulse: PulseEdge }

export interface DomainDiagramProps {
  /** 기본 하이라이트 (시나리오별 관심 엔티티). 없으면 전부 평상 톤. */
  highlight?: EntityId[]
  /** 애니메이션 재생 시 현재 프레임에서 "펄스"할 노드 ID 집합. highlight와 별개. */
  activeNodeIds?: ReadonlySet<string>
  /** 애니메이션 재생 시 "패킷"이 흐를 엣지 ID 집합. */
  activeEdgeIds?: ReadonlySet<string>
  height?: string
  fitView?: boolean
}

export function DomainDiagram({
  highlight,
  activeNodeIds,
  activeEdgeIds,
  height = '520px',
  fitView = true,
}: DomainDiagramProps) {
  const highlightSet = useMemo(() => new Set(highlight ?? []), [highlight])
  const hasHighlight = highlightSet.size > 0

  const nodes = useMemo<Node<EntityNodeData>[]>(
    () =>
      ENTITIES.map((entity) => ({
        id: entity.id,
        type: 'entity',
        position: entity.position,
        data: {
          label: entity.label,
          fields: entity.fields,
          highlighted: hasHighlight && highlightSet.has(entity.id),
          dimmed: hasHighlight && !highlightSet.has(entity.id),
          active: activeNodeIds?.has(entity.id) ?? false,
        },
        draggable: true,
      })),
    [highlightSet, hasHighlight, activeNodeIds],
  )

  const edges = useMemo<Edge[]>(
    () =>
      RELATIONS.map((rel) => {
        const isActive = activeEdgeIds?.has(rel.id) ?? false
        const isHighlighted =
          hasHighlight && highlightSet.has(rel.source) && highlightSet.has(rel.target)
        const isDimmed = hasHighlight && !isHighlighted && !isActive
        const strokeColor = isActive
          ? '#10b981'
          : isHighlighted
            ? '#10b981'
            : isDimmed
              ? '#cbd5e1'
              : '#64748b'
        return {
          id: rel.id,
          source: rel.source,
          target: rel.target,
          label: rel.label,
          type: 'pulse',
          data: { active: isActive },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: strokeColor,
          },
          style: {
            stroke: strokeColor,
            strokeWidth: isActive ? 2.5 : isHighlighted ? 2.5 : 1.5,
            opacity: isDimmed ? 0.35 : 1,
          },
        } satisfies Edge
      }),
    [highlightSet, hasHighlight, activeEdgeIds],
  )

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg border bg-background/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={fitView}
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
