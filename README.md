# JPA Portfolio — 쿼리 병목·함정 시각화

Spring Data JPA로 작성한 쿼리의 **실행시간·쿼리 수·실제 SQL**을 React에서 시각화해,
"어떤 상황에서 왜 느려지는가 / 실패하는가, 어떻게 고치는가"를 한눈에 비교해 주는 풀스택 포트폴리오.

도메인은 **E-commerce**(Member · Category · Product · Order · OrderItem · Review).

---

## Quick Start

### 전제조건

| 도구   | 권장 버전 | 확인                                          |
| ------ | --------- | --------------------------------------------- |
| JDK    | 21+       | `java -version`                               |
| Node   | 20+       | `node -v`                                     |
| Docker | 최신      | `docker --version` · `docker compose version` |

> **포트 사전 확인** — `lsof -iTCP:23306 -sTCP:LISTEN` / `lsof -iTCP:18080 -sTCP:LISTEN` / `lsof -iTCP:15173 -sTCP:LISTEN`
> 모두 비어 있어야 함. 점유 시 해당 프로세스를 먼저 종료.

### 최초 1회 세팅

```bash
# 1) 환경변수 템플릿 복사 (커밋 금지)
cp .env.example .env

# 2) 프론트 의존성 설치
cd frontend && npm ci && cd ..

# 3) 백엔드 wrapper 실행 권한(필요 시)
chmod +x backend/gradlew
```

### 서비스 부팅 (3개 터미널)

```bash
# ── Terminal 1: MySQL (호스트 23306) ──────────────────────────
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml ps          # STATUS healthy 확인

# ── Terminal 2: Backend (포트 18080, 시드는 local 프로필에서만) ──
cd backend
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun

# ── Terminal 3: Frontend (포트 15173, strictPort=true) ────────
cd frontend
npm run dev
```

부팅 후 열리는 주소:

- 프론트: http://localhost:15173
- 백엔드 헬스: http://localhost:18080/actuator/health
- 시나리오 메타: http://localhost:18080/api/demo/scenarios

### 스모크 테스트 (부팅 직후 검증)

```bash
# MySQL ping
docker compose -f docker/docker-compose.yml exec -T mysql \
  mysqladmin -uroot -prootpass ping                      # mysqld is alive

# 시드 확인 (6개 테이블)
docker compose -f docker/docker-compose.yml exec -T mysql \
  mysql -ujpa -pjpa_password jpa_portfolio -e "SHOW TABLES;"

# 백엔드 헬스
curl -s localhost:18080/actuator/health                  # {"status":"UP"}

# 시나리오 메타 (Phase 3 `hello` 1개 이상)
curl -s localhost:18080/api/demo/scenarios | jq

# hello 시나리오 Bad/Fixed 실행 → queryCount 차이 확인
curl -s 'localhost:18080/api/demo/hello/meta?variant=BAD'   | jq '.elapsedMs,.queryCount'
curl -s 'localhost:18080/api/demo/hello/meta?variant=FIXED' | jq '.elapsedMs,.queryCount'
```

### 일상 명령어

```bash
# 백엔드
cd backend
./gradlew bootRun                     # 기동
./gradlew build                       # 컴파일 + 테스트
./gradlew test                        # Testcontainers-MySQL 회귀 테스트
./gradlew bootJar                     # 실행 가능 jar

# 프론트엔드
cd frontend
npm run dev                           # Vite dev server (15173)
npm run build                         # 타입체크 + 번들
npm run lint                          # ESLint
npm run preview                       # 빌드 결과 프리뷰

# Docker MySQL
docker compose -f docker/docker-compose.yml up -d        # 기동
docker compose -f docker/docker-compose.yml stop         # 중지 (볼륨 보존)
docker compose -f docker/docker-compose.yml down         # 컨테이너 제거 (볼륨은 유지)
docker compose -f docker/docker-compose.yml down -v      # ⚠️ 볼륨까지 삭제 (시드 리셋)
docker compose -f docker/docker-compose.yml logs -f mysql

# 컨테이너 내부 MySQL 쿼리 (호스트 mysql 클라이언트 불필요)
docker compose -f docker/docker-compose.yml exec -T mysql \
  mysql -ujpa -pjpa_password jpa_portfolio -e "SELECT COUNT(*) FROM members;"
```

