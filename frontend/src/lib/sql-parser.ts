/**
 * Hibernate가 생성한 SQL에서 건드린 테이블 이름을 순서대로 추출한다.
 * 같은 쿼리에서 FROM + JOIN + UPDATE ... 등이 섞여 있어도 전부 수집 (중복 제거).
 *
 * 지원 패턴:
 *   - from <table>
 *   - join <table> (left/right/inner 포함)
 *   - update <table>
 *   - insert into <table>
 *   - delete from <table>
 * 테이블 이름 뒤의 별칭(`o1_0`, `as p`)은 건너뛴다.
 */
export function extractTablesFromSql(sql: string): string[] {
  if (!sql) return []
  const normalized = sql.replace(/\s+/g, ' ').toLowerCase()
  const found: string[] = []
  const push = (name: string) => {
    const clean = name.replace(/["`]/g, '')
    if (clean && !found.includes(clean)) found.push(clean)
  }

  // from / join / update / delete from / insert into
  const patterns: RegExp[] = [
    /\bfrom\s+([a-z_][a-z0-9_]*)/gi,
    /\bjoin\s+([a-z_][a-z0-9_]*)/gi,
    /\bupdate\s+([a-z_][a-z0-9_]*)/gi,
    /\binsert\s+into\s+([a-z_][a-z0-9_]*)/gi,
    /\bdelete\s+from\s+([a-z_][a-z0-9_]*)/gi,
  ]

  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(normalized)) !== null) {
      push(m[1])
    }
  }
  return found
}
