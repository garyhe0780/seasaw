import type { BunRequest, Server } from "bun";
import { type Operation, type Scope, main, spawn, suspend, useScope } from "effection";

import type { type } from "arktype";
import { createContext } from "./context";
import type {
	Context,
	RouteHooks,
	Handler,
	Method,
	Middleware,
	Options,
	Route,
	Static,
} from "./types";
import { until } from "./utils";
import { validator } from "./validator";

export class Seasaw {
	options: Options;
	server: Server | null = null;
	private staticStack: Static[] = [];
	private routesStack: Route[] = [];
	private middlewareStack: Middleware<Context>[] = [];

	constructor(options?: Options) {
		this.options = {
			port: 3000,
			prefix: "",
			...options,
		};
	}

	static(path: string, response: Response): this {
		this.staticStack.push({
			path,
			response,
		});

		return this;
	}

	get(path: string, handler: Handler, options?: RouteHooks): this {
		return this.createRoute("GET", path, handler, options);
	}

	post(
		path: string,
		handler: Handler,
		options?: RouteHooks,
	): this {
		return this.createRoute("POST", path, handler, options);
	}

	put(path: string, handler: Handler, options?: RouteHooks): this {
		return this.createRoute("PUT", path, handler, options);
	}

	patch(path: string, handler: Handler, options?: RouteHooks): this {
		return this.createRoute("PATCH", path, handler, options);
	}

	delete(path: string, handler: Handler, options?: RouteHooks): this {
		return this.createRoute("DELETE", path, handler, options);
	}

	custom(path: string, handler: Handler, options?: RouteHooks): this {
		return this.createRoute("CUSTOM", path, handler, options);
	}

	group(router: Seasaw): this;
	group(path: string, router: Seasaw): this;
	group(pathOrRouter: string | Seasaw, maybeRouter?: Seasaw): this {
		if (pathOrRouter instanceof Seasaw) {
			this.routesStack.push(
				...pathOrRouter.routesStack.map((route) => ({
					...route,
					path: `${pathOrRouter.options.prefix ?? ""}${route.path}`,
				})),
			);
		} else if (pathOrRouter && maybeRouter) {
			this.routesStack.push(
				...maybeRouter.routesStack.map((route) => ({
					...route,
					path: `${pathOrRouter}${maybeRouter.options.prefix ?? ""}${route.path}`,
				})),
			);
		}

		return this;
	}

	use(middleware: Middleware<Context>): this {
		this.middlewareStack.push(middleware);
		return this;
	}

	*handleRequest(req: BunRequest): Operation<Response> {
		const context = createContext(req);

		try {
			yield* this.runMiddleware(context);
			return Response.json(true);
		} catch (error) {
			return Response.json(
				{
					error: "Internal error",
				},
				{
					status: 500,
				},
			);
		}
	}

	start(callback?: () => void) {
		main(
			function* (this: Seasaw) {
				const scope = yield* useScope();
				this.server = Bun.serve({
					port: this.options.port,
					routes: {
						...this.mapToStatic(),
						...this.mapToRoutes(scope),
					},
					fetch(req) {
						return Response.json("Not Found", {
							status: 404,
						});
					},
				});

				callback?.();

				try {
					yield* suspend();
				} finally {
					yield* until(this.server.stop());
				}
			}.bind(this),
		);
	}

	private createRoute(
		method: Method,
		path: string,
		handler: Handler,
		options?: RouteHooks,
	): this {
		this.routesStack.push({
			path,
			method,
			handler,
			options,
		});

		return this;
	}

	private *runMiddleware(context: Context): Operation<void> {
		for (const middleware of this.middlewareStack) {
			yield* spawn(function* () {
				yield* middleware(context);
			});
		}
	}

	private mapToRoutes(scope: Scope) {
		return this.routesStack.reduce(
			(acc, curr) => {
				const handler = curr.options?.body
					? validator(curr.options.body, curr.handler)
					: curr.handler;

				acc[curr.path] = {
					...acc[curr.path],
					[curr.method]: async (req: BunRequest): Promise<Response> => {
						const data = await scope.run(function* () {
							const result = handler(createContext(req));
							if (result instanceof Response) {
								return result;
							}

							return result instanceof Promise
								? yield* until(result)
								: yield* result;
						});

						return data as unknown as Promise<Response>;
					},
				};
				return acc;
			},
			{} as {
				[path: string]: {
					[method: string]: ((req: BunRequest) => Promise<Response>);
				};
			},
		);
	}

	private mapToStatic() {
		return this.staticStack.reduce<Record<string, Response>>(
			(acc, curr) => {
				acc[curr.path] = curr.response;
				return acc;
			},
			{},
		);
	}	
}
