import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

type GatewayDocument = {
  id: string;
  filename: string;
  text: string;
};

type NdaReviewRequest = {
  message?: string;
  documents?: GatewayDocument[];
  matterId?: string;
  userRole?: "attorney" | "non-lawyer" | string;
  jurisdiction?: string;
};

type WorkflowPayload = {
  status: "completed" | "fallback";
  workflow: string;
  answerMarkdown: string;
  memoTitle: string;
  memoSections: { heading: string; content: string }[];
  verificationWarnings: string[];
};

export const app = express();
const port = Number(process.env.PORT ?? 3101);
const host = process.env.HOST ?? "127.0.0.1";
const model = process.env.COUNSELBRIDGE_CLAUDE_MODEL ?? "claude-sonnet-4-6";
const maxTokens = Number(process.env.COUNSELBRIDGE_MAX_TOKENS ?? 5000);

app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "counselbridge-gateway" });
});

app.post("/v1/workflows/nda-review", async (req, res) => {
  const body = req.body as NdaReviewRequest;
  const requestApiKey = readRequestApiKey(req.headers);
  const documents = Array.isArray(body.documents)
    ? body.documents.filter(
        (doc): doc is GatewayDocument =>
          !!doc &&
          typeof doc.id === "string" &&
          typeof doc.filename === "string" &&
          typeof doc.text === "string",
      )
    : [];

  try {
    const payload = await runNdaReview({
      message: body.message ?? "",
      documents,
      userRole: body.userRole ?? "attorney",
      jurisdiction: body.jurisdiction ?? "Not specified",
      apiKey: requestApiKey,
    });
    const docx = await buildDocx(payload.memoTitle, payload.memoSections);
    res.json({
      status: payload.status,
      workflow: payload.workflow,
      answerMarkdown: payload.answerMarkdown,
      artifacts: [
        {
          type: "docx",
          title: payload.memoTitle,
          filename: `${safeFilename(payload.memoTitle)}.docx`,
          contentBase64: docx.toString("base64"),
        },
      ],
      sources: documents.map((doc) => ({
        label: "user provided",
        documentId: doc.id,
        filename: doc.filename,
      })),
      verification: {
        researchConnectorUsed: false,
        warnings: payload.verificationWarnings,
      },
    });
  } catch (err) {
    console.error(
      "[counselbridge-gateway] nda-review failed",
      err instanceof Error ? err.message : String(err),
    );
    res.status(500).json({ status: "error", detail: "NDA review failed" });
  }
});

