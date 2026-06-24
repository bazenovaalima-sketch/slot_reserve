import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white">
        S
      </span>
      <h1 className="mt-6 text-3xl font-semibold leading-tight">
        Slot — запись в студию
        <br />
        без переписки
      </h1>
      <p className="mt-3 text-muted">
        Клиент записывается сам по ссылке, видит только реально свободное время. Никаких
        двойных броней и сгоревших слотов.
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href="/aigerim"
          className="flex items-center justify-between rounded-2xl bg-brand p-4 text-white transition hover:brightness-105"
        >
          <span>
            <span className="block font-semibold">Демо: страница записи</span>
            <span className="block text-sm text-white/80">глазами клиента</span>
          </span>
          <span className="text-xl">→</span>
        </Link>
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:border-brand"
        >
          <span>
            <span className="block font-semibold">Кабинет студии</span>
            <span className="block text-sm text-muted">день мастеров глазами Айгерим</span>
          </span>
          <span className="text-xl text-brand">→</span>
        </Link>
      </div>

      <p className="mt-10 text-xs text-muted">
        Прототип к тестовому заданию · ключевой флоу — самозапись клиента.
      </p>
    </main>
  );
}
