/** Вордмарк салона: монограмма + «Aigerim's / BEAUTY SALON». */
export default function Logo({ size = "sm" }: { size?: "sm" | "lg" }) {
  const lg = size === "lg";
  return (
    <div className="flex items-center gap-3">
      <span
        className={`relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-white shadow-[0_6px_20px_-8px_rgba(219,79,134,0.7)] ${
          lg ? "h-14 w-14" : "h-10 w-10"
        }`}
      >
        <span className={`font-display font-semibold leading-none ${lg ? "text-2xl" : "text-lg"}`}>
          A
        </span>
        <span
          className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30"
          aria-hidden
        />
      </span>
      <span className="leading-none">
        <span
          className={`font-display font-semibold tracking-tight text-ink ${
            lg ? "text-3xl" : "text-xl"
          }`}
        >
          Aigerim&rsquo;s
        </span>
        <span
          className={`mt-0.5 block uppercase text-gold ${
            lg ? "text-[0.7rem] tracking-[0.32em]" : "text-[0.55rem] tracking-[0.28em]"
          }`}
        >
          Beauty Salon
        </span>
      </span>
    </div>
  );
}
