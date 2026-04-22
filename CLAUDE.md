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
- 백엔드는 `http://localhost:8080`, 프론트는 Vite 기본 포트(5173)

### 공통
- 비밀값은 `.env`에 두고 커밋 금지. `.env.example`만 커밋.
- 포트 변경, 스택 변경은 반드시 `CLAUDE.md` 업데이트 후 진행.

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
