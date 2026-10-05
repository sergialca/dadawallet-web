import { PrivyClient } from "@privy-io/node";

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
