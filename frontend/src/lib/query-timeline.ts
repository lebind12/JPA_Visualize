import { TABLE_TO_ENTITY, findEdgeId, type EntityId } from '@/components/domain/graph'
import { extractTablesFromSql } from './sql-parser'

export interface TimelineEvent {
  index: number
  sql: string
  entityIds: EntityId[]
  edgeIds: string[]
}

/**
 * sqlLog 배열 전체를 타임라인으로 변환.
 * 각 SQL에서 건드린 테이블을 엔티티 ID로 매핑하고, 여러 엔티티가 등장하면
 * 그 사이의 관계 엣지 ID 목록도 함께 계산한다.
 */
export function buildTimeline(sqlLog: string[] | undefined | null): TimelineEvent[] {
  if (!sqlLog || sqlLog.length === 0) return []
  return sqlLog.map((sql, index) => {
    const tables = extractTablesFromSql(sql)
    const entityIds: EntityId[] = []
    for (const t of tables) {
      const id = TABLE_TO_ENTITY[t]
      if (id && !entityIds.includes(id)) entityIds.push(id)
    }
    const edgeIds: string[] = []
    for (let i = 0; i < entityIds.length; i++) {
      for (let j = i + 1; j < entityIds.length; j++) {
        const e = findEdgeId(entityIds[i], entityIds[j])
        if (e && !edgeIds.includes(e)) edgeIds.push(e)
      }
    }
    return { index, sql, entityIds, edgeIds }
  })
}
