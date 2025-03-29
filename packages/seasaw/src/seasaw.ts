import { main, spawn, suspend, useScope, type Operation } from "effection";
import { type Server, type BunRequest } from "bun";

import type { Context, DecideLater, Handler, Method, Middleware, Options, Route } from "./types";
import { validator } from "./validator";
import { createContext } from "./context";
import { type } from "arktype";
import { until } from "./utils";

export class Seasaw {
  options: Options;
  server: Server | null = null;
  private middlewareStack: Middleware<Context>[] = [];
  private routesStack: Route[] = [];

  constructor(options?: Options) {
    this.options = {
      port: 3000,
      prefix: "",
      ...options,
    }
  }

  use(middleware: Middleware<Context>): this {
    this.middlewareStack.push(middleware);
    return this;
  }

  get(path: string, handler: Handler, options?: DecideLater): this {
    return this.createRoute("GET", path, handler, options);
  }

  post<T = unknown>(
    path: string,
    handler: Handler,
    options?: DecideLater & { body?: (data: unknown) => T | type.errors }
  ): this {
    return this.createRoute<T>("POST", path, handler, options);
  }

  put(path: string, handler: Handler, options?: DecideLater): this {
    return this.createRoute("PUT", path, handler, options);
  }

  patch(path: string, handler: Handler, options?: DecideLater): this {
    return this.createRoute("PATCH", path, handler, options);
  }

  delete(path: string, handler: Handler, options?: DecideLater): this {
    return this.createRoute("DELETE", path, handler, options);
  }

  custom(path: string, handler: Handler, options?: DecideLater): this {
    return this.createRoute("CUSTOM", path, handler, options);
  }

  private createRoute<T = unknown>(method: Method, path: string, handler: Handler, options?: DecideLater & { body?: (data: unknown) => T | type.errors }): this {
    this.routesStack.push({
      path,
      method,
      handler,
      options,
    });

    return this;
  }

  *handleRequest(req: BunRequest): Operation<Response> {
    const context = createContext(req);

    try {
      yield* this.runMiddleware(context);
      return Response.json(true);
    } catch (error) {
      return Response.json({
        error: "Internal error"
      }, {
        status: 500
      });
    }
  }


  private *runMiddleware(context: Context): Operation<void> {
    for (const middleware of this.middlewareStack) {
      yield* spawn(function* () {
        yield* middleware(context);
      });
    }
  }

  start(callback?: () => void) {
    main(function* (this: Seasaw) {
      const scope = yield* useScope();
      this.server = Bun.serve({
        port: this.options.port,
        routes: this.routesStack.reduce((acc, curr) => {
          const handler = curr.options?.body ? validator(curr.options.body, curr.handler) : curr.handler;

          acc[curr.path] = {
            ...acc[curr.path],
            [curr.method]: async (req: BunRequest) => {
              const data = await scope.run(function* () {
                const result = handler(createContext(req));
                if (result instanceof Response) {
                  return result;
                }

                return result instanceof Promise ? yield* until(result) : yield* result;
              });

              return data;
            }
          }

          return acc;
        }, {} as {
          [path: string]: {
            [method: string]: (req: BunRequest) => Promise<Response>
          }
        }),
        fetch(req) {
          return Response.json("Not Found", {
            status: 404
          });
        }
      });

      callback?.();

      try {
        yield* suspend();
      } finally {
        yield* until(this.server.stop());
      }
    }.bind(this));
  }
}

export { Operation }

