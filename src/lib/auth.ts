// Simple edge-compatible session utility using Web Crypto API

const JWT_SECRET = process.env.JWT_SECRET || "bda-crm-super-secret-key-change-in-production-12345";

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

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signData = enc.encode(`${headerB64}.${payloadB64}`);
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign("HMAC", key, signData);

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<any | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const enc = new TextEncoder();
    const signData = enc.encode(`${headerB64}.${payloadB64}`);

    // Reconstruct signature bytes
    const sigStr = atob(sigB64.replace(/-/g, "+").replace(/_/g, "/"));
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const key = await getCryptoKey();
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, signData);
    if (!isValid) return null;

    // Decode payload
    const payloadStr = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
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
    if (!decoded) return null;

    const { getUserById } = await import("./services");
    const user = await getUserById(decoded.userId);
    if (!user || user.isTrashed || !user.isActive) return null;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName || user.role?.name || "BDA",
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

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signData = enc.encode(`${headerB64}.${payloadB64}`);
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign("HMAC", key, signData);

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

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
