import { PrivyClient } from "@privy-io/node";

import { getWalletAddress } from "@/lib/wallet-address";

let privyClient: PrivyClient | null = null;

export function getPrivyServerClient() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    return null;
  }

  if (!privyClient) {
    privyClient = new PrivyClient({
      appId,
      appSecret,
      ...(process.env.PRIVY_JWT_VERIFICATION_KEY
        ? { jwtVerificationKey: process.env.PRIVY_JWT_VERIFICATION_KEY }
        : {}),
    });
  }

  return privyClient;
}

export async function verifyPrivyAccessToken(accessToken: string) {
  const client = getPrivyServerClient();

  if (!client) {
    return Boolean(accessToken);
  }

  try {
    await client.utils().auth().verifyAccessToken(accessToken);
    return true;
  } catch {
    return false;
  }
}

export function getAccessTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) {
      return token;
    }
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "privy-token") {
      const value = rest.join("=").trim();
      return value.length > 0 ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

export async function getSolanaWalletAddressFromAccessToken(accessToken: string) {
  const client = getPrivyServerClient();
  if (!client) {
    throw new Error("Privy is not configured.");
  }

  const verified = await client.utils().auth().verifyAccessToken(accessToken);
  const user = await client.users()._get(verified.user_id);
  return getWalletAddress(user);
}
