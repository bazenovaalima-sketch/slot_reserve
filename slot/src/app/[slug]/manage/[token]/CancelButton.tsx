"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelAppointment } from "@/app/actions";

export default function CancelButton({ token }: { token: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-2xl border border-line bg-surface py-3.5 font-medium text-danger hover:border-danger"
      >
        Отменить запись
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setConfirming(false)}
        className="flex-1 rounded-2xl border border-line bg-surface py-3.5 font-medium"
      >
        Оставить
      </button>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            await cancelAppointment({ token });
            router.refresh();
          })
        }
        className="flex-1 rounded-2xl bg-danger py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Отменяем…" : "Да, отменить"}
      </button>
    </div>
  );
}
