export function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const value = match?.[1];
  return value ? decodeURIComponent(value) : undefined;
}

const OPT_OUT_COOKIE = "privacy_opt_out";
const OPT_OUT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export function setDoNotSellOptOut(optedOut: boolean) {
  if (optedOut) {
    document.cookie = `${OPT_OUT_COOKIE}=true; path=/; max-age=${OPT_OUT_MAX_AGE_SECONDS}; SameSite=Lax`;
  } else {
    document.cookie = `${OPT_OUT_COOKIE}=; path=/; max-age=0`;
  }
}

export function hasDoNotSellOptOut(): boolean {
  return getCookie(OPT_OUT_COOKIE) === "true";
}
