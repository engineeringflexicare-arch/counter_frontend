export async function revalidatePWA(urls: string[]) {
  let baseUrl = process.env.NEXT_PUBLIC_HOST;
  if (!baseUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_HOST is not set in production.");
    }
    baseUrl = "http://localhost:3000";
  }

  const res = await fetch(`${baseUrl}/api/pwa/revalidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      urls,
      secret: process.env.REVALIDATION_SECRET,
    }),
  });
  return res.json();
}
