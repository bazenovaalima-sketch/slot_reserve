"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmByClient } from "@/app/actions";

export default function ConfirmButton({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await confirmByClient(token);
          router.refresh();
        })
      }
      className="block w-full rounded-2xl bg-ok py-3.5 text-center font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
    >
      {pending ? "Подтверждаем…" : "Подтверждаю, приду ✓"}
    </button>
  );
}
