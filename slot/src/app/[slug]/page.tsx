import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BookingFlow from "./BookingFlow";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true } },
      masters: { where: { isActive: true } },
    },
  });
  if (!studio) notFound();

  return (
    <BookingFlow
      studio={{ id: studio.id, name: studio.name, slug: studio.slug }}
      services={studio.services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMin: s.durationMin,
        priceKzt: s.priceKzt,
      }))}
      masters={studio.masters.map((m) => ({ id: m.id, name: m.name, color: m.color }))}
    />
  );
}
