import { hash } from "@node-rs/argon2";
import postgres from "postgres";

const WEEKDAY_HOURS = [
  { weekday: 0, opensAt: "09:00", closesAt: "17:00", isClosed: true },
  { weekday: 1, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { weekday: 2, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { weekday: 3, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { weekday: 4, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { weekday: 5, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { weekday: 6, opensAt: "09:00", closesAt: "15:00", isClosed: false },
];

const DEFAULT_HORIZON_DAYS = 90;
const DEFAULT_MIN_NOTICE_HOURS = 24;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

const sql = postgres(requireEnv("DATABASE_URL"), { prepare: false });

for (const day of WEEKDAY_HOURS) {
  await sql`
    insert into opening_hours (weekday, opens_at, closes_at, is_closed)
    values (${day.weekday}, ${day.opensAt}, ${day.closesAt}, ${day.isClosed})
    on conflict (weekday) do nothing`;
}

await sql`
  insert into settings (id, horizon_days, min_notice_hours)
  values (1, ${DEFAULT_HORIZON_DAYS}, ${DEFAULT_MIN_NOTICE_HOURS})
  on conflict (id) do nothing`;

const username = requireEnv("BOOTSTRAP_ADMIN_USERNAME");
const passwordHash = await hash(requireEnv("BOOTSTRAP_ADMIN_PASSWORD"));

const inserted = await sql`
  insert into users (username, password_hash, role)
  values (${username}, ${passwordHash}, 'admin')
  on conflict (username) do nothing
  returning id`;

console.log(
  inserted.length
    ? `bootstrap admin created: ${username}`
    : `bootstrap admin already exists, left untouched: ${username}`,
);
console.log("opening hours and settings seeded");

await sql.end();
