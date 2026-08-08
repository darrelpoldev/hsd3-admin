import { formatInTimeZone } from "date-fns-tz";

import { SHOP_TIME_ZONE } from "./availability";

const priceFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

export function formatPrice(price: string): string {
  return priceFormatter.format(Number(price));
}

export function formatShopTime(instant: Date): string {
  return formatInTimeZone(instant, SHOP_TIME_ZONE, "h:mm a");
}

export function formatShopDate(instant: Date): string {
  return formatInTimeZone(instant, SHOP_TIME_ZONE, "EEEE d MMMM yyyy");
}

export function formatShopDay(instant: Date): string {
  return formatInTimeZone(instant, SHOP_TIME_ZONE, "yyyy-MM-dd");
}

export function formatDuration(hours: number): string {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}