async function runNdaReview(input: {
  message: string;
  documents: GatewayDocument[];
  userRole: string;
  jurisdiction: string;
  apiKey?: string | null;
}): Promise<WorkflowPayload> {
  const fallback = fallbackPayload(input);
  const apiKey = input.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create(
    {
      model,
      max_tokens: maxTokens,
      system: [
        "You are CounselBridge, a legal workflow gateway.",
        "Apply a Claude Legal-style commercial NDA review workflow.",
        "Outputs are drafts for attorney review, not final legal advice.",
        "Do not invent citations. If no research connector is available, say so.",
        "Return only valid JSON.",
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
    },
    { signal: AbortSignal.timeout(180_000) },
  );
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = parseWorkflowPayload(text);
  if (!parsed) return fallback;
  const truncationWarnings = documentTruncationWarnings(input.documents);
  return {
    ...parsed,
    verificationWarnings: [
      ...parsed.verificationWarnings,
      ...truncationWarnings,
    ],
  };
}

function buildPrompt(input: {
  message: string;
  documents: GatewayDocument[];
  userRole: string;
  jurisdiction: string;
}): string {
  const docs = input.documents.map((doc) =>
    [
      `Document ID: ${doc.id}`,
      `Filename: ${doc.filename}`,
      "Text:",
      truncateDocumentText(doc.text),
    ].join("\n"),
  );

  return [
    `User role: ${input.userRole}`,
    `Jurisdiction: ${input.jurisdiction}`,
    "",
    "User request:",
    input.message,
    "",
    "Documents:",
    docs.length ? docs.join("\n\n---\n\n") : "(none)",
    "",
    "Return JSON with this exact shape:",
    JSON.stringify(
      {
        status: "completed",
        workflow: "commercial.nda-review",
        answerMarkdown: "Short chat answer.",
        memoTitle: "CounselBridge NDA Review Memo",
        memoSections: [
          { heading: "Reviewer Note", content: "..." },
          { heading: "Executive Summary", content: "..." },
          { heading: "Document Routing", content: "..." },
          { heading: "Flagged Issues", content: "..." },
          { heading: "Source And Verification Log", content: "..." },
          { heading: "Next Steps", content: "..." },
        ],
        verificationWarnings: ["No legal research connector was used."],
      },
      null,
      2,
    ),
  ].join("\n");
}

function parseWorkflowPayload(raw: string): WorkflowPayload | null {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  try {
    const parsed = JSON.parse(raw.slice(first, last + 1)) as WorkflowPayload;
    if (
      typeof parsed.workflow !== "string" ||
      typeof parsed.answerMarkdown !== "string" ||
      typeof parsed.memoTitle !== "string" ||
      !Array.isArray(parsed.memoSections)
    ) {
      return null;
    }
    return {
      status: "completed",
      workflow: parsed.workflow,
      answerMarkdown: parsed.answerMarkdown,
      memoTitle: parsed.memoTitle,
      memoSections: parsed.memoSections.filter(
        (section) =>
          section &&
          typeof section.heading === "string" &&
          typeof section.content === "string",
      ),
      verificationWarnings: Array.isArray(parsed.verificationWarnings)
        ? parsed.verificationWarnings.filter(
            (warning): warning is string => typeof warning === "string",
          )
        : [],
    };
  } catch {
    return null;
  }
}

function fallbackPayload(input: {
  message: string;
  documents: GatewayDocument[];
}): WorkflowPayload {
  const filenames =
    input.documents.map((doc) => doc.filename).join(", ") ||
    "no uploaded documents";
  return {
    status: "fallback",
    workflow: "commercial.nda-review",
    answerMarkdown:
      "CounselBridge created a downloadable Word memo for first-pass NDA review. This fallback path did not use a legal research connector or a configured playbook, so attorney review is required before relying on it.",
    memoTitle: "CounselBridge NDA Review Memo",
    memoSections: [
      {
        heading: "Reviewer Note",
        content:
          "Draft for attorney review. This output is not legal advice and is not a final legal conclusion.",
      },
      {
        heading: "Executive Summary",
        content:
          "YELLOW - attorney review recommended. CounselBridge cannot issue GREEN without an attorney-reviewed NDA playbook.",
      },
      {
        heading: "Document Routing",
        content: `Workflow: commercial NDA review. Source documents: ${filenames}.`,
      },
      {
        heading: "Flagged Issues",
        content:
          "Check mutuality, party roles, confidentiality definition, exclusions, compelled disclosure, term and survival, residuals, non-solicit or non-compete language, IP ownership, publicity, governing law, venue, fee shifting, and obligations beyond confidentiality.",
      },
      {
        heading: "Source And Verification Log",
        content: [
          "Sources are user-provided documents only. No legal research connector was used. No citations are verified.",
          ...documentTruncationWarnings(input.documents),
        ].join("\n"),
      },
      {
        heading: "Next Steps",
        content:
          "Configure a commercial NDA playbook, confirm the business side and purpose, then have counsel review any YELLOW or RED issues before signature.",
      },
    ],
    verificationWarnings: [
      "No Anthropic API key or structured Claude response was available.",
      "No legal research connector was used.",
    ],
  };
}

function truncateDocumentText(text: string): string {
  return text.slice(0, 24000);
}

function documentTruncationWarnings(documents: GatewayDocument[]): string[] {
  return documents
    .filter((doc) => doc.text.length > 24000)
    .map(
      (doc) =>
        `Document ${doc.filename} was truncated to approximately 24 KB before workflow processing.`,
    );
}

async function buildDocx(
  title: string,
  sections: { heading: string; content: string }[],
): Promise<Buffer> {
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, bold: true })],
    }),
    ...sections.flatMap((section) => [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: section.heading, bold: true })],
      }),
      ...section.content.split(/\n{2,}/).map(
        (paragraph) =>
          new Paragraph({
            children: [new TextRun(paragraph.trim())],
          }),
      ),
    ]),
  ];

  return Packer.toBuffer(
    new Document({
      sections: [{ properties: {}, children }],
    }),
  );
}

function safeFilename(value: string): string {
  return (
    value
      .replace(/[^a-zA-Z0-9 -]/g, "")
      .trim()
      .slice(0, 80) || "CounselBridge Document"
  );
}

function readRequestApiKey(
  headers: express.Request["headers"],
): string | null {
  const explicit = headers["x-anthropic-api-key"];
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim();
  }
  const auth = headers.authorization;
  const match = auth?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

if (process.env.NODE_ENV !== "test") {
  app.listen(port, host, () => {
    console.log(`CounselBridge Gateway listening on ${host}:${port}`);
  });
}
