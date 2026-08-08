import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const tstzrange = customType<{ data: string }>({
  dataType: () => "tstzrange",
});

export const bookingStatus = pgEnum("booking_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
  "no_show",
]);

export const userRole = pgEnum("user_role", ["admin", "staff"]);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    durationHours: integer("duration_hours").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("services_duration_hours_positive", sql`${table.durationHours} > 0`),
    check("services_price_not_negative", sql`${table.price} >= 0`),
  ],
);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    status: bookingStatus("status").notNull().default("pending"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    timeWindow: tstzrange("time_window").generatedAlwaysAs(
      sql`tstzrange(starts_at, ends_at, '[)')`,
    ),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("bookings_window_ordered", sql`${table.endsAt} > ${table.startsAt}`),
  ],
);

export const bookingServices = pgTable("booking_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationHours: integer("duration_hours").notNull(),
});

export const openingHours = pgTable(
  "opening_hours",
  {
    weekday: smallint("weekday").primaryKey(),
    opensAt: time("opens_at").notNull(),
    closesAt: time("closes_at").notNull(),
    isClosed: boolean("is_closed").notNull().default(false),
  },
  (table) => [
    check(
      "opening_hours_weekday_range",
      sql`${table.weekday} between 0 and 6`,
    ),
    check("opening_hours_ordered", sql`${table.closesAt} > ${table.opensAt}`),
  ],
);

export const settings = pgTable(
  "settings",
  {
    id: smallint("id").primaryKey().default(1),
    horizonDays: integer("horizon_days").notNull(),
    minNoticeHours: integer("min_notice_hours").notNull(),
  },
  (table) => [
    check("settings_single_row", sql`${table.id} = 1`),
    check("settings_horizon_days_positive", sql`${table.horizonDays} > 0`),
    check(
      "settings_min_notice_hours_not_negative",
      sql`${table.minNoticeHours} >= 0`,
    ),
  ],
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
