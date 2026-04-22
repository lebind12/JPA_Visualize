import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

export interface PulseEdgeData {
  active?: boolean;
  [key: string]: unknown;
}

/**
 * react-flow 커스텀 엣지.
 *  - 평상시: 기본 smoothstep 스타일(label 포함)
 *  - data.active가 true면 해당 path 위로 초록 패킷(circle + animateMotion)이 순환 이동.
 */
export function PulseEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    label,
    markerEnd,
    style,
  } = props;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const active = Boolean((data as PulseEdgeData | undefined)?.active);

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {active && (
        // <circle r={5} fill="#10b981" opacity={0.95}>
        //   <animateMotion dur="0.6s" path={edgePath} repeatCount="indefinite" />
        // </circle>
        <g>
          {/* halo — 뒤에 깔리는 흐릿한 큰 원 */}
          <circle r={14} fill="#10b981" opacity={0.25}>
            <animateMotion
              dur="0.6s"
              path={edgePath}
              repeatCount="indefinite"
            />
          </circle>
          {/* core — 선명한 중심 */}
          <circle r={7} fill="#10b981" opacity={1}>
            <animateMotion
              dur="0.6s"
              path={edgePath}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
            }}
            className="rounded border bg-background/90 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
