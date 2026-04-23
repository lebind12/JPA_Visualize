# JPA Visualize — Spring Data JPA 시나리오 커버리지 조사 보고서

> 작성일: 2026-04-23
> 기준 시점: Phase 5 완료 직후 (12개 시나리오 원격 반영, `0e3f3a2`까지)
> 참고 플랜: `/Users/woolee/.claude/plans/spring-goofy-iverson.md`

## 배경

Phase 5가 12개 시나리오로 완결된 시점에서, **현재 포트폴리오가 Spring Boot JPA 면접·실무에서 자주 다뤄지는 주제를 얼마나 커버하는지**를 한국/영어권 웹 소스 양쪽에서 조사했다. 다음 시나리오의 구현 방향(`/lab/concurrency` 본체 vs 신규 시나리오 추가 vs 병행)을 결정할 때 참고할 수 있도록 커버리지 매트릭스와 우선순위 Gap 리스트를 남겨둔다.

조사는 두 축으로 병렬 진행했다.

- **한국어 축**: OKKY · 디스콰이어트 · 기술 블로그(토스 · 카카오페이 · 우아한형제들 · 배민 · 네이버) · 면접 질문 GitHub 저장소
- **영어 축**: Vlad Mihalcea, Thorben Janssen, Baeldung, Spring Framework Reference, Hibernate User Guide, Stack Overflow 상위 질문

## 현재 구현된 12개 시나리오 (기준선)

| # | ID | 한 줄 |
|---|---|---|
| 5-1 | `nplus1.order-list` | LAZY 반복 → `@EntityGraph` + 2단계 조회 (41→2) |
| 5-2 | `nplus1.product-reviews` | `default_batch_fetch_size=100`으로 배치 IN (41→3) |
| 5-3 | `nplus1.paging-fetch` | 컬렉션 fetch join + Pageable → HHH000104 재현 (1→2) |
| 5-4 | `lock.optimistic-stock` | `@Version` + 재시도 루프 |
| 5-5 | `lock.pessimistic-stock` | `SELECT … FOR UPDATE` |
| 5-6 | `lock.deadlock` | 역순 획득 → min/max 정렬 |
| 5-7 | `tx.self-invocation` | `this.method()` 프록시 우회 (SELF_INJECT / AOP_CONTEXT / SEPARATE_BEAN 3전략) |
| 5-8 | `tx.read-only-vs-write` | `readOnly=true` → 스냅샷 미보관 + FlushMode.MANUAL |
| 5-9 | `tx.propagation` | REQUIRED vs REQUIRES_NEW (audit 독립 커밋) |
| 5-10 | `persistence.lazy-outside-tx` | TX 밖 LAZY → DTO 투영 |
| 5-11 | `persistence.dirty-vs-save` | `save(detached)` → `em.merge` 사전 SELECT vs Dirty Checking |
| 5-12 | `persistence.osiv-toggle` | OSIV on/off에 따른 동작 차이 |

## 면접 단골 주제 매트릭스 (A축)

범례: ✅ 완전 커버 · 🟡 부분 커버 (각도 일부) · ❌ 미커버

| 주제 | 상태 | 메모 |
|---|---|---|
| N+1 문제 (기본) | ✅ | 5-1, 5-2, 5-3 세 각도 |
| LazyInitializationException | ✅ | 5-10 정면 |
| OSIV 토글 | ✅ | 5-12 정면 |
| save() vs Dirty Checking (`em.merge`) | ✅ | 5-11 정면 |
| self-invocation 프록시 우회 | ✅ | 5-7, Fix 3전략까지 |
| `readOnly=true` 동작 | ✅ | 5-8 스냅샷 + FlushMode |
| 낙관적 락 `@Version` + 재시도 | ✅ | 5-4 |
| 비관적 락 `SELECT FOR UPDATE` | ✅ | 5-5 |
| 데드락 역순 획득 | ✅ | 5-6 |
| Propagation REQUIRED vs REQUIRES_NEW | ✅ | 5-9 |
| 영속성 컨텍스트 라이프사이클 · 1차 캐시 · 쓰기 지연 | 🟡 | 5-11에서 암묵적, 독립 시각화 없음 |
| `@EntityGraph` 동적 / `@NamedEntityGraph` | 🟡 | 5-1에서 정적 사용만 |
| FetchType LAZY vs EAGER (EAGER의 카르테시안 곱) | 🟡 | LAZY 문제만 다룸 |
| 벌크 JPQL Update/Delete + `@Modifying(clearAutomatically)` | ❌ | 면접·실무 공통 빈출 |
| 상속 매핑 (SINGLE_TABLE · JOINED · TABLE_PER_CLASS) | ❌ | 설계형 단골 |
| 복합키 (`@IdClass` vs `@EmbeddedId`) | ❌ | 레거시 마이그레이션 |
| `@Id` 생성 전략 (IDENTITY · SEQUENCE · UUID) + 배치 insert | ❌ | IDENTITY는 JDBC 배치 불가 |
| Cascade (PERSIST · REMOVE · ALL) + orphanRemoval | ❌ | 부모-자식 관계 설계 |
| Entity 동등성 — `equals/hashCode` on `@Id` IDENTITY | ❌ | Set 저장 시 계약 파괴 |
| 격리 수준 (`@Transactional(isolation=...)`) | ❌ | 트랜잭션 축에서 빠짐 |
| Nested `@Transactional(propagation=NESTED)`, MANDATORY | ❌ | 5-9에서 두 값만 |
| 2차 캐시 (L2) 함정 | ❌ | 심화 |

