const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env["JWT_SECRET"];
const stripeSecretKey = process.env['STRIPE_SECRET_KEY'];
const apiUrl = import.meta.env.NEXT_PUBLIC_API_URL;

export function config() {
  return {
    databaseUrl,
    jwtSecret,
    stripeSecretKey,
    apiUrl,
    port: 5173
  };
}
