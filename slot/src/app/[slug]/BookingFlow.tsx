"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { fetchSlots, book } from "@/app/actions";
import type { Slot } from "@/lib/availability";
import {
  todayLocalStr,
  addDays,
  humanDate,
  weekdayShort,
  dayNum,
  minToHHMM,
} from "@/lib/time";
import { tenge, duration, initial } from "@/lib/format";

type Service = { id: string; name: string; durationMin: number; priceKzt: number };
type Master = { id: string; name: string; title: string; color: string };
type Studio = { id: string; name: string; slug: string; address: string };

const ANY: Master = {
  id: "any",
  name: "Любой свободный",
  title: "первое свободное окно",
  color: "#caa6b6",
};
const DAYS_AHEAD = 14;

type Step = 1 | 2 | 3 | 4 | 5;

export default function BookingFlow({
  studio,
  services,
  masters,
}: {
  studio: Studio;
  services: Service[];
  masters: Master[];
}) {
  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<Service | null>(null);
  const [master, setMaster] = useState<Master | null>(null);
  const [dateStr, setDateStr] = useState<string>(todayLocalStr());
  const [slot, setSlot] = useState<Slot | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [done, setDone] = useState<{ manageToken: string; masterName: string } | null>(null);

  const dates = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(todayLocalStr(), i));

  // подгрузка слотов при выборе услуги/мастера/даты на шаге 3
  useEffect(() => {
    if (step !== 3 || !service || !master) return;
    let alive = true;
    setLoadingSlots(true);
    setSlot(null);
    fetchSlots({
      studioId: studio.id,
      serviceId: service.id,
      masterId: master.id,
      dateStr,
    }).then((res) => {
      if (!alive) return;
      setSlots(res);
      setLoadingSlots(false);
    });
    return () => {
      alive = false;
    };
  }, [step, service, master, dateStr, studio.id]);

  function reset() {
    setStep(1);
    setService(null);
    setMaster(null);
    setDateStr(todayLocalStr());
    setSlot(null);
    setName("");
    setPhone("");
    setError(null);
    setDone(null);
  }

  function confirm() {
    if (!service || !master || !slot) return;
    setError(null);
    startTransition(async () => {
      const res = await book({
        studioId: studio.id,
        serviceId: service.id,
        masterId: slot.masterId, // конкретный мастер слота (важно для «любой»)
        dateStr,
        startMin: slot.startMin,
        name,
        phone,
      });
      if (res.ok) {
        setDone({ manageToken: res.manageToken, masterName: res.masterName });
        setStep(5);
      } else if (res.reason === "taken") {
        setError("Этот слот только что заняли. Выберите другое время.");
        setStep(3);
      } else if (res.reason === "past") {
        setError("Это время уже прошло. Выберите другое.");
        setStep(3);
      } else {
        setError("Заполните имя и телефон.");
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10">
      <Header
        address={studio.address}
        step={step}
        onBack={
          step > 1 && step < 5
            ? () => {
                setError(null);
                setStep((s) => (s - 1) as Step);
              }
            : undefined
        }
      />

      {/* STEP 1 — услуга */}
      {step === 1 && (
        <section className="rise space-y-3">
          <StepTitle k="Шаг 1 из 4" title="Какая услуга?" />
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setService(s);
                setStep(2);
              }}
              className="group flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-brand hover:shadow-[0_4px_24px_-12px_rgba(124,92,246,0.5)]"
            >
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="mt-0.5 text-sm text-muted">{duration(s.durationMin)}</div>
              </div>
              <div className="text-right font-semibold text-brand">{tenge(s.priceKzt)}</div>
            </button>
          ))}
        </section>
      )}

      {/* STEP 2 — мастер */}
      {step === 2 && (
        <section className="rise space-y-3">
          <StepTitle k="Шаг 2 из 4" title="К кому?" />
          {[ANY, ...masters].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMaster(m);
                setStep(3);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-brand hover:shadow-[0_4px_24px_-12px_rgba(124,92,246,0.5)]"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: m.color }}
              >
                {m.id === "any" ? "✦" : initial(m.name)}
              </span>
              <span className="leading-tight">
                <span className="block font-medium">{m.name}</span>
                {m.title && <span className="block text-sm text-muted">{m.title}</span>}
              </span>
            </button>
          ))}
        </section>
      )}

      {/* STEP 3 — дата + время */}
      {step === 3 && service && master && (
        <section className="rise">
          <StepTitle k="Шаг 3 из 4" title="Когда удобно?" />
          {error && <ErrorBanner text={error} />}

          <div className="-mx-4 mb-5 overflow-x-auto px-4">
            <div className="flex gap-2">
              {dates.map((d) => {
                const active = d === dateStr;
                return (
                  <button
                    key={d}
                    onClick={() => setDateStr(d)}
                    className={`flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2 transition ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-surface text-ink hover:border-brand"
                    }`}
                  >
                    <span className={`text-xs ${active ? "text-white/80" : "text-muted"}`}>
                      {weekdayShort(d)}
                    </span>
                    <span className="text-lg font-semibold leading-tight">{dayNum(d)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {loadingSlots ? (
            <SlotsSkeleton />
          ) : slots.length === 0 ? (
            <EmptyDay />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((sl) => (
                <button
                  key={`${sl.masterId}-${sl.startMin}`}
                  onClick={() => {
                    setSlot(sl);
                    setStep(4);
                  }}
                  className="rounded-xl border border-line bg-surface py-2.5 text-center font-medium transition hover:border-brand hover:bg-brand-soft"
                >
                  {minToHHMM(sl.startMin)}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* STEP 4 — контакты + подтверждение */}
      {step === 4 && service && master && slot && (
        <section className="rise space-y-4">
          <StepTitle k="Шаг 4 из 4" title="Almost done" titleRu="Почти готово" />

          <Summary
            service={service}
            masterName={master.id === "any" ? slot.masterName : master.name}
            dateStr={dateStr}
            startMin={slot.startMin}
          />

          {error && <ErrorBanner text={error} />}

          <div className="space-y-3">
            <Field
              label="Имя"
              value={name}
              onChange={setName}
              placeholder="Как вас зовут?"
              autoFocus
            />
            <Field
              label="Телефон"
              value={phone}
              onChange={setPhone}
              placeholder="+7 ___ ___ __ __"
              type="tel"
            />
          </div>

          <button
            onClick={confirm}
            disabled={pending || !name.trim() || !phone.trim()}
            className="w-full rounded-2xl bg-brand py-3.5 font-semibold text-white transition hover:brightness-105 disabled:opacity-40"
          >
            {pending ? "Записываем…" : `Записаться на ${minToHHMM(slot.startMin)}`}
          </button>
          <p className="text-center text-xs text-muted">
            Напомним о записи за день и за 2 часа — без переписки.
          </p>
        </section>
      )}

      {/* STEP 5 — успех */}
      {step === 5 && done && service && (
        <section className="rise flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ok text-3xl text-white">
            ✓
          </div>
          <h2 className="mt-5 text-xl font-semibold">Вы записаны!</h2>
          <p className="mt-1 text-muted">
            {humanDate(dateStr)}, {minToHHMM(slot!.startMin)} · {done.masterName}
          </p>

          <div className="mt-6 w-full rounded-2xl border border-line bg-surface p-4 text-left">
            <Row label="Услуга" value={service.name} />
            <Row label="Мастер" value={done.masterName} />
            <Row label="Когда" value={`${humanDate(dateStr)}, ${minToHHMM(slot!.startMin)}`} />
            <Row label="Стоимость" value={tenge(service.priceKzt)} last />
          </div>

          <Link
            href={`/${studio.slug}/manage/${done.manageToken}`}
            className="mt-4 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Перенести или отменить
          </Link>

          <button
            onClick={reset}
            className="mt-6 w-full rounded-2xl border border-line bg-surface py-3 font-medium hover:border-brand"
          >
            Новая запись
          </button>
        </section>
      )}
    </main>
  );
}

/* ——— подкомпоненты ——— */

function Header({
  address,
  step,
  onBack,
}: {
  address: string;
  step: Step;
  onBack?: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-5 bg-bg/80 px-4 pb-3 pt-5 backdrop-blur">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-lg"
            aria-label="Назад"
          >
            ‹
          </button>
        )}
        <Logo />
        {address && (
          <span className="ml-auto text-right text-xs text-muted">{address}</span>
        )}
      </div>
      {step < 5 && (
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i <= step ? "bg-brand" : "bg-line"
              }`}
            />
          ))}
        </div>
      )}
    </header>
  );
}

function StepTitle({ k, title, titleRu }: { k: string; title: string; titleRu?: string }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-medium uppercase tracking-wide text-brand">{k}</div>
      <h1 className="mt-1 text-2xl font-semibold">{titleRu ?? title}</h1>
    </div>
  );
}

function Summary({
  service,
  masterName,
  dateStr,
  startMin,
}: {
  service: Service;
  masterName: string;
  dateStr: string;
  startMin: number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-brand-soft/60 p-4">
      <Row label="Услуга" value={service.name} />
      <Row label="Мастер" value={masterName} />
      <Row label="Когда" value={`${humanDate(dateStr)}, ${minToHHMM(startMin)}`} />
      <Row label="Стоимость" value={tenge(service.priceKzt)} last />
    </div>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none transition focus:border-brand"
      />
    </label>
  );
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      {text}
    </div>
  );
}

function SlotsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-xl bg-line/60" />
      ))}
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
      В этот день свободных окон нет.
      <br />
      Попробуйте другую дату.
    </div>
  );
}
