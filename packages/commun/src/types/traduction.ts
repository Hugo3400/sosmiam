import type { Langue } from "../regles/langues.ts";

export type Traduction<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Traduction<R>
    : T extends object
      ? { readonly [K in keyof T]: Traduction<T[K]> }
      : T;

export type ParLangue<T> = Readonly<Record<Langue, T>>;
