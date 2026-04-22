---
description: Docker MySQL 컨테이너 안에서 쿼리를 실행한다
allowed-tools: Bash(docker:*), Bash(docker compose:*)
argument-hint: "<SQL>"
---

Docker 안의 MySQL 컨테이너에서 전달받은 SQL(`$ARGUMENTS`)을 실행해주세요.
호스트에 mysql 클라이언트가 없어도 동작해야 하며, 접속 정보는 `docker/docker-compose.yml`의 기본값(`jpa` / `jpa_password` / `jpa_portfolio`)을 사용합니다.

## 기본 실행

```bash
docker compose -f docker/docker-compose.yml exec -T mysql \
  mysql -u jpa -pjpa_password jpa_portfolio -N -e "$ARGUMENTS"
```

- `-T`: TTY 할당 없이(비대화형) 실행 — 파이프·CI 친화적.
- `-N`: 컬럼 헤더 생략(깔끔한 숫자 추출용). 필요하면 제거하고 사용.

## 여러 줄 SQL

`$ARGUMENTS`가 여러 줄이거나 긴 스크립트라면 heredoc으로 넘기세요:

```bash
docker compose -f docker/docker-compose.yml exec -T mysql \
  mysql -u jpa -pjpa_password jpa_portfolio <<'SQL'
$ARGUMENTS
SQL
```

## 주의

- 호스트에서 `mysql -h localhost -P 23306 ...` 형태로 직접 호출하지 마세요. PreToolUse 훅이 차단합니다.
- 컨테이너가 기동되어 있지 않다면 먼저 `/db-up`을 실행하세요.
- 결과가 많을 때는 끝에 `LIMIT`을 붙이거나 `-e "... LIMIT 20"` 형태로 잘라 출력해주세요.