### Claude Code 슬래시 커맨드

`.claude/commands/` 에 등록되어 `claude` 세션 안에서 바로 사용:

| 명령              | 동작                                                                        |
| ----------------- | --------------------------------------------------------------------------- |
| `/db-up`          | MySQL 컨테이너 기동 + healthy 대기                                          |
| `/db-query <SQL>` | 컨테이너 내부에서 쿼리 실행 (예: `/db-query SELECT COUNT(*) FROM members;`) |
| `/db-down`        | MySQL 컨테이너 중지 (볼륨 보존)                                             |
| `/entity <Name>`  | 프로젝트 컨벤션에 맞춘 `@Entity` 스캐폴딩                                   |

> 호스트의 `mysql`/`mysqladmin` 직접 호출은 PreToolUse 훅(`.claude/hooks/block-host-mysql.sh`)이 차단합니다.
> DB 질의는 항상 컨테이너 안에서.

### 트러블슈팅

| 증상                                       | 원인 / 조치                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `bootRun` 시 `Communications link failure` | MySQL 미기동. `docker compose … ps`가 `healthy`인지 확인 후 재시도                         |
| `Port 23306 is already allocated`          | 호스트에서 기존 MySQL이 23306 점유. `lsof -iTCP:23306` 로 프로세스 확인                    |
| `vite` 가 15173 대신 5174로 뜸             | `strictPort: true` 위반. 15173 점유 프로세스 종료 후 재시작                                |
| 시드가 비어 있음 (`SHOW TABLES` 0건)       | `SPRING_PROFILES_ACTIVE=local` 없이 기동됨. 환경변수 확인                                  |
| `open-in-view` 경고                        | `application.yml`에서 `false`로 이미 설정. 무시 가능 (Phase 5-12에서 토글 시나리오로 재현) |
| 프론트 CORS 에러                           | 백엔드 `WebConfig`에서 `http://localhost:15173` 허용 여부 확인                             |

---

## 기술 스택

| 영역     | 스택                                                                |
| -------- | ------------------------------------------------------------------- |
| Backend  | Spring Boot 3.5, Java 21, Spring Data JPA, Hibernate, Lombok, AOP   |
| Frontend | Vite, React 19, TypeScript, Tailwind v4, shadcn/ui (Nova), Recharts, react-flow(@xyflow), MDX |
| DB       | MySQL 8.4 (Docker, 호스트 포트 **23306**)                           |
| Test     | JUnit 5, Testcontainers-MySQL                                       |

### 포트 고정값 (충돌 회피)

| 서비스           | 포트      | 비고                                        |
| ---------------- | --------- | ------------------------------------------- |
| MySQL (Docker)   | **23306** | 호스트 3306은 기존 MySQL이 점유 중이라 금지 |
| Backend (Spring) | **18080** | 호스트 8080 상시 점유                       |
| Frontend (Vite)  | **15173** | 기본 5173 충돌, `strictPort: true`          |

---

## 레포 구조

