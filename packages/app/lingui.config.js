import { formatter } from "@lingui/format-json";

export default {
  locales: ["en", "es", "fr", "de"],
  catalogs: [
    {
      path: "src/i18n/locales/{locale}/messages",
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    },
  ],
  format: formatter({ style: "minimal" }),
  orderBy: "messageId",
};
