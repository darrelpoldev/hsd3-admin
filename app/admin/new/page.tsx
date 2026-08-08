import { asc } from "drizzle-orm";

import { db } from "@/db";
import { services } from "@/db/schema";
import { requireSession } from "@/lib/session";

import { ManualBookingForm } from "./manual-booking-form";

export default async function ManualBookingPage() {
  await requireSession();

  const allServices = await db
    .select()
    .from(services)
    .orderBy(asc(services.name));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Walk-in or phone booking</h1>
        <p className="text-sm text-slate-600">
          Lands as pending, exactly like a customer request.
        </p>
      </header>

      <ManualBookingForm services={allServices} />
    </div>
  );
}
