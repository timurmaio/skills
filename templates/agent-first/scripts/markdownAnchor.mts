/** Якорь заголовка Markdown, как его строят GitLab и GitHub: строчные буквы, без пунктуации, пробелы — дефисы, несколько дефисов подряд — один. */
export function toAnchor(heading: string): string {
	return heading
		.toLowerCase()
		.replaceAll("`", "")
		.replaceAll(/[^\p{L}\p{N}\s-]/gu, "")
		.trim()
		.replaceAll(/\s/g, "-")
		.replaceAll(/-{2,}/g, "-");
}
