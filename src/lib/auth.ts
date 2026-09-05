// Simple edge-compatible session utility using Web Crypto API

const JWT_SECRET = process.env.JWT_SECRET || "bda-crm-super-secret-key-change-in-production-12345";

// Safe UTF-8 Base64URL encoder
function toBase64Url(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64url");
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// Safe UTF-8 Base64URL decoder
function fromBase64Url(b64url: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64url, "base64url").toString("utf-8");
  }
  let base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return decodeURIComponent(escape(atob(base64)));
}

// Convert secret string to CryptoKey
async function getCryptoKey() {
  const enc = new TextEncoder();
  const keyData = enc.encode(JWT_SECRET);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Generate JWT token (Persistent session for 30 days)
export async function signJWT(payload: any): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();

  // Add expiration (30 days persistent login)
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const fullPayload = { ...payload, exp };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(fullPayload));

  const signData = enc.encode(`${headerB64}.${payloadB64}`);
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign("HMAC", key, signData);

  const sigB64 = toBase64Url(String.fromCharCode(...new Uint8Array(signature)));

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<any | null> {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const enc = new TextEncoder();
    const signData = enc.encode(`${headerB64}.${payloadB64}`);

    // Reconstruct signature bytes
    const sigStr = fromBase64Url(sigB64);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const key = await getCryptoKey();
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, signData);
    if (!isValid) return null;

    // Decode payload
    const payloadStr = fromBase64Url(payloadB64);
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return null;
  }
}

export async function verifySession(request: Request): Promise<any | null> {
  try {
    const cookiesHeader = request.headers.get("cookie") || "";
    const token = cookiesHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    if (!token) return null;
    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.userId) return null;

    try {
      const { getUserById } = await import("./services");
      const user = await getUserById(decoded.userId);
      if (user) {
        if (user.isTrashed || !user.isActive) return null; // Account explicitly disabled
        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          roleName: user.roleName || user.role?.name || decoded.roleName || "BDA",
          workLocation: decoded.workLocation || "Office"
        };
      }
    } catch (dbErr) {
      // If DB connection is slow or reconnecting, fall back to verified JWT claims so user isn't kicked out
      console.warn("verifySession DB lookup warning, falling back to verified JWT session:", dbErr);
    }

    // Return verified token payload
    return {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      roleId: decoded.roleId,
      roleName: decoded.roleName || "BDA",
      workLocation: decoded.workLocation || "Office"
    };
  } catch (error) {
    console.error("verifySession error:", error);
    return null;
  }
}

export async function signTempJWT(payload: any, expirySeconds = 900): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();

  const exp = Math.floor(Date.now() / 1000) + expirySeconds;
  const fullPayload = { ...payload, exp, temp: true };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(fullPayload));

  const signData = enc.encode(`${headerB64}.${payloadB64}`);
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign("HMAC", key, signData);

  const sigB64 = toBase64Url(String.fromCharCode(...new Uint8Array(signature)));

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

export async function getTempSession(request: Request): Promise<any | null> {
  try {
    const cookiesHeader = request.headers.get("cookie") || "";
    const tempToken = cookiesHeader.split(";").find(c => c.trim().startsWith("temp_token="))?.split("=")[1];
    if (!tempToken) return null;
    const decoded = await verifyJWT(tempToken);
    if (!decoded || !decoded.temp) return null;
    return decoded;
  } catch (error) {
    console.error("getTempSession error:", error);
    return null;
  }
}
