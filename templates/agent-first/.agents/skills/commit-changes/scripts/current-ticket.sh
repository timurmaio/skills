#!/usr/bin/env bash
set -euo pipefail

# Первый ключ задачи из имени ветки: feature/PROJ-123-filters → PROJ-123.
# Шаблон ключа задаёт TICKET_PATTERN; по умолчанию — ключ трекера проекта.
ticket_pattern="${TICKET_PATTERN:-{{TICKET_KEY}}-[0-9]+}"
branch_name="$(git branch --show-current)"

if [[ -z "${branch_name}" ]]; then
	exit 0
fi

ticket="$(printf '%s\n' "${branch_name}" | grep -Eoi "${ticket_pattern}" | head -n 1 || true)"

printf '%s\n' "${ticket}"
