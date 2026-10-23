# Scripts и зависимости

Скрипты, на которые ссылаются документы и skills шаблона. Имена — часть контракта: если имя в проекте занято другим смыслом, см. [merge.md](merge.md#команды-и-scripts).

```json
{
	"scripts": {
		"env:copy": "bash scripts/copyWorktreeEnv.sh",
		"browser": "node scripts/agentBrowser.mts",
		"browser:port": "node scripts/browserPort.mts",
		"browser:install": "agent-browser install",
		"browser:login": "node scripts/prepareBrowserAuth.mts",
		"browser:doctor": "node scripts/browserDoctor.mts",
		"browser:network": "node scripts/browserNetwork.mts",
		"lint:docs": "node scripts/checkDocsToc.mts",
		"lint:links": "node scripts/checkDocsLinks.mts",
		"lint:skills": "node scripts/checkVendoredSkills.mts && bash scripts/linkClaudeSkills.sh --check",
		"lint:skills:update": "node scripts/checkVendoredSkills.mts --update",
		"lint:size": "node scripts/checkFileSize.mts",
		"lint:size:update": "node scripts/checkFileSize.mts --update",
		"lint:size:seed": "node scripts/checkFileSize.mts --seed",
		"lint:agents": "pnpm lint:docs && pnpm lint:links && pnpm lint:skills && pnpm lint:size",
		"check": "pnpm lint:agents && <lint проекта> && <typecheck проекта> && tsc --noEmit -p scripts",
		"verify": "pnpm check && <все тесты без watch> && node scripts/hooks/verifyStamp.mts"
	},
	"devDependencies": {
		"agent-browser": "<текущая версия>",
		"typescript": "<версия проекта>",
		"@types/node": "<версия под Node проекта>"
	}
}
```

- **`check`** — быстрые статические проверки. **`verify`** — `check` и все тесты; его запускают `verify-change` и CI, а последний шаг записывает отметку для Stop-хука.
- **Тесты в `verify`** — существующий script, который гоняет все тесты без watch (`test`, `test:run`). Нет такого — заведи `test:run`.
- **Тяжёлые сборки** (`next build`, e2e) в `verify` не клади: его ждёт каждый Stop агента. Им место в CI отдельными шагами.
- **Монорепо:** typecheck по пакетам, а не `tsc --noEmit` в корне; `typescript` нужен в devDependencies корня для `tsc -p scripts`.
- **pnpm 11** блокирует postinstall зависимостей: `pnpm add -D agent-browser` падает с `ERR_PNPM_IGNORED_BUILDS`. Бинарники лежат в пакете, а postinstall только докачивает недостающие, поэтому достаточно `allowBuilds: { agent-browser: false }` в `pnpm-workspace.yaml`.
- **`browser:*`** — только с browser harness.
