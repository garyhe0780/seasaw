import { type Operation, call } from "effection";

type Success<T> = {
	data: T;
	error: null;
};

type Failure<E> = {
	data: null;
	error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

export async function attempt<T, E = Error>(
	fn: () => T | PromiseLike<T>,
): Promise<Result<T, E>> {
	return Promise.try(fn)
		.then((data) => {
			return { data, error: null };
		})
		.catch((error) => {
			return { data: null, error: error as E };
		});
}

export function until<T>(promise: Promise<T>): Operation<T> {
	return call(() => promise);
}
