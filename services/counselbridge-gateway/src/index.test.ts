import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./index.js";

describe("counselbridge gateway", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      service: "counselbridge-gateway",
    });
  });

  it("returns fallback NDA review shape without an API key", async () => {
    const response = await request(app)
      .post("/v1/workflows/nda-review")
      .send({
        message: "Review this NDA.",
        documents: [
          {
            id: "doc_1",
            filename: "nda.docx",
            text: "Confidentiality terms.",
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("fallback");
    expect(response.body.workflow).toBe("commercial.nda-review");
    expect(response.body.artifacts?.[0]?.type).toBe("docx");
    expect(response.body.verification.researchConnectorUsed).toBe(false);
  });
});
