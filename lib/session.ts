const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
async function getKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function createSession(userId: string) {
  const secret = process.env.THRYV_SESSION_SECRET;
  if (!secret) throw new Error("THRYV_SESSION_SECRET is not configured");
  const payload = toBase64Url(encoder.encode(JSON.stringify({ v: 2, sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })));
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return payload + "." + toBase64Url(new Uint8Array(signature));
}
export async function getSessionSubject(token?: string): Promise<string | null> {
  try {
    const secret = process.env.THRYV_SESSION_SECRET;
    if (!secret || !token) return null;
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(payload));
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (data.v !== 2 || typeof data.sub !== "string" || !data.sub || typeof data.exp !== "number" || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch { return null; }
}
export async function verifySession(token?: string) {
  return (await getSessionSubject(token)) !== null;
}