```
JPAProject/
├─ backend/                              # Spring Boot + JPA (Gradle)
│   └─ src/main/java/com/portfolio/jpa/
│       ├─ JpaPortfolioApplication.java
│       ├─ common/
│       │   ├─ audit/BaseTimeEntity.java
│       │   ├─ config/JpaConfig.java
│       │   ├─ metrics/                  # ★ 측정 프레임워크
│       │   │   ├─ SqlCaptureInspector.java   # StatementInspector로 SQL 캡처
│       │   │   ├─ SqlCaptureContext.java     # ThreadLocal 스택
│       │   │   ├─ MetricsRecorder.java       # 쿼리 수·경과시간 집계
│       │   │   ├─ MetricsResult.java / RunMetrics.java
│       │   │   ├─ DemoRun.java / DemoRunAspect.java / DemoRunHolder.java
│       │   │   └─ HibernateInspectorConfig.java
│       │   └─ seed/DemoSeeder.java      # 프로필 `local` 시드
│       ├─ domain/                       # 엔티티 & 리포지토리
│       │   ├─ member/   (Member, MemberRepository)
│       │   ├─ product/  (Category, Product, *Repository)
│       │   ├─ order/    (Order, OrderItem, OrderStatus, *Repository)
│       │   └─ review/   (Review, ReviewRepository)
│       └─ demo/                         # 시나리오 모듈 (Phase 5 완료: 12개)
│           ├─ _framework/               # ScenarioRegistry / ScenarioMeta / ScenarioRunResponse / MetaController
│           ├─ concurrent/               # ConcurrentController · ConcurrentRunner (N-스레드 동시 실행 프레임워크)
│           ├─ hello/                    # 더미 시나리오 (프레임워크 스모크 테스트)
│           ├─ nplus1/                   # OrderList · ProductReviews · PagingFetch
│           ├─ lock/                     # OptimisticStock · PessimisticStock · Deadlock
│           ├─ transaction/              # SelfInvocation · ReadOnlyVsWrite · Propagation (+ PropagationAuditService)
│           └─ persistence/              # LazyOutsideTx · DirtyVsSave · OsivToggle (+ OrderSummaryDto/Head/ItemSummaryDto)
│
├─ frontend/                             # Vite + React + TS + MDX + react-flow
│   └─ src/
│       ├─ main.tsx · index.css · mdx.d.ts
│       ├─ app/        (root-layout, landing-layout, routes, theme-provider/context)
│       ├─ api/        (client.ts, demo.ts)
│       ├─ pages/landing/                # ★ 랜딩 4-블럭 (hero/domain/demo/stack-footer)
│       ├─ content/scenarios/            # ★ 시나리오별 MDX 해설 12종 (개념 → 과정 → 구현 코드 → 도메인 → Bad/Fixed → 참고)
│       ├─ components/
│       │   ├─ nav/    (top-nav, theme-toggle)
│       │   ├─ domain/ (graph.ts, entity-node, domain-diagram)   # ★ react-flow ERD
│       │   ├─ ui/     (button, accordion — shadcn)
│       │   └─ lab/    (category-page, scenario-sidebar, scenario-detail,
│       │              variant-runner, metrics-card, compare-bar-chart, sql-log-view,
│       │              explanation-section,                       # ★ 시나리오 해설 MDX 동적 로드
│       │              viz/*Flow.tsx)                             # ★ 시나리오별 react-flow 시각화 12종
│       ├─ hooks/      (useScenarios, useRunScenario, useLenis)
│       ├─ types/scenario.ts
│       └─ lib/utils.ts
│
├─ docker/docker-compose.yml             # MySQL 8.4 (호스트 23306)
├─ docs/
│   └─ research/
│       └─ jpa-coverage-survey.md        # ★ 면접·실무 빈출 주제 대비 커버리지 조사 + Gap Top 7
├─ .claude/                              # Claude Code 하네스 (settings, commands, agents, hooks)
├─ .env.example                          # DB/백엔드/프론트 환경변수 템플릿
└─ CLAUDE.md                             # 프로젝트 컨벤션 (커밋 규칙·포트·워크플로우)
```

---

## 진행 상황

