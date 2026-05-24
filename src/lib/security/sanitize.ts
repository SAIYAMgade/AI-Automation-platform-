import sanitizeHtml from "sanitize-html";

export function sanitizeUserText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();
}

export function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase();
}

export function normalizePhone(value?: string) {
  return value?.replace(/[^\d+]/g, "").replace(/^\+?91?/, (prefix) =>
    prefix.startsWith("+91") ? "+91" : prefix,
  );
}

export function normalizeInstagram(value?: string) {
  return value?.trim().toLowerCase().replace(/^@/, "");
}
