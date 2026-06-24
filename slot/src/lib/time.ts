// Время студии. Допущение прототипа: один часовой пояс Asia/Almaty = UTC+5,
// без перехода на летнее время. Записи храним как UTC-инстанты, а рабочие часы
// и слоты считаем в локальных минутах от полуночи.

export const STUDIO_OFFSET_MIN = 300; // UTC+5
export const SLOT_STEP_MIN = 30; // шаг сетки слотов

const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

/** "YYYY-MM-DD" + минуты локального дня -> UTC Date (инстант). */
export function localToUtc(dateStr: string, minOfDay: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  return new Date(utcMidnight + (minOfDay - STUDIO_OFFSET_MIN) * 60_000);
}

/** UTC Date -> минуты локального дня студии. */
export function utcToLocalMin(date: Date): number {
  const local = new Date(date.getTime() + STUDIO_OFFSET_MIN * 60_000);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

/** День недели (0=Вс) для локальной даты студии. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Минуты текущего момента в локальном дне студии для данной даты (или Infinity, если дата в будущем, -Infinity если в прошлом). */
export function nowLocalMinForDate(dateStr: string): number {
  const today = todayLocalStr();
  if (dateStr > today) return -Infinity; // весь день в будущем — всё доступно
  if (dateStr < today) return Infinity; // прошлый день — ничего не доступно
  return utcToLocalMin(new Date());
}

/** Сегодняшняя локальная дата студии как "YYYY-MM-DD". */
export function todayLocalStr(): string {
  const local = new Date(Date.now() + STUDIO_OFFSET_MIN * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Прибавить n дней к "YYYY-MM-DD". */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Человекочитаемая дата: "Чт, 26 июня". */
const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июня", "июля", "авг", "сен", "окт", "ноя", "дек"];
export function humanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const wd = WEEKDAYS[weekdayOf(dateStr)];
  return `${wd}, ${d} ${MONTHS[m - 1]}`;
}

export function weekdayShort(dateStr: string): string {
  return WEEKDAYS[weekdayOf(dateStr)];
}

export function dayNum(dateStr: string): number {
  return Number(dateStr.split("-")[2]);
}
