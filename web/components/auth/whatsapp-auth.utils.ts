export const MIN_PHONE_DIGITS = 10;
export const MAX_PHONE_DIGITS = 15;

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
