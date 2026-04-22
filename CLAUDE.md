# JPA Portfolio Project

JPA 학습·포트폴리오용 풀스택 프로젝트. Spring Data JPA로 작성한 쿼리의 결과(데이터, 성능 지표, 실행계획 등)를 React에서 **시각화**하는 것이 핵심 목적.

## Tech Stack
- **Backend**: Spring Boot 3.x, Spring Data JPA, Java 21, Gradle
- **Frontend**: React + Vite + TypeScript (쿼리 결과 시각화 UI)
- **Database**: MySQL 8.x (Docker)
- **Test**: JUnit 5, Mockito, `@DataJpaTest` / Testcontainers-MySQL

## Project Layout
```
backend/       # Spring Boot + JPA (Gradle 프로젝트)
frontend/      # React(Vite+TS) 시각화 앱
docker/        # docker-compose.yml (MySQL)
.claude/       # Claude Code 하네스 (settings, commands, agents)
```

## Local Dev

### Docker MySQL — 호스트 포트 23306 고정
호스트의 기존 MySQL과 충돌을 피하기 위해 **호스트 포트 23306**을 사용한다 (컨테이너 내부는 3306).
`jdbc:mysql://localhost:**23306**/...` 형태로 접속. **3306 포트는 쓰지 말 것.**

```bash
# DB 기동
docker compose -f docker/docker-compose.yml up -d

# 백엔드
cd backend && ./gradlew bootRun

# 프론트엔드
cd frontend && npm run dev
```

### 사용자가 띄워둔 개발 프로세스는 절대 건드리지 않는다
사용자는 옵저빙 목적으로 다음 프로세스를 **직접 관리**한다. 에이전트·메인 어시스턴트는 이들을 **kill·재시작·대체 기동하지 않는다**.

- `./gradlew bootRun` (Spring Boot, 포트 18080) — DevTools가 붙어 있어 classpath 변경을 감지해 자동 재시작.
- `./gradlew -t classes` (백엔드 continuous compile) — 소스 저장 시 자동 재컴파일.
- `npm run dev` (Vite, 포트 15173) — HMR 자동 반영.

**에이전트 규칙**
- 빌드 검증은 단발성 명령만: `./gradlew compileJava`, `./gradlew build`, `npm run build`, `npm run lint`. `bootRun`·`-t classes`·`npm run dev`를 새로 띄우지 말 것.
- 18080/15173/23306 포트 점유 프로세스를 `kill`·`lsof`로 찾아 종료하지 말 것.
- curl 등 런타임 검증은 "이미 떠 있으면 그 인스턴스에 대고" 수행. 없으면 사용자에게 "백엔드 기동 후 재검증 요청"으로 보고하고 멈춘다.
- DB 기동(`docker compose … up -d`)은 예외적으로 허용 (DB는 사용자가 수동 관리하지 않음).

### DB 쿼리는 컨테이너 안에서 실행한다
호스트에 mysql 클라이언트가 없을 수 있고, 있어도 일관성을 위해 **반드시 컨테이너 안**에서 돌린다.
호스트의 `mysql`/`mysqladmin` 직접 호출은 PreToolUse 훅(`.claude/hooks/block-host-mysql.sh`)이 차단한다.

```bash
# 원라이너
docker compose -f docker/docker-compose.yml exec -T mysql \
  mysql -u jpa -pjpa_password jpa_portfolio -e "SELECT COUNT(*) FROM members;"

# 슬래시 커맨드
/db-query SELECT COUNT(*) FROM members;
```

## Conventions

### Backend
- 도메인 중심 패키지 (`com.portfolio.jpa.<domain>/{domain,repository,service,web}`)
- 생성자 주입만 사용, 필드 주입 금지
- `@Entity`에 `@NoArgsConstructor(access = PROTECTED)` + 정적 팩토리
- JPQL / Querydsl 우선, 네이티브 SQL은 필요할 때만
- **N+1 감시**: fetch join, `@EntityGraph`, `default_batch_fetch_size` 중 적절히 선택
- `@CreatedDate` / `@LastModifiedDate` 감사 필드 포함
- Repository 테스트는 H2 아닌 **Testcontainers-MySQL**로 (MySQL 방언 차이 때문)

