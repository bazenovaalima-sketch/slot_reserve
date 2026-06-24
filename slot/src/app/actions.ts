"use server";

import { db } from "@/lib/db";
import { getAvailableSlots, type Slot } from "@/lib/availability";
import { localToUtc } from "@/lib/time";
import { revalidatePath } from "next/cache";

/** Свободные слоты для шага выбора времени. */
export async function fetchSlots(params: {
  studioId: string;
  serviceId: string;
  masterId: string;
  dateStr: string;
}): Promise<Slot[]> {
  return getAvailableSlots(params);
}

export type BookResult =
  | { ok: true; manageToken: string; masterName: string }
  | { ok: false; reason: "taken" | "invalid" | "past" };

/**
 * Создание записи с защитой от накладки.
 * Перепроверяем пересечение внутри транзакции — если слот успели занять
 * между показом и подтверждением, честно возвращаем reason:"taken".
 */
export async function book(params: {
  studioId: string;
  serviceId: string;
  masterId: string;
  dateStr: string;
  startMin: number;
  name: string;
  phone: string;
}): Promise<BookResult> {
  const { serviceId, masterId, dateStr, startMin, name, phone } = params;

  if (!name.trim() || !phone.trim()) return { ok: false, reason: "invalid" };

  const service = await db.service.findUnique({ where: { id: serviceId } });
  const master = await db.master.findUnique({ where: { id: masterId } });
  if (!service || !master) return { ok: false, reason: "invalid" };

  const startsAt = localToUtc(dateStr, startMin);
  const endsAt = localToUtc(dateStr, startMin + service.durationMin);
  if (startsAt.getTime() <= Date.now()) return { ok: false, reason: "past" };

  try {
    const result = await db.$transaction(async (tx) => {
      // Перепроверка пересечения: любая booked-запись этого мастера,
      // у которой start < endsAt и end > startsAt.
      const clash = await tx.appointment.findFirst({
        where: {
          masterId,
          status: "booked",
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
      if (clash) return null;

      const client = await tx.client.create({ data: { name: name.trim(), phone: phone.trim() } });
      return tx.appointment.create({
        data: {
          masterId,
          serviceId,
          clientId: client.id,
          startsAt,
          endsAt,
        },
      });
    });

    if (!result) return { ok: false, reason: "taken" };

    revalidatePath("/admin");
    return { ok: true, manageToken: result.manageToken, masterName: master.name };
  } catch {
    return { ok: false, reason: "taken" };
  }
}

/** Отмена записи (админом по id или клиентом по manageToken). */
export async function cancelAppointment(params: {
  id?: string;
  token?: string;
}): Promise<{ ok: boolean }> {
  const where = params.id ? { id: params.id } : params.token ? { manageToken: params.token } : null;
  if (!where) return { ok: false };
  await db.appointment.updateMany({ where, data: { status: "cancelled" } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Отметка неявки / выполнено (для кабинета мастера). */
export async function setStatus(id: string, status: "no_show" | "done" | "booked"): Promise<void> {
  await db.appointment.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
}
