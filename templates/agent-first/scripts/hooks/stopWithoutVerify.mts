/**
 * Stop: агент не заканчивает сессию, в которой изменил код, без свежего `pnpm verify` (AGENTS.md, «Готово»).
 *
 * Свежий — отметка `pnpm verify` сделана на том же дереве файлов, что сейчас. Правки только в Markdown verify
 * не требуют. Хук блокирует остановку один раз: если агент останавливается с вопросом или с NOT READY,
 * повторная остановка проходит (`stop_hook_active`).
 */

import {
	getWorkingTree,
	listChangedFiles,
	readHookInput,
	readSessionState,
	readVerifyStamp,
	writeSessionState,
} from "./agentState.mts";

interface StopInput {
	session_id: string;
	cwd: string;
	stop_hook_active?: boolean;
	background_tasks?: unknown[];
}

const DOCS_ONLY = /\.mdx?$/;

try {
	const input = readHookInput<StopInput>();

	// Уже напомнили в этом ходе или сессия ждёт фоновую работу, а не заканчивается.
	if (input.stop_hook_active || (input.background_tasks?.length ?? 0) > 0) {
		process.exit(0);
	}

	const currentTree = getWorkingTree(input.cwd);
	const session = readSessionState(input.cwd, input.session_id);

	// Сессия началась до установки хуков: точкой отсчёта становится текущее дерево.
	if (!session) {
		writeSessionState(input.cwd, input.session_id, { startTree: currentTree });
		process.exit(0);
	}

	const changedFiles = listChangedFiles(input.cwd, session.startTree, currentTree);
	const codeFiles = changedFiles.filter((file) => !DOCS_ONLY.test(file));

	if (codeFiles.length === 0 || readVerifyStamp(input.cwd)?.tree === currentTree) {
		process.exit(0);
	}

	console.log(
		JSON.stringify({
			decision: "block",
			reason:
				`В этой сессии изменены файлы кода (${codeFiles.length}, например ${codeFiles.slice(0, 3).join(", ")}), ` +
				"а `pnpm verify` после последней правки не проходил. Задача закончена — пройди `verify-change` " +
				"(он запускает `pnpm verify`) и только потом сообщай о готовности. Останавливаешься с вопросом " +
				"или с NOT READY — прямо скажи пользователю, что verify не пройден: повторная остановка пройдёт.",
		}),
	);
} catch {
	// Сбой хука не блокирует работу: правило «Готово» остаётся в AGENTS.md.
}
