import { type BunRequest } from "bun";

export function error(code: number, values: Record<string, unknown>) {
	return Response.json(values, {
		status: code,
	});
}

/**
 * Create a JSON response.
 * 
 * @example
 * ```ts
 * json("OK")
 * ```
 */
export function json(values: unknown, status = 200) {
	return Response.json(values, { status });
}

export function badRequest(values: unknown, status = 400) {
	return Response.json(values, {
		status,
	});
}


/**
 * Create an empty response with status code 404: No content.
 * 
 * @example
 * ```ts
 * notContent(204)
 * ```
 */
export function notFound() {
	return notContent(404);
}

/**
 * Create an empty response with the given status code.
 * 
 * @example
 * ```ts
 * notContent(204)
 * ```
 */
export function notContent(status = 204) {
	return new Response(null, { status });
}

/**
 * Create an empty response with the status code 405: Method Not Allowed.
 *
 * @example
 * ```ts
 * methodNotAllowed()
 * ```
 */
export function methodNotAllowed() {
	return notContent(405);	
}

export function redirect(url: string, status = 303) {
	return new Response(null, {
		status,
		headers: {
			Location: url,
		},
	});
}

/**
 * Create an empty response with the status code 200: OK.
 *
 * @example
 * ```ts
 * ok()
 * ```
 */
export function ok() {
	return notContent(200);
}

/**
 * Create an empty response with the status code 201: Created.
 *
 * @example
 * ```ts
 * ok()
 * ```
 */
export function created() {
	return notContent(201);
}

/**
 * Create an empty response with the status code 202: Accepted.
 *
 * @example
 * ```ts
 * ok()
 * ```
 */
export function accepted() {
	return notContent(202);
}

/**
 * Extracts and parses query parameters from a Bun request URL.
 * 
 * @param request - The Bun request object containing the URL to parse
 * @returns An object containing the query parameters. If a parameter appears multiple times,
 *          its values are combined into an array. Otherwise, single values are returned as strings.
 * 
 * @example
 * ```ts
 * // For URL: /api?name=john&age=25
 * const query = getQuery(request);
 * // Returns: { name: "john", age: "25" }
 * 
 * // For URL: /api?tag=red&tag=blue
 * const query = getQuery(request);
 * // Returns: { tag: ["red", "blue"] }
 * ```
 */
export function getQuery(request: BunRequest) {
	const url = new URL(request.url);
	const entries = Array.from(url.searchParams.entries());

	return entries.reduce(
		(acc, [key, value]) => {
			if (acc[key]) {
				acc[key] = [acc[key]].flat().concat(value);
			} else {
				acc[key] = value;
			}
			return acc;
		},
		{} as Record<string, string | string[]>,
	);
}

/**
 * Get a specific parameter from the request params.
 * 
 * @param request - The Bun request object containing the parameters
 * @param key - The key of the parameter to retrieve
 * @returns The value of the specified parameter
 * 
 * @example
 * ```ts
 * // For route "/user/:id"
 * const id = getParams(request, "id");
 * ```
 */
export function getParam(request: BunRequest, key: string): string | undefined {
	return (request.params as { [key: string]: string })[key];
}
