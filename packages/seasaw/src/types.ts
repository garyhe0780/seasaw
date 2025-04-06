import type { type } from "arktype";
import type { BunRequest } from "bun";
import type { Operation } from "effection";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "CUSTOM";

export type Middleware<T = any> = (context: T) => Operation<void>;

export type Static = {
	path: string;
	response: Response;
};

export type Route<T = unknown> = {
	path: string;
	method: Method;
	handler: Handler<T>;
	options?: RouteHooks;
};

export type Handler<T = unknown> = (
	context: Context<T>,
) =>
	| Response
	| Promise<Response>
	| Operation<Response>
	| Generator<never, Response, unknown>;

export interface Context<T = unknown> {
	req: BunRequest;
	state: Record<string, unknown>;
	params: Record<string, string>;
	body?: T;
}

export interface Options {
	port?: number;
	prefix?: string;
}

export interface RouteHooks {
	before?: Middleware;
	body: (data: unknown) => any | type.errors;
}
