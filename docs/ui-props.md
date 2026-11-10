# Пропсы UI-компонентов

UI-компонент принимает пропсы в форме, удобной для отрисовки. Тип DTO, ответа API и строки базы остаётся на границе данных: `select` запроса, loader или query-хук. Листовой компонент получает только те поля, которые сам показывает.

Принцип описан у Dario Djuric: [Do not pass DTOs to UI components](https://darios.blog/posts/do-not-pass-dtos-to-ui-components).

Смена формы бэкенда правится в одном маппере. Компонент зависит только от своих пропсов, поэтому его проще переиспользовать и отрендерить в Storybook и тестах: на вход приходят плоские поля.

## Пример

Плохо: лист читает транспортную форму и сам достаёт вложенные поля.

```tsx
interface PostDto {
	id: string;
	author_id: string;
	title: string;
	metadata: {
		created_at: string;
		tags: string[];
	};
}

interface Props {
	post: PostDto;
}

export function PostHeader(props: Props) {
	const { post } = props;

	return (
		<header>
			<h2>{post.title}</h2>
			<time>{post.metadata.created_at}</time>
		</header>
	);
}
```

Хорошо: query-хук через `select` собирает модель для экрана. Лист принимает плоские пропсы. Дата приходит как `Date`, подпись для экрана собирает компонент: формат зависит от локали и от места, где дату показывают.

```tsx
import { useQuery } from "@tanstack/react-query";

interface PostDto {
	id: string;
	author_id: string;
	title: string;
	metadata: {
		created_at: string;
		tags: string[];
	};
}

interface PostView {
	id: string;
	title: string;
	createdAt: Date;
	tags: string[];
}

declare function fetchPost(id: string): Promise<PostDto>;

export function usePost(id: string) {
	return useQuery({
		queryKey: ["post", id],
		queryFn: () => fetchPost(id),
		select: (dto): PostView => ({
			id: dto.id,
			title: dto.title,
			createdAt: new Date(dto.metadata.created_at),
			tags: dto.metadata.tags,
		}),
	});
}

interface Props {
	title: string;
	createdAt: Date;
}

export function PostHeader(props: Props) {
	const { title, createdAt } = props;
	const label = new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
	}).format(createdAt);

	return (
		<header>
			<h2>{title}</h2>
			<time dateTime={createdAt.toISOString()}>{label}</time>
		</header>
	);
}
```

Страница берёт `PostView` из хука и передаёт листу только `title` и `createdAt`.

## Прототип и сквозные типы

В небольшом прототипе и там, где типы уже сквозные (tRPC, сгенерированный клиент OpenAPI), отдельный маппер на каждую сущность обычно повторяет тип. Хватает `Pick<>` и плоских пропсов у листа:

```tsx
interface Post {
	id: string;
	title: string;
	createdAt: Date;
	tags: string[];
}

type Props = Pick<Post, "title" | "createdAt">;

export function PostHeader(props: Props) {
	const { title, createdAt } = props;
	// ...
}
```

## Формат строки остаётся в UI

В слой данных кладётся значение, например `Date`. Готовую подпись (`formattedDate` и похожие поля) туда не кладут: как показать значение, решает компонент. В [исходной заметке](https://darios.blog/posts/do-not-pass-dtos-to-ui-components) дата форматируется в слое данных; здесь формат остаётся в UI.