| Phase | 내용                                                                                                                  | 상태             |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1     | 기초 뼈대 (Spring Boot 스캐폴드 · Vite+Tailwind+shadcn · Docker MySQL healthy)                                        | ✅               |
| 2     | 도메인 엔티티 6개 + 리포지토리 + `DemoSeeder` (local 프로필)                                                          | ✅               |
| 3     | 측정 프레임워크 (`SqlCaptureInspector` · `MetricsRecorder` · `@DemoRun` AOP · `ScenarioRunResponse`)                  | ✅               |
| 4     | 프론트 최소 연결 (RootLayout · TopNav · 카테고리 2-페인 · VariantRunner · MetricsCard · CompareBarChart · SqlLogView) | ✅               |
| **5** | **시나리오 반복 구현 (Per-Scenario Cycle)** — 12/12 전부 end-to-end + 시나리오별 react-flow 시각화 추가                | ✅ **완료**      |
| 5.5   | 랜딩 4-블럭 스크롤 스냅 재구성 + react-flow 도메인 ERD + MDX 시나리오 해설 시스템 + 시나리오별 Flow 시각화 12종       | ✅               |
| 6     | 랜딩 폴리시 · Bento 디자인 다듬기 · `/lab/concurrency` 본체(락 3종 통합 비교 Lab) 구현                                  | 🚧 **다음**     |
| 7     | Testcontainers 회귀 테스트                                                                                            | ⏳               |
| +     | [커버리지 조사 문서](./docs/research/jpa-coverage-survey.md) — 면접·실무 빈출 주제 대비 현재 커버리지 + Gap Top 7       | ✅               |

---

## 시나리오 카탈로그 (Phase 5)

각 시나리오는 `/api/demo/{category}/{name}?variant=BAD|FIXED` 로 노출되고, 프론트에서는
`/lab/{category}/{scenarioId}` 경로에서 Bad/Fixed를 나란히 실행·비교합니다.

진행 규칙: **한 번에 시나리오 1개**, Bad/Fixed end-to-end(백엔드 curl + 프론트 렌더) 완료 후
**사용자 브라우저 확인**을 받아야 다음으로 넘어갑니다.

### A. N+1 / 페치 전략 — `/lab/n-plus-one`

| #   | ID                       | 핵심 Bad                                                       | 핵심 Fixed                                    | 상태 |
| --- | ------------------------ | -------------------------------------------------------------- | --------------------------------------------- | ---- |
| 5-1 | `nplus1.order-list`      | 주문 목록 후 각 주문의 회원·아이템 LAZY 반복 접근 → 1 + N 쿼리 | fetch join + `@EntityGraph` (41 → 2 쿼리)     | ✅   |
| 5-2 | `nplus1.product-reviews` | 상품 목록 + 리뷰 컬렉션 반복 접근                              | `default_batch_fetch_size=100` (41 → 3 쿼리)  | ✅   |
| 5-3 | `nplus1.paging-fetch`    | 페이징 + 컬렉션 fetch join → `HHH000104` 재현                  | 2단계 조회(ID만 페이징 → `where id in (...)`) | ✅   |

### B. 락 / 동시성 — `/lab/lock` + `/lab/concurrency`

| #   | ID                        | 핵심 Bad                                      | 핵심 Fixed                                         | 상태 |
| --- | ------------------------- | --------------------------------------------- | -------------------------------------------------- | ---- |
| 5-4 | `lock.optimistic-stock` ⭐ | `@Version` 없이 동시 주문 → **잃어버린 갱신** | `@Version` + `OptimisticLockException` 재시도 루프 | ✅   |
| 5-5 | `lock.pessimistic-stock`  | 단순 update → race                            | `@Lock(PESSIMISTIC_WRITE)` + `SELECT … FOR UPDATE` | ✅   |
| 5-6 | `lock.deadlock`           | 두 리소스 A→B / B→A 역순 접근 → 데드락        | 자원 획득 순서 정렬 (`min/max`)                    | ✅   |

> **Concurrency Lab 프레임워크**: `POST /api/demo/concurrent/{scenarioId}` 로 `ExecutorService` + `CountDownLatch` 기반
> N-스레드 동시 호출 → 스레드별 start/elapsed/예외를 카드 그리드로 시각화. 5-4 구현 시 프레임워크를 구축해 5-5/5-6 공유.
> 락 각 시나리오 상세 페이지(`/lab/lock/:id`)에서 `useConcurrentRun` 훅으로 이미 작동 중. **전용 통합 페이지 `/lab/concurrency`는 현재 플레이스홀더**(Phase 6에서 락 3종 통합 비교 UI로 대체 예정).

### C. @Transactional 함정 — `/lab/transaction`

