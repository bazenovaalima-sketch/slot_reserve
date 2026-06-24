import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { utcToLocalMin, minToHHMM, humanDate, todayLocalStr } from "@/lib/time";
import { tenge } from "@/lib/format";
import CancelButton from "./CancelButton";

function toDateStr(d: Date): string {
  return new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 10);
}

export default async function ManagePage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const appt = await db.appointment.findUnique({
    where: { manageToken: token },
    include: { service: true, master: true, client: true },
  });
  if (!appt) notFound();

  const dateStr = toDateStr(appt.startsAt);
  const cancelled = appt.status === "cancelled";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-10">
      <Link href={`/${slug}`} className="text-sm text-muted hover:text-ink">
        ‹ К записи
      </Link>

      <h1 className="mt-6 text-2xl font-semibold">Ваша запись</h1>

      <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
        <Row label="Услуга" value={appt.service.name} />
        <Row label="Мастер" value={appt.master.name} />
        <Row label="Когда" value={`${humanDate(dateStr)}, ${minToHHMM(utcToLocalMin(appt.startsAt))}`} />
        <Row label="Стоимость" value={tenge(appt.service.priceKzt)} last />
      </div>

      {cancelled ? (
        <p className="mt-6 rounded-xl border border-line bg-bg px-4 py-3 text-center text-sm text-muted">
          Запись отменена. Слот снова свободен для других.
        </p>
      ) : dateStr < todayLocalStr() ? (
        <p className="mt-6 text-center text-sm text-muted">Эта запись уже в прошлом.</p>
      ) : (
        <div className="mt-6 space-y-3">
          <Link
            href={`/${slug}`}
            className="block w-full rounded-2xl bg-brand py-3.5 text-center font-semibold text-white hover:brightness-105"
          >
            Перенести (записаться заново)
          </Link>
          <CancelButton token={token} />
          <p className="text-center text-xs text-muted">
            Отмена освобождает слот — его сможет занять другой клиент.
          </p>
        </div>
      )}
    </main>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-2 text-sm ${
        last ? "" : "border-b border-line/70"
      }`}
    >
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
