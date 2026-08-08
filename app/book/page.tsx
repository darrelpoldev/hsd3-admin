import { asc } from "drizzle-orm";

import { db } from "@/db";
import { services } from "@/db/schema";

import {
  BrandStripe,
  SHOP_TAGLINE,
  ShopContact,
  Wordmark,
} from "@/app/brand";
import { ThemeToggle } from "@/app/theme-toggle";

import { BookingForm } from "./booking-form";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const allServices = await db
    .select()
    .from(services)
    .orderBy(asc(services.name));

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <Wordmark />
          <ThemeToggle />
        </div>

        <BrandStripe />

        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl uppercase">
            Book an appointment
          </h1>
          <p className="text-sm text-muted">
            {SHOP_TAGLINE}. Pick your services and a time, and we will call you
            to confirm.
          </p>
        </div>
      </header>

      {allServices.length === 0 ? (
        <p className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn-ink">
          No services are set up yet. Please call the shop.
        </p>
      ) : (
        <BookingForm services={allServices} />
      )}

      <ShopContact />
    </main>
  );
}