| #   | ID                      | 핵심 Bad                                                  | 핵심 Fixed                                                     | 상태 |
| --- | ----------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ---- |
| 5-7 | `tx.self-invocation`    | `this.innerMethod()` → 프록시 우회, `@Transactional` 무시 | SELF_INJECT(`@Lazy`) / AOP_CONTEXT / SEPARATE_BEAN 3전략       | ✅   |
| 5-8 | `tx.read-only-vs-write` | 조회 서비스에 `readOnly` 미설정 → 실수 변경도 UPDATE 반영 | `@Transactional(readOnly = true)` → 스냅샷 미보관 + MANUAL flush | ✅   |
| 5-9 | `tx.propagation`        | `REQUIRED`로 외부 실패 시 audit insert까지 함께 롤백      | `REQUIRES_NEW`로 audit 독립 커밋                               | ✅   |

### D. 영속성 컨텍스트 / OSIV — `/lab/persistence`

| #    | ID                            | 핵심 Bad                                                         | 핵심 Fixed                                         | 상태 |
| ---- | ----------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- | ---- |
| 5-10 | `persistence.lazy-outside-tx` | 트랜잭션 밖 LAZY 접근 → `LazyInitializationException`            | JPQL 생성자 표현식 DTO 투영                        | ✅   |
| 5-11 | `persistence.dirty-vs-save`   | `save(detached)` → `em.merge` 사전 SELECT + managed 복제본 반환  | 영속 상태에서 필드 변경 → dirty checking만으로 UPDATE | ✅   |
| 5-12 | `persistence.osiv-toggle`     | OSIV false에서 `LazyInitializationException` · true에서 N+1 폭증 | `open-in-view=false` + DTO 계약                    | ✅   |

> 모든 시나리오에 **react-flow 기반 Flow 시각화**(`frontend/src/components/lab/viz/*Flow.tsx`)가 MDX `## 과정` 섹션에 삽입되어 Bad/Fixed 흐름을 시각적으로 비교할 수 있습니다.

---

### (선택) 추가 고려 시나리오 — Gap Top 7

[docs/research/jpa-coverage-survey.md](./docs/research/jpa-coverage-survey.md) 조사 결과, 현재 12개는 N+1/락/TX/영속성 **코어 4축을 ≈50% 커버**하고 있고, 아래 주제들이 미커버 중 교육·포트폴리오 가치가 높은 순으로 정리됐다. 단계적으로 추가 가능.

| #   | 주제                                         | 한 줄                                                                                                  |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | **벌크 연산 캐시 오염** ⭐                    | `@Modifying` JPQL UPDATE 후 1차 캐시 불일치 → `clearAutomatically=true`로 해결                        |
| 2   | `@EntityGraph` 동적 + MultipleBagFetchException | 여러 `@OneToMany` 동시 fetch join 시 예외 재현, `Set`/쿼리 분리/`@BatchSize`로 해결                    |
| 3   | ID 생성 전략 + 배치 insert 성능               | `IDENTITY`(JDBC batch 불가) vs `SEQUENCE` vs UUIDv7 비교, `hibernate.jdbc.batch_size` + `order_inserts` |
| 4   | Jackson + LAZY 직렬화 N+1                    | Controller가 엔티티 반환 → Jackson 직렬화 중 N+1 폭증, DTO 계약으로 해결 (5-10 확장판)                |
| 5   | Cascade vs orphanRemoval                     | `CascadeType.REMOVE`(부모 삭제) vs `orphanRemoval=true`(컬렉션 제거) 동작 차이                         |
| 6   | 격리 수준 (Non-repeatable / Phantom Read)    | `READ_COMMITTED` vs `REPEATABLE_READ` 같은 SELECT 두 번 결과 차이, InnoDB MVCC 이해                   |
| 7   | `@Async` × `@Transactional` 경계 실종        | 비동기 메서드의 `@Transactional`이 호출 스레드 TX와 분리됨을 재현                                      |

---

## 측정 프레임워크 (핵심 설계)

