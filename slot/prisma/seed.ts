import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { localToUtc, todayLocalStr, addDays } from "../src/lib/time";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  // чистим (порядок из-за внешних ключей)
  await db.appointment.deleteMany();
  await db.workingHours.deleteMany();
  await db.service.deleteMany();
  await db.master.deleteMany();
  await db.client.deleteMany();
  await db.studio.deleteMany();

  const studio = await db.studio.create({
    data: {
      name: "Aigerim's Beauty Salon",
      slug: "aigerim",
      address: "ул. Кабанбая, 56",
      phone: "+7 707 123 45 67",
      tz: "Asia/Almaty",
    },
  });

  const services = await Promise.all(
    [
      { name: "Маникюр + гель-лак", durationMin: 90, priceKzt: 8000 },
      { name: "Маникюр классический", durationMin: 60, priceKzt: 5000 },
      { name: "Педикюр + покрытие", durationMin: 120, priceKzt: 12000 },
      { name: "Снятие + уход", durationMin: 30, priceKzt: 3000 },
    ].map((s) => db.service.create({ data: { ...s, studioId: studio.id } }))
  );

  const mastersData = [
    { name: "Айгерим", title: "Топ-мастер · owner", color: "#e0568f", daysOff: [0] }, // вс выходной
    { name: "Динара", title: "Мастер маникюра", color: "#c06ad6", daysOff: [0, 1] }, // вс, пн выходной
    { name: "Сауле", title: "Мастер педикюра", color: "#f0934a", daysOff: [0] },
  ];

  const masters = [];
  for (const m of mastersData) {
    const master = await db.master.create({
      data: { studioId: studio.id, name: m.name, title: m.title, color: m.color },
    });
    // Пн–Сб 10:00–20:00, кроме выходных мастера
    for (let weekday = 0; weekday <= 6; weekday++) {
      if (m.daysOff.includes(weekday)) continue;
      await db.workingHours.create({
        data: { masterId: master.id, weekday, startMin: 600, endMin: 1200 },
      });
    }
    masters.push(master);
  }

  // Демо-клиент и пара записей на сегодня/завтра, чтобы видеть занятые слоты.
  const client = await db.client.create({
    data: { name: "Камила", phone: "+7 701 000 00 00" },
  });
  const today = todayLocalStr();
  const tomorrow = addDays(today, 1);
  await db.appointment.create({
    data: {
      masterId: masters[0].id,
      serviceId: services[0].id,
      clientId: client.id,
      startsAt: localToUtc(today, 660), // 11:00
      endsAt: localToUtc(today, 750), // 12:30
    },
  });
  await db.appointment.create({
    data: {
      masterId: masters[2].id,
      serviceId: services[1].id,
      clientId: client.id,
      startsAt: localToUtc(tomorrow, 840), // 14:00
      endsAt: localToUtc(tomorrow, 900), // 15:00
    },
  });

  console.log(
    `Seeded studio "${studio.name}" (/${studio.slug}) — ${masters.length} мастера, ${services.length} услуги.`
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
