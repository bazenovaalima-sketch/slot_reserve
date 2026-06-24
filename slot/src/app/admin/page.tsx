import Link from "next/link";
import { db } from "@/lib/db";
import {
  localToUtc,
  todayLocalStr,
  addDays,
  utcToLocalMin,
  minToHHMM,
  humanDate,
} from "@/lib/time";
import { initial } from "@/lib/format";
import Logo from "@/components/Logo";
import AptActions from "./AptActions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const dateStr = sp.date ?? todayLocalStr();

  const studio = await db.studio.findFirst({
    include: { masters: { where: { isActive: true } } },
  });
  if (!studio) {
    return <div className="p-8 text-center text-muted">Студия не настроена.</div>;
  }

  const dayStart = localToUtc(dateStr, 0);
  const dayEnd = localToUtc(dateStr, 24 * 60);
  const appts = await db.appointment.findMany({
    where: {
      master: { studioId: studio.id },
      startsAt: { lt: dayEnd, gte: dayStart },
      status: { not: "cancelled" },
    },
    include: { client: true, service: true },
    orderBy: { startsAt: "asc" },
  });

  const byMaster = new Map<string, typeof appts>();
  for (const a of appts) {
    const arr = byMaster.get(a.masterId) ?? [];
    arr.push(a);
    byMaster.set(a.masterId, arr);
  }

  const total = appts.filter((a) => a.status !== "no_show").length;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12">
      <header className="sticky top-0 z-10 -mx-4 bg-bg/85 px-4 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href={`/${studio.slug}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-brand"
          >
            Страница записи
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">
          Кабинет · {humanDate(dateStr)} · {total} записей
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={`/admin?date=${addDays(dateStr, -1)}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface"
          >
            ‹
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-brand"
          >
            Сегодня
          </Link>
          <Link
            href={`/admin?date=${addDays(dateStr, 1)}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface"
          >
            ›
          </Link>
        </div>
      </header>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {studio.masters.map((m) => {
          const list = byMaster.get(m.id) ?? [];
          return (
            <div key={m.id} className="rounded-2xl border border-line bg-surface p-3">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: m.color }}
                >
                  {initial(m.name)}
                </span>
                <span className="font-medium">{m.name}</span>
                <span className="ml-auto text-sm text-muted">{list.length}</span>
              </div>

              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line py-6 text-center text-sm text-muted">
                  Свободный день
                </p>
              ) : (
                <ul className="space-y-2">
                  {list.map((a) => (
                    <li
                      key={a.id}
                      className={`rounded-xl border p-3 ${
                        a.status === "no_show"
                          ? "border-danger/30 bg-danger/5"
                          : "border-line bg-bg"
                      }`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="font-semibold">
                          {minToHHMM(utcToLocalMin(a.startsAt))}–{minToHHMM(utcToLocalMin(a.endsAt))}
                        </span>
                        {a.status === "no_show" && (
                          <span className="text-xs font-medium text-danger">не пришёл</span>
                        )}
                        {a.status === "done" && (
                          <span className="text-xs font-medium text-ok">выполнено</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm">{a.client.name}</div>
                      <div className="text-xs text-muted">{a.service.name} · {a.client.phone}</div>
                      <AptActions id={a.id} status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