### Frontend
- Vite + TypeScript, 함수형 컴포넌트만
- API 호출은 `src/api/` 레이어로 분리 (axios or fetch 래퍼)
- 시각화는 Recharts 또는 Chart.js 고려 (확정 전)
- 백엔드 HTTP 포트는 **18080** 고정 (호스트 8080이 다른 서비스에 상시 점유 중). `application.yml`의 `server.port=18080`.
- 프론트 Vite 포트는 **15173** 고정 (기본 5173이 다른 앱과 충돌). `vite.config.ts`의 `server.port=15173`, `strictPort: true`. 5173 금지.

### MDX 해설 파일 (`frontend/src/content/scenarios/*.mdx`)
- **인라인 백틱(`` `x` ``)을 쓰지 말 것.** prose + shadcn 테마에서 인라인 code 렌더링이 일관되지 않아 가독성이 떨어진다. 강조·식별자·문자열 표기는 **`**bold**`**(볼드)로 대체한다.
  - 예) `` `findById(id)` `` → `**findById(id)**`
  - 예) `` `@EntityGraph` `` → `**@EntityGraph**`
- 멀티라인 **펜스드 코드 블록**(```` ```java ```` … ```` ``` ````)은 그대로 유지. 이건 prose에서 정상 렌더되고 코드 구조를 표현하는 데 대체 수단이 없다.
- **최상단에 "구현 코드" 섹션 필수** — "한줄 요약"보다 먼저 나온다. 다음 구조를 따른다:
  ```
  ## 구현 코드

  ### BAD
  (해당 Scenario.runBad() 본문을 펜스드 java 블록으로 발췌. 핵심 LAZY 접근/N+1 유발 라인이 드러나게.)

  ### FIXED
  (Scenario.runFixed() 본문 + FIXED에서 사용한 핵심 Repository 메서드 시그니처·JPQL 펜스드 java 블록으로.)
  ```
  - 파일 경로 주석(예: `// OrderListScenario.java`)을 각 블록 첫 줄에 넣어 "어디 있는 코드인지" 명확화.
  - 집계/누산 보일러플레이트는 **생략 허용**(`...` 으로 표기). 교육 포인트가 되는 라인만 남긴다.
- 새 시나리오 MDX 추가 시에도 위 규칙을 전부 따른다.

### 공통
- 비밀값은 `.env`에 두고 커밋 금지. `.env.example`만 커밋.
- 포트 변경, 스택 변경은 반드시 `CLAUDE.md` 업데이트 후 진행.

## 개발 워크플로우 (이 프로젝트 고유)

이 프로젝트는 다음 2개 에이전트 + 반복 사이클로 진행한다.

- **`jpa-director`** (지시 전용, 코드 수정 불가) — 다음 한 스텝의 구현 지시서를 작성하고 결과 검증 리포트를 낸다.
- **`jpa-developer`** (개발 전용) — 지시서대로 코드를 구현하고 빌드/테스트까지 돌려 PASS/FAIL로 보고한다.

### 시나리오 구현 규칙
- **한 번에 시나리오 1개.** `Bad/Fixed` end-to-end(백엔드 curl 검증 + 프론트 `/lab/xxx` 렌더)가 완료되고 **사용자가 직접 확인한 뒤**에만 다음 시나리오로 넘어간다.
- 여러 시나리오를 한꺼번에 구현·병합하지 않는다.
- 플랜 파일(`/Users/woolee/.claude/plans/harmonic-launching-melody.md`)의 Phase 5 순서를 따른다.

## Git Commit 규칙 (반드시 지킬 것)
- 커밋 메시지는 **반드시 한글**로 작성한다. (제목·본문 모두)
- **author는 로컬 `git config user.name` / `user.email` 값을 그대로 사용**한다. `--author` 플래그로 재지정하거나 git config를 임의로 수정하지 말 것.
- 커밋에 `Co-Authored-By: Claude …` 트레일러를 **붙이지 않는다** — author가 사용자 본인으로만 기록되도록 유지.
- 커밋 전 `git config user.name`, `git config user.email`이 사용자 본인 값인지 확인.
- 예시:
  ```
  feat(order): 주문 생성 API 추가

  - Order 엔티티와 정적 팩토리 메서드 구현
  - OrderRepository, OrderService 기본 구조 작성
  ```

## What Claude Should Do / Not Do
- JPA 쿼리를 작성할 때는 실행 SQL(`hibernate.show_sql`) 기준으로 N+1·불필요한 조인 여부를 같이 검토할 것.
- Repository 레이어에 Mockito 남용 금지 — 쿼리 의미를 검증할 땐 실제 DB(Testcontainers) 사용.
- MySQL 포트는 **23306**. 임의로 3306으로 바꾸지 말 것.
- 문서 파일(*.md)은 사용자가 요청할 때만 생성.
