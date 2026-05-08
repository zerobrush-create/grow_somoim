export const firstText = (...values: Array<string | null | undefined>) =>
  values.map((value) => value?.trim()).find(Boolean) ?? "";

export const shortUserId = (userId?: string | null) => (userId ? userId.slice(0, 8) : "");

export const fallbackUserName = (userId?: string | null, base = "사용자") => {
  const shortId = shortUserId(userId);
  return shortId ? `${base} ${shortId}` : base;
};

export const fullName = (firstName?: string | null, lastName?: string | null) =>
  [firstName, lastName].map((part) => part?.trim()).filter(Boolean).join(" ");
