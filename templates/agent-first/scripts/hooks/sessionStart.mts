/**
 * SessionStart: запоминает дерево файлов в начале сессии, чтобы Stop-хук отличал правки этой сессии от чужих.
 * Продолженная сессия (resume, compact) сохраняет исходную точку.
 */

import { getWorkingTree, readHookInput, readSessionState, writeSessionState } from "./agentState.mts";

interface SessionStartInput {
	session_id: string;
	cwd: string;
}

try {
	const input = readHookInput<SessionStartInput>();

	if (!readSessionState(input.cwd, input.session_id)) {
		writeSessionState(input.cwd, input.session_id, { startTree: getWorkingTree(input.cwd) });
	}
} catch {
	// Хук не мешает работе: вне git-репозитория или без git точки отсчёта просто нет.
}
