export function tenge(v: number): string {
  return `${v.toLocaleString("ru-RU")} ₸`;
}

export function duration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} ч ${m} мин`;
  if (h) return `${h} ч`;
  return `${m} мин`;
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/** Депозит против неявок: ~30% цены, кратно 500, минимум 1000 ₸. */
export function depositFor(priceKzt: number): number {
  return Math.max(1000, Math.round((priceKzt * 0.3) / 500) * 500);
}
