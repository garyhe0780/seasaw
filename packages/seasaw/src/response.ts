export function error(code: number, values: Record<string, unknown>) {
	return Response.json(values, {
		status: code,
	});
}

export function json(values: unknown) {
	return Response.json(values);
}

export function badRequest(values: unknown, status = 400) {
	return Response.json(values, {
		status,
	});
}

export function notFound(values: Record<string, unknown>) {
	return Response.json(values, {
		status: 404,
	});
}
