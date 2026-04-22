import { useEffect, useMemo, useRef, useState } from 'react'
import { DomainDiagram } from '@/components/domain/domain-diagram'
import { buildTimeline, type TimelineEvent } from '@/lib/query-timeline'
import { beautifySql } from '@/lib/sql-format'
import { Button } from '@/components/ui/button'
import type { EntityId } from '@/components/domain/graph'

export interface QueryPlaybackProps {
  sqlLog: string[] | undefined | null
  label: string
  tone?: 'bad' | 'fixed' | 'neutral'
  /** 베이스라인 하이라이트 (시나리오가 건드리는 엔티티) */
  highlight?: EntityId[]
  height?: string
}

export function QueryPlayback({
  sqlLog,
  label,
  tone = 'neutral',
  highlight,
  height = '360px',
}: QueryPlaybackProps) {
  const timeline = useMemo<TimelineEvent[]>(() => buildTimeline(sqlLog), [sqlLog])
  const total = timeline.length

  const [playing, setPlaying] = useState(false)
  const [cursor, setCursor] = useState<number>(-1) // -1 = 아직 재생 안 함
  const [speed, setSpeed] = useState<number>(220) // ms per step (기본 220ms)
  const timerRef = useRef<number | null>(null)

  // 재생 루프
  useEffect(() => {
    if (!playing) return
    if (cursor >= total - 1) {
      setPlaying(false)
      return
    }
    timerRef.current = window.setTimeout(() => {
      setCursor((c) => c + 1)
    }, speed)
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [playing, cursor, total, speed])

  const currentEvent = cursor >= 0 && cursor < total ? timeline[cursor] : null
  const activeNodeIds = useMemo(
    () => new Set<string>(currentEvent?.entityIds ?? []),
    [currentEvent],
  )
  const activeEdgeIds = useMemo(
    () => new Set<string>(currentEvent?.edgeIds ?? []),
    [currentEvent],
  )

  const disabled = total === 0
  const finished = cursor >= total - 1 && !playing && cursor >= 0

  const handlePlay = () => {
    if (disabled) return
    if (finished) {
      // 재시작
      setCursor(-1)
      setPlaying(true)
      return
    }
    setPlaying(true)
  }
  const handlePause = () => setPlaying(false)
  const handleReset = () => {
    setPlaying(false)
    setCursor(-1)
  }

  const toneColor =
    tone === 'bad'
      ? 'text-rose-500'
      : tone === 'fixed'
        ? 'text-emerald-500'
        : 'text-foreground'

  const progress = total === 0 ? 0 : ((cursor + 1) / total) * 100

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <span className={`font-semibold text-sm ${toneColor}`}>{label}</span>
        <span className="text-xs font-mono text-muted-foreground">
          {disabled ? '결과 없음' : `${Math.max(cursor + 1, 0)} / ${total}`}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          {!playing ? (
            <Button size="sm" variant="outline" onClick={handlePlay} disabled={disabled}>
              {finished ? '↺ 재생' : cursor < 0 ? '▶ 재생' : '▶ 이어서'}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handlePause}>
              ⏸ 일시정지
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleReset} disabled={disabled || cursor < 0}>
            초기화
          </Button>
        </div>
      </header>

      <div className="px-4 py-2 border-b flex items-center gap-3 text-xs">
        <label className="text-muted-foreground shrink-0">속도</label>
        <input
          type="range"
          min={80}
          max={600}
          step={20}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="flex-1 max-w-xs"
          disabled={disabled}
        />
        <span className="font-mono text-muted-foreground w-12 text-right">{speed}ms</span>
      </div>

      <div className="h-1 w-full bg-muted">
        <div
          className={`h-full transition-[width] duration-150 ${
            tone === 'bad' ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-4 py-3 border-b bg-muted/10">
        <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
          현재 SQL {currentEvent ? `[${cursor + 1}/${total}]` : ''}
        </div>
        <pre
          className="font-mono text-xs leading-5 text-foreground/90 whitespace-pre overflow-auto rounded bg-muted/40 p-2"
          style={{ height: '4.25rem' }} /* 약 3 줄 (leading-5 = 20px × 3 + padding) */
        >
          {currentEvent
            ? beautifySql(currentEvent.sql)
            : disabled
              ? '실행 결과가 없습니다. Run 버튼으로 먼저 시나리오를 실행하세요.'
              : '재생을 시작하면 여기에 실행 중인 SQL이 표시됩니다.'}
        </pre>
      </div>

      <div className="p-3">
        <DomainDiagram
          highlight={highlight}
          activeNodeIds={activeNodeIds}
          activeEdgeIds={activeEdgeIds}
          height={height}
          fitView
        />
      </div>
    </section>
  )
}
