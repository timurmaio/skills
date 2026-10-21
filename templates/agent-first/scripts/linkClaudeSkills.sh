#!/usr/bin/env bash
# Claude Code видит skills через симлинки .claude/skills/<name> → ../../.agents/skills/<name>.
# Без аргументов создаёт недостающие симлинки и удаляет висячие.
# С --check только проверяет и падает, если симлинки разошлись с .agents/skills/.

set -euo pipefail

repository_root="$(git rev-parse --show-toplevel)"
source_dir="${repository_root}/.agents/skills"
links_dir="${repository_root}/.claude/skills"
is_check="false"
problems=()

if [[ "${1:-}" == "--check" ]]; then
	is_check="true"
fi

mkdir -p "${links_dir}"

for skill_dir in "${source_dir}"/*/; do
	name="$(basename "${skill_dir}")"
	link="${links_dir}/${name}"
	target="../../.agents/skills/${name}"

	if [[ -L "${link}" && "$(readlink "${link}")" == "${target}" ]]; then
		continue
	fi
	if [[ "${is_check}" == "true" ]]; then
		problems+=(".claude/skills/${name}: нет симлинка на ${target}")
		continue
	fi
	if [[ -e "${link}" || -L "${link}" ]]; then
		printf '.claude/skills/%s существует и это не симлинк на %s — не трогаю\n' "${name}" "${target}" >&2
		exit 1
	fi
	ln -s "${target}" "${link}"
	printf '.claude/skills/%s → %s\n' "${name}" "${target}"
done

for link in "${links_dir}"/*; do
	[[ -L "${link}" ]] || continue
	[[ -e "${link}" ]] && continue
	if [[ "${is_check}" == "true" ]]; then
		problems+=(".claude/skills/$(basename "${link}"): висячий симлинк")
		continue
	fi
	rm "${link}"
	printf '.claude/skills/%s удалён: skill больше нет\n' "$(basename "${link}")"
done

if [[ ${#problems[@]} -gt 0 ]]; then
	printf 'Симлинки Claude Code разошлись с .agents/skills:\n' >&2
	printf -- '- %s\n' "${problems[@]}" >&2
	printf '\nИсправить: bash scripts/linkClaudeSkills.sh\n' >&2
	exit 1
fi
