---
description: Docker MySQL 컨테이너를 정지한다 (볼륨은 보존)
allowed-tools: Bash(docker:*), Bash(docker compose:*)
---

`docker compose -f docker/docker-compose.yml down`을 실행해 MySQL 컨테이너를 정지합니다.
**`-v` 플래그는 절대 붙이지 마세요** — 로컬 개발 데이터가 사라집니다.

정지 후 `docker compose -f docker/docker-compose.yml ps`로 확인해주세요.
