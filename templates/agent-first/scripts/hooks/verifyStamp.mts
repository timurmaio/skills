/**
 * Последний шаг `pnpm verify`: записывает, на каком дереве файлов проверки прошли.
 * Stop-хук сверяет с ним текущее дерево: любая правка после verify делает отметку несвежей.
 */

import { getWorkingTree, writeVerifyStamp } from "./agentState.mts";

const cwd = process.cwd();

writeVerifyStamp(cwd, { tree: getWorkingTree(cwd), verifiedAt: new Date().toISOString() });
console.log("pnpm verify прошёл: отметка для Stop-хука записана.");
