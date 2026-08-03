import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "../app/api/battle/route";

describe("POST /api/battle", () => {
  it("returns a generic 400 response for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/battle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid request body" });
  });
});
