#!/usr/bin/env bash
# Копирует локальные env-файлы из основного checkout в текущий worktree.
# Копия, а не symlink: окружение worktree можно поменять, не задевая остальные.
# Существующий файл не перезаписывается, значения env не выводятся.

set -euo pipefail

repository_root="$(git rev-parse --show-toplevel)"
primary_worktree="$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -n 1)"

function copy_env_file() {
	local file_name="$1"
	local is_required="$2"
	local source_env="${primary_worktree}/${file_name}"
	local target_env="${repository_root}/${file_name}"

	if [[ -e "${target_env}" || -L "${target_env}" ]]; then
		printf '%s уже есть, не трогаю\n' "${file_name}"
		return
	fi

	if [[ ! -f "${source_env}" ]]; then
		if [[ "${is_required}" == "true" ]]; then
			printf 'В основном checkout нет %s\n' "${file_name}" >&2
			exit 1
		fi

		printf 'В основном checkout нет %s, пропускаю\n' "${file_name}"
		return
	fi

	if ! git -C "${repository_root}" check-ignore -q "${file_name}"; then
		printf '%s не защищён правилом .gitignore\n' "${file_name}" >&2
		exit 1
	fi

	cp "${source_env}" "${target_env}"
	chmod 600 "${target_env}"
	printf '%s скопирован из основного checkout\n' "${file_name}"
}

# Env приложения — тот же путь, что APP_ENV_FILE в scripts/projectConfig.mts.
copy_env_file "{{APP_ENV_FILE}}" "true"
copy_env_file ".env.browser.local" "false"
