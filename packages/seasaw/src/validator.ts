

import { type } from "arktype";

import type { Context, Handler } from "./types";
import { attempt } from "./utils";
import { badRequest } from "./response";

export function  validator<T>(
	schema: (data: unknown) => T | type.errors,
	handler: Handler<T>,
) {
	return async (context: Context) => {
    const { req } = context;
		const { data: body, error } = await attempt(() => req.json());
		if (error) {
			console.error(`${req.url}-${req.method} parsed body failed`);
			return badRequest({
				message: "Invalid JSON in request body",
				code: "E000400",
			});
		}

		const parsed = schema(body);
		if (parsed instanceof type.errors) {
			console.error(parsed.summary);
			return badRequest({ message: parsed.summary });
		}

		context.body = parsed;

		return handler(context as Context<T>);
	};
}
