import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { EntityField } from './graph'

export interface EntityNodeData {
  label: string
  fields: EntityField[]
  highlighted: boolean
  dimmed: boolean
  [key: string]: unknown
}

export function EntityNode({ data }: NodeProps) {
  const { label, fields, highlighted, dimmed } = data as EntityNodeData

  const base =
    'rounded-lg border bg-card text-card-foreground shadow-sm min-w-[200px] font-mono text-xs transition-all duration-200'
  const tone = highlighted
    ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-md'
    : dimmed
      ? 'border-border opacity-40'
      : 'border-border'

  return (
    <div className={`${base} ${tone}`}>
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 0 }} />
      <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 0 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 0 }} />

      <div className={`px-3 py-2 border-b font-semibold text-sm ${highlighted ? 'bg-emerald-500/10' : 'bg-muted/50'}`}>
        {label}
      </div>
      <ul className="px-3 py-2 space-y-0.5">
        {fields.map((f) => (
          <li key={f.name} className="flex items-center gap-2">
            <span className="inline-block w-3 text-center text-muted-foreground">
              {f.pk ? '●' : f.fk ? '◆' : '○'}
            </span>
            <span className={f.pk ? 'font-semibold' : ''}>{f.name}</span>
            <span className="text-muted-foreground">: {f.type}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
