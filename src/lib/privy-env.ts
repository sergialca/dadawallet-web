export function getPrivyAppId() {
  return process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
}

export function getPrivyClientId() {
  return process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? "";
}

export function isPrivyClientConfigured() {
  return getPrivyAppId().length > 0;
}
