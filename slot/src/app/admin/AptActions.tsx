"use client";

import { useTransition } from "react";
import { cancelAppointment, setStatus, markReminded } from "@/app/actions";

export default function AptActions({
  id,
  status,
  reminded,
  confirmed,
}: {
  id: string;
  status: string;
  reminded: boolean;
  confirmed: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      {status === "booked" && (
        <>
          {!reminded && !confirmed && (
            <button
              disabled={pending}
              onClick={() => start(async () => void (await markReminded(id)))}
              className="rounded-lg border border-line px-2 py-1 font-medium text-gold hover:border-gold disabled:opacity-40"
            >
              Напомнить
            </button>
          )}
          <button
            disabled={pending}
            onClick={() => start(async () => void (await setStatus(id, "no_show")))}
            className="rounded-lg border border-line px-2 py-1 font-medium text-muted hover:border-danger hover:text-danger disabled:opacity-40"
          >
            Не пришёл
          </button>
          <button
            disabled={pending}
            onClick={() => start(async () => void (await setStatus(id, "done")))}
            className="rounded-lg border border-line px-2 py-1 font-medium text-muted hover:border-ok hover:text-ok disabled:opacity-40"
          >
            Выполнено
          </button>
          <button
            disabled={pending}
            onClick={() => start(async () => void (await cancelAppointment({ id })))}
            className="ml-auto rounded-lg px-2 py-1 font-medium text-muted hover:text-danger disabled:opacity-40"
          >
            Отменить
          </button>
        </>
      )}
      {status !== "booked" && (
        <button
          disabled={pending}
          onClick={() => start(async () => void (await setStatus(id, "booked")))}
          className="rounded-lg border border-line px-2 py-1 font-medium text-muted hover:border-brand disabled:opacity-40"
        >
          Вернуть
        </button>
      )}
    </div>
  );
}
