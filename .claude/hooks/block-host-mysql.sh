#!/usr/bin/env bash
# PreToolUse/Bash hook: DB는 Docker 컨테이너 안에서만 돌리도록 강제한다.
# 호스트 mysql/mysqladmin 클라이언트 직접 호출을 exit 2로 차단한다.
# docker 래퍼(`docker exec ...`, `docker compose exec ...`) 안에서 호출되면 통과.

set -u

cmd="$(jq -r '.tool_input.command // empty')"
[ -z "$cmd" ] && exit 0

# docker 토큰이 이미 포함된 커맨드는 통과
if printf '%s' "$cmd" | grep -qE '(^|[[:space:]]|[;&|(`])docker([[:space:]]|$)'; then
  exit 0
fi

# mysql/mysqladmin이 "커맨드 토큰"으로 등장하는지만 탐지.
# 앞: 줄 시작 / 공백 / ; && || | ( `
# 뒤: 공백 / 줄 끝
if printf '%s' "$cmd" | grep -qE '(^|[[:space:]]|[;&|(`])(mysql|mysqladmin)([[:space:]]|$)'; then
  cat >&2 <<'MSG'
🛑 DB는 Docker 컨테이너 안에 있습니다. 호스트 mysql 클라이언트를 직접 호출하지 마세요.

올바른 사용법:
  docker compose -f docker/docker-compose.yml exec -T mysql \
    mysql -u jpa -pjpa_password jpa_portfolio -e "SELECT COUNT(*) FROM members;"

또는 /db-query 슬래시 커맨드를 사용하세요.
MSG
  exit 2
fi

exit 0
