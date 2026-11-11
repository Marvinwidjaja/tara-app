// Runs before the web build on Vercel (see vercel.json). The backend's address is baked into the
// app at build time, so a missing or local EXPO_PUBLIC_API_URL would ship an app that can't reach
// its backend. Fail the build instead.
const url = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!url) {
  console.error(
    '[check-deploy-env] EXPO_PUBLIC_API_URL is not set. In the Vercel project for the app, add it under\n' +
      'Settings → Environment Variables (e.g. https://tara-api.vercel.app), then redeploy.'
  );
  process.exit(1);
}
if (!/^https:\/\//.test(url) || /localhost|127\.0\.0\.1/.test(url)) {
  console.error(`[check-deploy-env] EXPO_PUBLIC_API_URL must be the deployed backend's https:// address, not "${url}".`);
  process.exit(1);
}
console.log(`[check-deploy-env] API: ${url}`);
