import Link from "next/link";
import { db } from "@/lib/db";
import Logo from "@/components/Logo";
import { duration, tenge } from "@/lib/format";

export default async function Home() {
  const studio = await db.studio.findFirst({
    include: {
      services: { where: { isActive: true }, orderBy: { priceKzt: "asc" } },
      masters: { where: { isActive: true } },
    },
  });
  if (!studio) return null;

  return (
    <main className="blush min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <Logo />
          <Link
            href="/admin"
            className="rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur transition hover:border-brand hover:text-brand"
          >
            Кабинет
          </Link>
        </header>

        <section className="mt-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Маникюр · педикюр · уход
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] text-ink">
            Запишитесь
            <br />
            за 30 секунд
          </h1>
          <p className="mt-4 text-muted">
            Выберите услугу, мастера и удобное время. Без переписки и звонков — увидите только
            реально свободные окна.
          </p>

          <div className="mt-6 flex items-center gap-2 text-sm text-ink/70">
            <span aria-hidden>📍</span>
            <span>{studio.address}</span>
            <span className="text-line">·</span>
            <span>{studio.masters.length} мастера</span>
          </div>
        </section>

        <section className="mt-8 space-y-2">
          {studio.services.slice(0, 3).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface/80 px-4 py-3 backdrop-blur"
            >
              <span className="text-sm font-medium">{s.name}</span>
              <span className="text-sm text-muted">
                {duration(s.durationMin)} · {tenge(s.priceKzt)}
              </span>
            </div>
          ))}
        </section>

        <div className="mt-auto pt-10">
          <Link
            href={`/${studio.slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-semibold text-white shadow-[0_12px_32px_-12px_rgba(219,79,134,0.8)] transition hover:bg-brand-deep"
          >
            Записаться онлайн
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-3 text-center text-xs text-muted">
            {studio.phone} · ежедневно 10:00–20:00
          </p>
        </div>
      </div>
    </main>
  );
}
