import { describe, expect, it } from "vitest";

import { getAccessTokenFromRequest } from "@/lib/privy-server";

describe("MCP request auth extraction", () => {
  it("does not treat an arbitrary cookie as a Privy session", () => {
    const request = new Request("http://localhost/mcp", {
      headers: { cookie: "theme=dark; session=not-privy" },
    });

    expect(getAccessTokenFromRequest(request)).toBeNull();
  });

  it("reads only the privy-token cookie or bearer header", () => {
    const cookieRequest = new Request("http://localhost/mcp", {
      headers: { cookie: "other=abc; privy-token=session-from-cookie" },
    });
    const bearerRequest = new Request("http://localhost/mcp", {
      headers: { authorization: "Bearer session-from-header" },
    });

    expect(getAccessTokenFromRequest(cookieRequest)).toBe("session-from-cookie");
    expect(getAccessTokenFromRequest(bearerRequest)).toBe("session-from-header");
  });
});