## 실무 빈발 이슈 매트릭스 (B축)

| 이슈 | 상태 | 메모 |
|---|---|---|
| 페이징 + 컬렉션 fetch join 메모리 폭탄 (HHH000104) | ✅ | 5-3 정면 |
| 데드락 (동시 쓰기 역순) | ✅ | 5-6 정면 |
| 낙관적 락 재시도 + audit 독립 커밋 | ✅ | 5-4 + 5-9 |
| `readOnly=true`의 의미 (쓰기 가드 · 스냅샷 절감) | ✅ | 5-8 정면 |
| OSIV + Jackson 직렬화 N+1 · `LazyInitializationException` | 🟡 | 5-10 / 5-12가 개념 커버, Jackson 연출 없음 |
| 장시간 트랜잭션 → row lock 유지 | 🟡 | 락 5-4~5-6 주변 맥락, 별도 시나리오 없음 |
| 낙관적 락 재시도 스톰 (exponential backoff) | 🟡 | 5-4는 단순 루프 |
| OSIV로 인한 Hikari 풀 고갈 | 🟡 | 5-12 개념만 |
| FK 인덱스 부재로 LAZY fetch 비용 폭증 | ❌ | N+1 3개에서 암묵적 전제 |
| 벌크 UPDATE/DELETE 후 1차 캐시 오염 | ❌ | 영속성 3개 중 누락 |
| 배치 insert: `jdbc.batch_size` + IDENTITY 불가 + `order_inserts` | ❌ | 대용량 포트폴리오 공란 |
| Stateless Session / 배치 처리 경로 | ❌ | 위와 세트 |
| `@DynamicUpdate` / `@DynamicInsert` | ❌ | 변경 컬럼만 UPDATE |
| MultipleBagFetchException | ❌ | `@OneToMany` 2개 동시 fetch join |
| `@Async` + `@Transactional` 경계 실종 | ❌ | 스레드 경계에서 TX 전파 안 됨 |
| Read replica 라우팅 + replica lag | ❌ | 마이크로서비스 스케일링 |
| Hibernate 6 / Spring Boot 3 마이그레이션 함정 | ❌ | UUID 전략 · OSIV 기본값 |
| 2차 캐시 무효화 / 디플로이 직후 cache miss flood | ❌ | 운영 스파이크 |

## 커버리지 종합

- **핵심 4축(N+1 · 락/동시성 · 트랜잭션 · 영속성 컨텍스트) "교과서적 코어"는 강하게 커버.** 특히 5-7 self-invocation의 Fix 3전략, 5-8 readOnly의 스냅샷 · FlushMode까지 파고든 것은 일반 포트폴리오 평균을 상회한다.
- **누락된 큰 축은 "매핑 · 스키마 · 배치" 계열.** 상속 매핑 · 복합키 · ID 전략 · Cascade는 면접 단골이지만 이 포트폴리오의 도메인(Member / Order / Product / OrderItem / Review / AuditLog) 구조상 자연스럽게 들어오지 않는다.
- **운영 스케일링 축도 공란.** `@Async` × `@Transactional`, read replica 라우팅, 배치 insert 튜닝, L2 캐시 같은 "대규모 서비스에서 마주치는" 패턴은 학습 포트폴리오보다는 실전 튜토리얼 범주여서 의도적으로 빠진 것으로 보이지만, 실무 인터뷰에서는 자주 나온다.
- **개략 커버리지 추정**: 면접 축 **≈ 50%** (코어 10개 ✅ + 부분 3개 / 주제 총 22개), 실무 축 **≈ 30–40%** (코어 4개 ✅ + 부분 4개 / 이슈 총 18개).

## Gap — 우선순위 Top 7 (추가 시 교육·포트폴리오 가치가 높은 순)

각 항목은 "기존 도메인(Member · Order · Product · OrderItem · Review · AuditLog)에서 구현 난이도"와 "면접/실무 공통 등장 빈도"를 교차해 선정했다.

1. **벌크 연산 캐시 오염** — `@Modifying` JPQL `UPDATE` 후 1차 캐시 불일치 → `clearAutomatically=true` / 명시 `em.clear()`로 해결. 면접·실무 공통, 도메인 추가 없이 `Order.status` 일괄 전환으로 시연 가능. **추천도 최상.**

2. **`@EntityGraph` 동적 그래프 + MultipleBagFetchException** — 5-1을 확장. 여러 `@OneToMany`를 동시 fetch join 시 터지는 `MultipleBagFetchException`을 재현하고, `Set` 변경 · 쿼리 분리 · `@BatchSize`로 해결. N+1 축 심화로 자연스럽다.

