import { asc } from "drizzle-orm";

import { db } from "@/db";
import { services } from "@/db/schema";
import { formatDuration, formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

import { DeleteServiceForm } from "./delete-service-form";
import { ServiceForm } from "./service-form";

export default async function ServicesPage() {
  await requireAdmin();

  const allServices = await db
    .select()
    .from(services)
    .orderBy(asc(services.name));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Services</h1>
        <p className="text-sm text-muted">
          Duration sets how long the booking blocks the shop.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-base font-medium">Add a service</h2>
        <ServiceForm />
      </section>

      <section className="flex flex-col gap-4">
        {allServices.length === 0 ? (
          <p className="text-sm text-muted">
            No services yet. Customers cannot book until at least one exists.
          </p>
        ) : null}

        {allServices.map((service) => (
          <article
            key={service.id}
            className="rounded-xl border border-line bg-surface p-4"
          >
            <header className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-base font-medium">{service.name}</h2>
              <span className="text-sm text-muted">
                {formatDuration(service.durationHours)} ·{" "}
                {formatPrice(service.price)}
              </span>
            </header>

            <ServiceForm service={service} />

            <DeleteServiceForm serviceId={service.id} />
          </article>
        ))}
      </section>
    </div>
  );
}
