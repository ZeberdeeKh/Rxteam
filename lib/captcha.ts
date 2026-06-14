// Проста математична капча: a + b, чотири варіанти відповіді.
export function makeChallenge() {
  const a = 1 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 8);
  const answer = a + b;

  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const delta = Math.floor(Math.random() * 7) - 3;
    const candidate = answer + delta;
    if (candidate > 0) options.add(candidate);
  }
  const shuffled = [...options].sort(() => Math.random() - 0.5);

  return { a, b, answer, options: shuffled };
}