3. **ID 생성 전략과 배치 insert 성능 비교** — `IDENTITY`(JDBC batch 불가) vs `SEQUENCE` vs `TABLE` vs UUIDv7. `hibernate.jdbc.batch_size` + `order_inserts=true`와 결합해 동일 N건 insert의 쿼리 수 · 시간 비교. 포트폴리오의 "시각적 비교" 형식과 맞다.

4. **Jackson + LAZY 직렬화 N+1** — 5-10의 확장판. Controller가 엔티티를 그대로 반환 → Jackson 직렬화에서 각 연관 반복 접근 → N+1. Fix는 DTO 계약(5-10과 동일 결론). 5-10과 5-12 사이 "중간 사례"로 교육 연속성이 좋다.

5. **Cascade · orphanRemoval 차이** — `CascadeType.REMOVE` vs `orphanRemoval=true`: 부모 삭제 vs 컬렉션에서 제거 시 동작 차이. `Order` ↔ `OrderItem`에서 자연스럽다. 면접 단골.

6. **격리 수준 + Non-repeatable / Phantom Read** — `@Transactional(isolation=READ_COMMITTED)` vs `REPEATABLE_READ`에서 같은 SELECT 두 번의 결과 차이. MySQL InnoDB MVCC 기본 동작과 `SELECT … FOR UPDATE` 차이. 락 시리즈의 "상위 축"으로 자연 확장.

7. **`@Async` × `@Transactional` 경계 실종** — 비동기 메서드 안의 `@Transactional`이 호출 스레드 TX와 분리됨을 재현. 실무 함정이면서 propagation 이해의 연장. 기존 `AuditLog`로 재활용 가능.

## 추천 다음 스텝 (두 트랙 병행)

**A)** [/lab/concurrency](../../frontend/src/app/routes.tsx) 플레이스홀더 → 본체 (**락 3종 통합 비교 UI**). 신규 시나리오 없이 기존 5-4 / 5-5 / 5-6의 `useConcurrentRun` · `ConcurrentResult` · `ThreadSlider`를 한 화면에서 드롭다운으로 전환. 순수 프론트 작업이라 1개 사이클로 끝남.

**B)** **Gap Top 7 중 1개를 "Phase 6-1"로 착수.** 가장 추천은 (1) 벌크 연산 캐시 오염 — 백엔드 · 프론트 양면에 들어가지만, 도메인 추가가 없어 1사이클(= 기존 Phase 5 시나리오 1개와 동일 규모)로 수렴.

두 트랙은 독립적이라 **A 먼저 → 사용자 확인 → B 1개 순차**가 자연스럽다. 동시에 진행하면 프로젝트의 "시나리오 1개씩 end-to-end" 규칙에 부합하지 않는다.

## 미래 참조 시 체크 포인트

- **상태가 바뀌었을 수 있는 부분**: Phase 6 이후 시나리오가 추가되면 위 12개 기준선을 갱신해야 한다. `frontend/src/content/scenarios/`의 MDX 개수와 `/api/demo/scenarios` 응답으로 현재 상태를 먼저 확인.
- **플레이스홀더 현황**: `/lab/concurrency`가 실제 본체로 대체되었는지 `frontend/src/app/routes.tsx`의 `ConcurrencyPlaceholder` 존재 여부로 판별.
- **링크 스팟체크**: Vlad Mihalcea · Baeldung · 카카오페이 블로그 글은 URL 구조가 바뀔 수 있다. 인용 시 `WebFetch`로 확인 후 사용.

## 참고 자료

### 한국어 축

- 카카오페이 — [JPA Transactional 잘 알고 쓰고 계신가요?](https://tech.kakaopay.com/post/jpa-transactional-bri/)
- 우아한형제들 — [Legacy DB의 JPA Entity Mapping (복합키 편)](https://woowabros.github.io/experience/2019/01/04/composit-key-jpa.html)
- cheese10yun — [JPA Fetch Join 페이징 이슈](https://cheese10yun.github.io/jpa-fetch-paging/)
- [GitHub: 백엔드 면접 질문 모음 (ksundong)](https://github.com/ksundong/backend-interview-question)

### 영어 축

- Thorben Janssen — [6 Performance Pitfalls when using Spring Data JPA](https://thorben-janssen.com/6-performance-pitfalls-when-using-spring-data-jpa/)
- Vlad Mihalcea — [HHH000104 fix](https://vladmihalcea.com/fix-hibernate-hhh000104-entity-fetch-pagination-warning-message/), [MultipleBagFetchException fix](https://vladmihalcea.com/hibernate-multiplebagfetchexception/), [Read-write / read-only routing](https://vladmihalcea.com/read-write-read-only-transaction-routing-spring/), [Batch JDBC](https://vladmihalcea.com/how-to-batch-insert-and-update-statements-with-hibernate/)
- Baeldung — [CascadeType.REMOVE vs orphanRemoval](https://www.baeldung.com/jpa-cascade-remove-vs-orphanremoval), [Open Session In View](https://www.baeldung.com/spring-open-session-in-view)
- Spring Framework Reference — [Transaction Management](https://docs.spring.io/spring-framework/reference/data-access/transaction/)
