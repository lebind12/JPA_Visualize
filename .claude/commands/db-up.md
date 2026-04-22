---
description: Docker MySQL(포트 23306) 컨테이너를 기동하고 상태를 확인한다
allowed-tools: Bash(docker:*), Bash(docker compose:*)
---

`docker/docker-compose.yml`을 사용해 MySQL 컨테이너를 백그라운드로 기동해주세요.

1. `docker compose -f docker/docker-compose.yml up -d` 실행
2. `docker compose -f docker/docker-compose.yml ps`로 상태 확인
3. 호스트 포트가 **23306**으로 노출됐는지 확인 (3306이면 경고)
4. 필요하면 `docker compose -f docker/docker-compose.yml logs --tail=30 mysql`로 로그 확인
