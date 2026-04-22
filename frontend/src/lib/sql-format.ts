import { format as sqlFormat } from 'sql-formatter'

/**
 * Hibernate가 한 줄로 찍은 SQL을 MySQL 방언 기준으로 멀티라인 포매팅한다.
 *  - 키워드는 대문자(SELECT, FROM, WHERE…)
 *  - tabWidth 2, expressionWidth 60 → 적당한 줄 길이로 줄바꿈
 *  - 포매터가 실패하면(sql 문법이 깨져 있으면) 원문을 그대로 반환.
 */
export function beautifySql(raw: string): string {
  if (!raw || typeof raw !== 'string') return raw ?? ''
  try {
    return sqlFormat(raw, {
      language: 'mysql',
      keywordCase: 'upper',
      tabWidth: 2,
      expressionWidth: 60,
    })
  } catch {
    return raw
  }
}
