import { db } from "@/lib/db";
import {
  SLOT_STEP_MIN,
  localToUtc,
  utcToLocalMin,
  weekdayOf,
  nowLocalMinForDate,
} from "@/lib/time";

export type Slot = {
  startMin: number;
  endMin: number;
  masterId: string;
  masterName: string;
};

const MIN_LEAD_MIN = 0; // насколько впритык можно записаться (буфер до старта)

/**
 * Свободные слоты на дату = рабочие часы − существующие записи,
 * нарезанные под длительность услуги, по сетке SLOT_STEP_MIN.
 * masterId = "any" -> агрегируем по всем активным мастерам.
 */
export async function getAvailableSlots(params: {
  studioId: string;
  serviceId: string;
  masterId: string; // конкретный id или "any"
  dateStr: string;
}): Promise<Slot[]> {
  const { studioId, serviceId, masterId, dateStr } = params;

  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) return [];
  const duration = service.durationMin;
  const weekday = weekdayOf(dateStr);
  const nowMin = nowLocalMinForDate(dateStr);

  const masters = await db.master.findMany({
    where: {
      studioId,
      isActive: true,
      ...(masterId !== "any" ? { id: masterId } : {}),
    },
    include: {
      workingHours: { where: { weekday } },
    },
  });
  if (masters.length === 0) return [];

  // Все записи этих мастеров на этот день (в UTC-границах локального дня).
  const dayStart = localToUtc(dateStr, 0);
  const dayEnd = localToUtc(dateStr, 24 * 60);
  const appts = await db.appointment.findMany({
    where: {
      masterId: { in: masters.map((m) => m.id) },
      status: "booked",
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
    },
  });
  const busyByMaster = new Map<string, { s: number; e: number }[]>();
  for (const a of appts) {
    const arr = busyByMaster.get(a.masterId) ?? [];
    arr.push({ s: utcToLocalMin(a.startsAt), e: utcToLocalMin(a.endsAt) });
    busyByMaster.set(a.masterId, arr);
  }

  // Для "any" дедуплицируем по времени — берём первого свободного мастера.
  const byTime = new Map<number, Slot>();

  for (const master of masters) {
    const busy = busyByMaster.get(master.id) ?? [];
    for (const wh of master.workingHours) {
      for (
        let start = wh.startMin;
        start + duration <= wh.endMin;
        start += SLOT_STEP_MIN
      ) {
        const end = start + duration;
        if (start < nowMin + MIN_LEAD_MIN) continue; // в прошлом / впритык
        const overlaps = busy.some((b) => start < b.e && end > b.s);
        if (overlaps) continue;
        if (!byTime.has(start)) {
          byTime.set(start, {
            startMin: start,
            endMin: end,
            masterId: master.id,
            masterName: master.name,
          });
        }
      }
    }
  }

  return [...byTime.values()].sort((a, b) => a.startMin - b.startMin);
}
