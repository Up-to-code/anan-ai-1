export const ANONYMOUS_CHAT = {
  MAX_MESSAGES: 10,
  STORAGE_KEY: "anan_anonymous_messages",
} as const;

export const CACHE = {
  DEFAULT_DURATION_MS: 5000,
  TOKEN_DURATION_MS: 2000,
} as const;

export const AUTH = {
  COOLDOWN_SECONDS: 30,
  OTP_LENGTH: 6,
} as const;

export const CHAT = {
  MAX_TITLE_LENGTH: 50,
  INITIAL_MESSAGES_COUNT: 50,
} as const;