모든 시나리오가 공유하는 얇은 러너. 이미 Phase 3에서 구현 완료.

1. **`SqlCaptureInspector implements StatementInspector`**
   - Hibernate가 실행하기 직전 SQL을 가로채 `ThreadLocal`에 적재.
2. **`MetricsRecorder` + `RunMetrics`**
   - 쿼리 수·총 경과 시간을 요청 범위에서 집계.
3. **`@DemoRun` AOP 어드바이저**
   - 시나리오 메서드에 붙으면 시작·종료 자동 캡처, 결과를 스레드 홀더(`DemoRunHolder`)에 저장.
4. **응답 DTO `ScenarioRunResponse`**
   ```json
   {
     "scenarioId": "n-plus-one.order-list",
     "variant": "BAD",
     "elapsedMs": 842,
     "queryCount": 101,
     "sqlLog": ["select ...", "..."],
     "result": { "orders": [ ... ] },
     "notes": ["LAZY 반복 접근으로 주문당 추가 SELECT 발생"]
   }
   ```

---

## API 엔드포인트 (개요)

| Method | Path                                             | 용도                                       |
| ------ | ------------------------------------------------ | ------------------------------------------ |
| `GET`  | `/api/demo/scenarios`                            | 시나리오 메타 목록 (프론트 사이드바 렌더)  |
| `GET`  | `/api/demo/{category}/{name}?variant=BAD\|FIXED` | 개별 시나리오 실행 → `ScenarioRunResponse` |
| `POST` | `/api/demo/concurrent/{scenarioId}`              | N-스레드 동시 실행 (락 카테고리용)         |

---

## 개발 워크플로우 (이 프로젝트 고유)

2개의 전용 에이전트로 시나리오를 반복 구현:

- **`jpa-director`** — 다음 1스텝 구현 지시서 작성 + 수용 기준 검증 (코드 수정 권한 없음).
- **`jpa-developer`** — 지시서대로 구현, 빌드/테스트 돌려 PASS/FAIL 보고.

한 사이클:

```
director 지시서 ─▶ developer 구현 ─▶ 빌드/테스트 ─▶ curl 검증 ─▶ 프론트 렌더 확인 ─▶ 사용자 브라우저 확인 ─▶ 다음 시나리오
```

---

## 검증 체크리스트 (릴리즈 기준)

- [x] `docker compose ps` → MySQL `healthy`
- [x] `curl localhost:18080/api/demo/scenarios` → **12개** 메타
- [x] `curl '…/nplus1/order-list?variant=BAD'` → `queryCount ≥ 1+N`, `sqlLog.length == queryCount`
- [x] `…?variant=FIXED` → `queryCount`가 2~3으로 감소
- [x] 프론트 `/` 랜딩 4-블럭 렌더 + 다크 기본/라이트 토글 (localStorage 유지)
- [x] `/lab/{category}/:id` 12개 시나리오 전부 Bad/Fixed 차트·SQL 로그·MDX 해설·Flow 시각화 렌더
- [x] `/lab/lock/:id` 상세에서 `POST /api/demo/concurrent/:id` 10스레드 실행 → Bad 잃어버린 갱신/데드락, Fixed 전원 성공
- [ ] `/lab/concurrency` 전용 통합 비교 Lab (플레이스홀더 → Phase 6에서 본체 교체)
- [ ] `./gradlew test` Testcontainers 회귀 테스트 통과 (Phase 7)

---

## 컨벤션 요약

- 백엔드: 도메인 패키지, 생성자 주입, `@NoArgsConstructor(PROTECTED)` + 정적 팩토리, JPQL/Querydsl 우선.
- 프론트: 함수형 컴포넌트, API 호출은 `src/api/` 분리, 차트는 Recharts.
- 공통: 비밀값은 `.env`에만, 포트·스택 변경은 `CLAUDE.md` 선행 업데이트.
- 커밋: **한글 메시지**, author는 로컬 git config 그대로, `Co-Authored-By` 트레일러 금지.

자세한 컨벤션은 [CLAUDE.md](./CLAUDE.md) 참고.
