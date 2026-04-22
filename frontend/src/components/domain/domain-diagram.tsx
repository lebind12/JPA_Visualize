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

const nodeTypes = { entity: EntityNode }

export interface DomainDiagramProps {
  highlight?: EntityId[]
  height?: string
  fitView?: boolean
}

export function DomainDiagram({ highlight, height = '520px', fitView = true }: DomainDiagramProps) {
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
        },
        draggable: true,
      })),
    [highlightSet, hasHighlight],
  )

  const edges = useMemo<Edge[]>(
    () =>
      RELATIONS.map((rel) => {
        const isHighlighted =
          hasHighlight && highlightSet.has(rel.source) && highlightSet.has(rel.target)
        const isDimmed = hasHighlight && !isHighlighted
        return {
          id: rel.id,
          source: rel.source,
          target: rel.target,
          label: rel.label,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: isHighlighted ? '#10b981' : isDimmed ? '#94a3b8' : '#64748b',
          },
          style: {
            stroke: isHighlighted ? '#10b981' : isDimmed ? '#cbd5e1' : '#64748b',
            strokeWidth: isHighlighted ? 2.5 : 1.5,
            opacity: isDimmed ? 0.35 : 1,
          },
          labelStyle: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 11,
            fill: isHighlighted ? '#059669' : '#475569',
          },
          labelBgPadding: [6, 3] as [number, number],
          labelBgStyle: {
            fill: 'var(--color-background, #ffffff)',
            opacity: 0.9,
          },
        } satisfies Edge
      }),
    [highlightSet, hasHighlight],
  )

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg border bg-background/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
