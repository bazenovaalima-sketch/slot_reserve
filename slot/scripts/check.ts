import "dotenv/config";
import { db } from "../src/lib/db";
import { getAvailableSlots } from "../src/lib/availability";
import { localToUtc, todayLocalStr, minToHHMM } from "../src/lib/time";

async function main() {
  const studio = await db.studio.findFirstOrThrow({ include: { services: true, masters: true } });
  const today = todayLocalStr();
  const service = studio.services.find((s) => s.durationMin === 90)!; // маникюр+гель 90м
  const aigerim = studio.masters.find((m) => m.name === "Айгерим")!;

  // 1) Доступность для конкретного мастера учитывает занятую запись 11:00–12:30
  const slots = await getAvailableSlots({
    studioId: studio.id,
    serviceId: service.id,
    masterId: aigerim.id,
    dateStr: today,
  });
  const times = slots.map((s) => minToHHMM(s.startMin));
  const blocksBusy = !times.includes("11:00") && !times.includes("11:30") && !times.includes("12:00");
  console.log(`1) Слотов у Айгерим: ${slots.length}. Занятое окно 11:00–12:30 исключено: ${blocksBusy ? "OK" : "FAIL"}`);

  // 2) Гонка за слот: пытаемся создать две пересекающиеся записи на 15:00
  const start = localToUtc(today, 900); // 15:00
  const end = localToUtc(today, 990); // 16:30
  const client = await db.client.create({ data: { name: "Тест", phone: "+7700" } });

  async function tryBook() {
    return db.$transaction(async (tx) => {
      const clash = await tx.appointment.findFirst({
        where: { masterId: aigerim.id, status: "booked", startsAt: { lt: end }, endsAt: { gt: start } },
      });
      if (clash) return false;
      await tx.appointment.create({
        data: { masterId: aigerim.id, serviceId: service.id, clientId: client.id, startsAt: start, endsAt: end },
      });
      return true;
    });
  }
  const first = await tryBook();
  const second = await tryBook();
  console.log(`2) Двойная бронь на 15:00 — первая: ${first ? "создана" : "нет"}, вторая: ${second ? "СОЗДАНА (FAIL)" : "отклонена (OK)"}`);

  // 3) "Любой свободный": в занятое у Айгерим время 11:00 слот всё равно есть (другой мастер)
  const anySlots = await getAvailableSlots({
    studioId: studio.id,
    serviceId: service.id,
    masterId: "any",
    dateStr: today,
  });
  const has11 = anySlots.some((s) => minToHHMM(s.startMin) === "11:00");
  console.log(`3) "Любой мастер" на 11:00 доступен через другого мастера: ${has11 ? "OK" : "FAIL"}`);

  // чистим тестовые записи
  await db.appointment.deleteMany({ where: { clientId: client.id } });
  await db.client.delete({ where: { id: client.id } });
}

main().then(() => process.exit(0));
