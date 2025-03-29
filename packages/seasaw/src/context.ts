import { type BunRequest } from "bun";
import type { Context } from "./types";

export function createContext<T>(req: BunRequest): Context<T> {
  return {
    req,
    state: {},
    params: {},
  };
}
