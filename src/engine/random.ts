export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const pick = <T>(items: readonly T[], rng: Rng = Math.random): T => items[Math.floor(rng() * items.length)];

export const randomInt = (min: number, max: number, rng: Rng = Math.random) => min + Math.floor(rng() * (max - min + 1));

/**
 * Random draw without repetition until the pool is exhausted, then a new
 * shuffled cycle that never starts with the item just drawn.
 */
export class Bag<T> {
  private queue: T[] = [];
  private last: T | undefined;

  constructor(
    private readonly items: readonly T[],
    private readonly rng: Rng = Math.random,
  ) {
    if (items.length === 0) throw new Error("Bag vide");
  }

  next(): T {
    if (this.queue.length === 0) {
      this.queue = shuffle(this.items, this.rng);
      if (this.queue.length > 1 && this.queue[0] === this.last) this.queue.push(this.queue.shift()!);
    }
    this.last = this.queue.shift()!;
    return this.last;
  }

  take(count: number): T[] {
    const taken: T[] = [];
    while (taken.length < Math.min(count, this.items.length)) {
      const item = this.next();
      if (!taken.includes(item)) taken.push(item);
    }
    return taken;
  }
}
