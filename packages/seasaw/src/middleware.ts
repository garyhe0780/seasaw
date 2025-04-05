import { type Operation, run } from "effection";
import type { Middleware } from "./types";

export class MiddlewareStack<T> {
	private middlewares: Middleware<T>[] = [];

	use(middleware: Middleware<T>): this {
		this.middlewares.push(middleware);
		return this;
	}

	*execute(context: T): Operation<void> {
		for (const middleware of this.middlewares) {
			yield* middleware(context);
		}
	}

	async run(context: T): Promise<void> {
		await run(() => this.execute(context));
	}
}
