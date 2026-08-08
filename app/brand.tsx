export const SHOP_NAME = "HSD3 Overland Outfitter";
export const SHOP_PHONE = "431.293.7260";
export const SHOP_PHONE_HREF = "+14312937260";
export const SHOP_ADDRESS = "11 Valde Ave, Winnipeg, MB";
export const SHOP_TAGLINE = "Winnipeg's 4x4 & overland shop";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-2 font-display uppercase leading-none">
      <span
        className={compact ? "text-xl tracking-tight" : "text-4xl tracking-tight"}
      >
        HSD3
      </span>
      <span
        className={
          compact
            ? "text-[0.6rem] leading-3 text-accent-text"
            : "text-xs leading-3 text-accent-text sm:text-sm"
        }
      >
        Overland
        <br />
        Outfitter
      </span>
    </span>
  );
}

export function BrandStripe() {
  return <div aria-hidden className="brand-stripe h-2 w-full rounded-full" />;
}

export function ShopContact() {
  return (
    <footer className="mt-8 flex flex-col gap-1 border-t border-line pt-4 text-sm text-muted">
      <a href={`tel:${SHOP_PHONE_HREF}`} className="underline">
        {SHOP_PHONE}
      </a>
      <span>{SHOP_ADDRESS}</span>
    </footer>
  );
}
