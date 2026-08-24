import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",

  mongoUri: required("MONGODB_URI", "mongodb://localhost:27017/inventory-booking"),

  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",

  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Inventory Booking <noreply@example.com>",

  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",

  adminSeedEmail: process.env.ADMIN_SEED_EMAIL ?? "admin@example.com",
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD ?? "change-me-admin-password",
  adminInviteSecret: process.env.ADMIN_INVITE_SECRET ?? "",

  disableDateWindowCheck: process.env.DISABLE_DATE_WINDOW_CHECK === "true"
};
