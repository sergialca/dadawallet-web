// Streamable HTTP MCP: http://localhost:3000/mcp (or https://<host>/mcp)
// Wallet tools: Authorization: Bearer <privy-token>
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { createDadawalletMcpServer } from "@/lib/mcp/server";
import { getAccessTokenFromRequest, getSolanaWalletAddressFromAccessToken } from "@/lib/privy-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CorsHeaders = {
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, mcp-session-id, Last-Event-ID, mcp-protocol-version",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CorsHeaders)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

async function resolveWalletAddress(request: Request) {
  const token = getAccessTokenFromRequest(request);
  if (!token) {
    return null;
  }

  try {
    return await getSolanaWalletAddressFromAccessToken(token);
  } catch {
    return null;
  }
}

async function handleMcp(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });
  const server = createDadawalletMcpServer({
    walletAddress: await resolveWalletAddress(request),
  });
  await server.connect(transport);
  return withCors(await transport.handleRequest(request));
}

export function OPTIONS() {
  return new Response(null, { headers: CorsHeaders, status: 204 });
}

export function GET(request: Request) {
  return handleMcp(request);
}

export function POST(request: Request) {
  return handleMcp(request);
}

export function DELETE(request: Request) {
  return handleMcp(request);
}
