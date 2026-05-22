import fs from "fs";
import path from "path";
import { downloadFile } from "./storage";
import { extractDocxBodyText } from "./docxTrackedChanges";
import {
    extractPdfText,
    generateDocx,
    resolveDocLabel,
    type DocIndex,
    type DocStore,
} from "./chatTools";
import { completeText, type UserApiKeys } from "./llm";
import { createServerSupabase } from "./supabase";

type AttachedDocument = { filename: string; document_id: string };
type DisplayedDocument = { filename: string; document_id: string };

export type CounselBridgeArtifact = {
    type: "docx";
    title: string;
    filename: string;
    download_url: string;
    document_id?: string;
    version_id?: string;
    version_number?: number | null;
};

export type CounselBridgeEvent =
    | { type: "content"; text: string }
    | {
          type: "doc_created";
          filename: string;
          download_url: string;
          document_id?: string;
          version_id?: string;
          version_number?: number | null;
      };

type CounselBridgeResponse = {
    workflow: string;
    answerMarkdown: string;
    memoTitle: string;
    memoSections: { heading: string; content: string }[];
    verificationWarnings: string[];
};

type SourceDocument = {
    doc_id: string;
    document_id: string;
    filename: string;
    text: string;
};

const DEFAULT_MODEL = "claude-sonnet-4-6";
export const COUNSELBRIDGE_COMMERCIAL_REVIEW_WORKFLOW_ID =
    "builtin-counselbridge-claude-legal-commercial-review";
export const COUNSELBRIDGE_NDA_REVIEW_WORKFLOW_ID =
    "builtin-counselbridge-claude-legal-nda-review";

const COUNSELBRIDGE_WORKFLOW_PREFIX = "builtin-counselbridge-claude-legal-";

type CounselBridgeWorkflowDefinition = {
    id: string;
    title: string;
    plugin: string;
    practiceProfile?: string;
    skills: string[];
    candidateSkills?: string[];
    defaultWorkflow: string;
    defaultMemoTitle: string;
    defaultSections: string[];
    missingProfileDefault: string;
    description: string;
};

const WORKFLOW_DEFINITIONS: CounselBridgeWorkflowDefinition[] = [
    {
        id: COUNSELBRIDGE_COMMERCIAL_REVIEW_WORKFLOW_ID,
        title: "CounselBridge Commercial Review (Claude Legal Plugin)",
        plugin: "commercial-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["review"],
        candidateSkills: ["nda-review", "vendor-agreement-review", "saas-msa-review"],
        defaultWorkflow: "commercial.review",
        defaultMemoTitle: "CounselBridge Commercial Review Memo",
        defaultSections: [
            "Reviewer Note",
            "Executive Summary",
            "Document Routing",
            "Flagged Issues",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the commercial playbook or practice profile is missing, state the gap and do not issue a no-review approval.",
        description:
            "Generic commercial document review using the Claude Legal commercial-legal plugin router.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}corporate`,
        title: "Claude Legal - Corporate",
        plugin: "corporate-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["tabular-review"],
        candidateSkills: [
            "diligence-issue-extraction",
            "material-contract-schedule",
            "closing-checklist",
            "board-minutes",
            "written-consent",
            "entity-compliance",
            "deal-team-summary",
        ],
        defaultWorkflow: "corporate.general",
        defaultMemoTitle: "CounselBridge Corporate Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "Matter Or Document Routing",
            "Key Findings",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the corporate practice profile or deal playbook is missing, state the gap and treat outputs as leads requiring attorney verification.",
        description:
            "Corporate Legal plugin workflow for diligence, closing, governance, and entity-compliance tasks.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}litigation`,
        title: "Claude Legal - Litigation",
        plugin: "litigation-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["matter-intake"],
        candidateSkills: [
            "matter-briefing",
            "chronology",
            "claim-chart",
            "brief-section-drafter",
            "demand-draft",
            "subpoena-triage",
            "privilege-log-review",
            "deposition-prep",
            "legal-hold",
        ],
        defaultWorkflow: "litigation.general",
        defaultMemoTitle: "CounselBridge Litigation Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "Matter Routing",
            "Issue And Evidence Summary",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the litigation practice profile, matter file, or conflicts posture is missing, state the gap and do not imply the matter has been cleared.",
        description:
            "Litigation Legal plugin workflow for matter intake, chronologies, claim charts, demands, holds, and briefing.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}employment`,
        title: "Claude Legal - Employment",
        plugin: "employment-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["termination-review"],
        candidateSkills: [
            "worker-classification",
            "hiring-review",
            "wage-hour-qa",
            "leave-tracker",
            "internal-investigation",
            "policy-drafting",
            "handbook-updates",
        ],
        defaultWorkflow: "employment.general",
        defaultMemoTitle: "CounselBridge Employment Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "Matter Routing",
            "Risk Flags",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If jurisdiction, employee facts, or employment policy configuration is missing, state the gap and do not give a final risk clearance.",
        description:
            "Employment Legal plugin workflow for terminations, worker classification, hiring, leave, wage-hour, investigations, and policies.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}privacy`,
        title: "Claude Legal - Privacy",
        plugin: "privacy-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["dpa-review"],
        candidateSkills: [
            "use-case-triage",
            "pia-generation",
            "reg-gap-analysis",
            "dsar-response",
            "policy-monitor",
        ],
        defaultWorkflow: "privacy.general",
        defaultMemoTitle: "CounselBridge Privacy Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "Privacy Workflow Routing",
            "Risk Flags",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the privacy playbook, jurisdiction, data categories, controller/processor role, or policy commitments are missing, state the gap and require attorney privacy review.",
        description:
            "Privacy Legal plugin workflow for DPAs, PIAs, use-case triage, DSARs, and regulatory gap analysis.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}ai-governance`,
        title: "Claude Legal - AI Governance",
        plugin: "ai-governance-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["use-case-triage"],
        candidateSkills: [
            "ai-inventory",
            "aia-generation",
            "vendor-ai-review",
            "reg-gap-analysis",
            "policy-starter",
            "policy-monitor",
        ],
        defaultWorkflow: "ai-governance.general",
        defaultMemoTitle: "CounselBridge AI Governance Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "AI Use Or Vendor Routing",
            "Risk Flags",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the AI governance profile, risk taxonomy, inventory, or applicable regimes are missing, state the gap and avoid final approval.",
        description:
            "AI Governance Legal plugin workflow for AI use-case triage, vendor AI terms, impact assessments, inventories, and policy work.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}ip`,
        title: "Claude Legal - IP",
        plugin: "ip-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["ip-clause-review"],
        candidateSkills: [
            "clearance",
            "fto-triage",
            "infringement-triage",
            "oss-review",
            "cease-desist",
            "takedown",
            "invention-intake",
            "portfolio",
        ],
        defaultWorkflow: "ip.general",
        defaultMemoTitle: "CounselBridge IP Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "IP Workflow Routing",
            "Risk Flags",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the IP profile, jurisdiction, ownership facts, portfolio context, or search/research connector is missing, state the gap and do not issue clearance.",
        description:
            "IP Legal plugin workflow for IP clauses, clearance, FTO triage, infringement triage, OSS review, takedowns, and portfolio work.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}product`,
        title: "Claude Legal - Product",
        plugin: "product-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["launch-review"],
        candidateSkills: [
            "feature-risk-assessment",
            "is-this-a-problem",
            "marketing-claims-review",
        ],
        defaultWorkflow: "product.general",
        defaultMemoTitle: "CounselBridge Product Legal Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "Product Workflow Routing",
            "Risk Flags",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the product risk calibration, launch facts, market, users, or claim substantiation are missing, state the gap and avoid final approval.",
        description:
            "Product Legal plugin workflow for launch review, feature risk assessment, marketing claims, and issue triage.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}regulatory`,
        title: "Claude Legal - Regulatory",
        plugin: "regulatory-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["gaps"],
        candidateSkills: [
            "gap-surfacer",
            "policy-diff",
            "policy-redraft",
            "comments",
            "reg-feed-watcher",
        ],
        defaultWorkflow: "regulatory.general",
        defaultMemoTitle: "CounselBridge Regulatory Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "Regulatory Workflow Routing",
            "Gap Analysis",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the regulatory profile, policy library, jurisdiction, source rule, or effective date is missing, state the gap and require verification against primary sources.",
        description:
            "Regulatory Legal plugin workflow for gap analysis, policy diffs, redrafts, comments, and monitoring.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}legal-clinic`,
        title: "Claude Legal - Legal Clinic",
        plugin: "legal-clinic",
        practiceProfile: "CLAUDE.md",
        skills: ["client-intake"],
        candidateSkills: [
            "research-start",
            "memo",
            "draft",
            "client-letter",
            "deadlines",
            "form-generation",
            "supervisor-review-queue",
        ],
        defaultWorkflow: "legal-clinic.general",
        defaultMemoTitle: "CounselBridge Legal Clinic Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "Clinic Workflow Routing",
            "Client Or Matter Summary",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If clinic configuration, supervisor rules, deadlines, or client facts are missing, state the gap and require supervisor review.",
        description:
            "Legal Clinic plugin workflow for client intake, research starts, memos, drafts, letters, forms, deadlines, and supervisor review.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}law-student`,
        title: "Claude Legal - Law Student",
        plugin: "law-student",
        practiceProfile: "CLAUDE.md",
        skills: ["case-brief"],
        candidateSkills: [
            "legal-writing",
            "outline-builder",
            "irac-practice",
            "socratic-drill",
            "bar-prep-questions",
            "study-plan",
        ],
        defaultWorkflow: "law-student.general",
        defaultMemoTitle: "CounselBridge Law Student Workflow Memo",
        defaultSections: [
            "Reviewer Note",
            "Learning Workflow Routing",
            "Analysis",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If course, jurisdiction, assignment limits, or learning objective is missing, state the gap and avoid doing prohibited student work.",
        description:
            "Law Student plugin workflow for case briefs, legal writing, outlines, IRAC practice, Socratic drills, and bar prep.",
    },
    {
        id: COUNSELBRIDGE_NDA_REVIEW_WORKFLOW_ID,
        title: "CounselBridge NDA Review (Claude Legal Plugin)",
        plugin: "commercial-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["review", "nda-review"],
        defaultWorkflow: "commercial.nda-review",
        defaultMemoTitle: "CounselBridge NDA Review Memo",
        defaultSections: [
            "Reviewer Note",
            "Executive Summary",
            "Document Routing",
            "Flagged Issues",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If a configured NDA playbook is missing, default to YELLOW attorney review rather than GREEN route-to-signature.",
        description:
            "NDA review using the Claude Legal commercial-legal review and nda-review skills.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}vendor-agreement-review`,
        title: "Claude Legal - Vendor Agreement Review",
        plugin: "commercial-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["review", "vendor-agreement-review"],
        candidateSkills: ["saas-msa-review", "stakeholder-summary", "escalation-flagger"],
        defaultWorkflow: "commercial.vendor-agreement-review",
        defaultMemoTitle: "CounselBridge Vendor Agreement Review Memo",
        defaultSections: [
            "Reviewer Note",
            "Document Routing",
            "Flagged Issues",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the commercial playbook or counterparty-side posture is missing, state the gap and do not issue approval.",
        description:
            "Commercial Legal plugin workflow for vendor agreements and services contracts.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}saas-msa-review`,
        title: "Claude Legal - SaaS MSA Review",
        plugin: "commercial-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["review", "saas-msa-review"],
        candidateSkills: ["vendor-agreement-review", "stakeholder-summary", "escalation-flagger"],
        defaultWorkflow: "commercial.saas-msa-review",
        defaultMemoTitle: "CounselBridge SaaS MSA Review Memo",
        defaultSections: [
            "Reviewer Note",
            "Document Routing",
            "Flagged Issues",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If the SaaS playbook, order-form context, data/security posture, or renewal preferences are missing, state the gap and do not issue approval.",
        description:
            "Commercial Legal plugin workflow for SaaS MSAs, subscriptions, order forms, and related exhibits.",
    },
    {
        id: `${COUNSELBRIDGE_WORKFLOW_PREFIX}dpa-review`,
        title: "Claude Legal - DPA Review",
        plugin: "privacy-legal",
        practiceProfile: "CLAUDE.md",
        skills: ["dpa-review"],
        candidateSkills: ["use-case-triage", "pia-generation", "reg-gap-analysis"],
        defaultWorkflow: "privacy.dpa-review",
        defaultMemoTitle: "CounselBridge DPA Review Memo",
        defaultSections: [
            "Reviewer Note",
            "Document Routing",
            "Flagged Issues",
            "Source And Verification Log",
            "Next Steps",
        ],
        missingProfileDefault:
            "If controller/processor role, jurisdiction, data categories, sectoral overlays, or privacy-policy commitments are missing, state the gap and require privacy counsel review.",
        description:
            "Privacy Legal plugin workflow for Data Processing Agreements.",
    },
];

export function isCounselBridgeWorkflowId(id: string | null | undefined): boolean {
    return !!id && WORKFLOW_DEFINITIONS.some((workflow) => workflow.id === id);
}

function resolveWorkflowDefinition(
    id?: string | null,
): CounselBridgeWorkflowDefinition {
    return (
        WORKFLOW_DEFINITIONS.find((workflow) => workflow.id === id) ??
        WORKFLOW_DEFINITIONS[0]
    );
}

function workflowRequiresSourceDocument(
    definition: CounselBridgeWorkflowDefinition,
): boolean {
    const haystack = [
        definition.id,
        definition.title,
        definition.defaultWorkflow,
        definition.defaultMemoTitle,
        definition.description,
        ...definition.skills,
        ...(definition.candidateSkills ?? []),
    ]
        .join(" ")
        .toLowerCase();
    return /\b(review|diligence|brief|chart|memo|draft|letter|redraft|diff|clearance|triage)\b/.test(
        haystack,
    );
}

function envEnabled(name: string): boolean {
    return /^(1|true|yes|on)$/i.test(process.env[name] ?? "");
}

export function counselBridgeEnabled(): boolean {
    return envEnabled("COUNSELBRIDGE_ENABLED");
}

export function shouldRouteToCounselBridge(message: string): boolean {
    if (envEnabled("COUNSELBRIDGE_ROUTE_ALL")) return true;
    return /\b(counselbridge|claude legal|nda|non[-\s]?disclosure|contract review|review this|downloadable|docx|word document)\b/i.test(
        message,
    );
}

function claudeLegalRoot(): string {
    const configured = process.env.CLAUDE_LEGAL_ROOT;
    if (configured) {
        return path.resolve(process.cwd(), configured);
    }
    return path.resolve(process.cwd(), "../../../references/claude-for-legal");
}

let warnedMissingClaudeLegalRoot = false;

function readReferenceFile(relativePath: string, maxChars: number): string {
    const root = claudeLegalRoot();
    const fullPath = path.resolve(root, relativePath);
    // Trust boundary: only read from the operator-provided Claude Legal
    // reference checkout, never from user-controlled paths.
    if (fullPath !== root && !fullPath.startsWith(root + path.sep)) return "";
    try {
        return fs.readFileSync(fullPath, "utf8").slice(0, maxChars);
    } catch {
        if (!warnedMissingClaudeLegalRoot && !fs.existsSync(root)) {
            warnedMissingClaudeLegalRoot = true;
            console.warn(
                `[counselbridge] Claude Legal reference checkout not found at ${root}`,
            );
        }
        return "";
    }
}

function buildClaudeLegalReference(
    definition: CounselBridgeWorkflowDefinition,
): string {
    const plugin = definition.practiceProfile
        ? readReferenceFile(
              `${definition.plugin}/${definition.practiceProfile}`,
              12000,
          )
        : "";
    const skillRefs = definition.skills.map((skill) => ({
        skill,
        content: readReferenceFile(
            `${definition.plugin}/skills/${skill}/SKILL.md`,
            skill === "nda-review" ? 30000 : 16000,
        ),
    }));
    const parts = [
        plugin
            ? `# Claude Legal ${definition.plugin} practice profile template\n${plugin}`
            : "",
        ...skillRefs.map(({ skill, content }) =>
            content
                ? `# Claude Legal ${definition.plugin} skill: ${skill}\n${content}`
                : "",
        ),
    ].filter(Boolean);
    return parts.length
        ? parts.join("\n\n---\n\n")
        : "Claude Legal reference files were not found at runtime.";
}

function normalizeWhitespace(value: string): string {
    return value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

function stripCodeFence(value: string): string {
    const match = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : value.trim();
}

function parseClaudeResponse(raw: string): CounselBridgeResponse | null {
    const text = stripCodeFence(raw);
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first < 0 || last <= first) return null;
    try {
        const parsed = JSON.parse(text.slice(first, last + 1)) as {
            workflow?: unknown;
            answerMarkdown?: unknown;
            memoTitle?: unknown;
            memoSections?: unknown;
            verificationWarnings?: unknown;
        };
        if (
            typeof parsed.answerMarkdown !== "string" ||
            typeof parsed.memoTitle !== "string" ||
            !Array.isArray(parsed.memoSections)
        ) {
            return null;
        }
        const memoSections = parsed.memoSections
            .map((section) => {
                if (!section || typeof section !== "object") return null;
                const row = section as { heading?: unknown; content?: unknown };
                if (
                    typeof row.heading !== "string" ||
                    typeof row.content !== "string"
                ) {
                    return null;
                }
                return {
                    heading: row.heading.trim(),
                    content: row.content.trim(),
                };
            })
            .filter(
                (
                    section,
                ): section is { heading: string; content: string } =>
                    !!section && (!!section.heading || !!section.content),
            );
        if (!memoSections.length) return null;
        return {
            workflow:
                typeof parsed.workflow === "string"
                    ? parsed.workflow
                    : "counselbridge.workflow",
            answerMarkdown: parsed.answerMarkdown.trim(),
            memoTitle: parsed.memoTitle.trim(),
            memoSections,
            verificationWarnings: Array.isArray(parsed.verificationWarnings)
                ? parsed.verificationWarnings
                      .filter((item): item is string => typeof item === "string")
                      .map((item) => item.trim())
                      .filter(Boolean)
                : [],
        };
    } catch {
        return null;
    }
}

function fallbackReview(
    userMessage: string,
    docs: SourceDocument[],
    definition: CounselBridgeWorkflowDefinition,
): CounselBridgeResponse {
    const filenames = docs.map((doc) => doc.filename).join(", ") || "no uploaded document";
    const warnings = [
        "Claude was not available or did not return the expected structured payload.",
        "No legal research connector was used in this v1 workflow.",
    ];
    const summary = [
        `CounselBridge prepared a first-pass ${definition.title} memo.`,
        `Source documents reviewed: ${filenames}.`,
        "This is attorney work product in draft form. A lawyer should verify the source document and any legal conclusions before use.",
    ].join("\n\n");
    return {
        workflow: definition.defaultWorkflow,
        answerMarkdown: [
            "CounselBridge completed a first-pass Claude Legal plugin review and created a downloadable Word memo.",
            "",
            `Workflow source: ${definition.description}`,
            "",
            ...warnings.map((warning) => `- ${warning}`),
        ].join("\n"),
        memoTitle: definition.defaultMemoTitle,
        memoSections: [
            { heading: "Reviewer Note", content: summary },
            {
                heading: "User Request",
                content:
                    userMessage ||
                    "Review the uploaded commercial agreement and produce a downloadable memo.",
            },
            {
                heading: "Document Routing",
                content:
                    `Attorney review recommended. ${definition.missingProfileDefault}`,
            },
            {
                heading: "Issues To Check",
                content:
                    definition.id === COUNSELBRIDGE_NDA_REVIEW_WORKFLOW_ID
                        ? "Confirm whether the NDA is mutual or one-way; identify the disclosing and receiving parties; check confidentiality definition, exclusions, compelled-disclosure process, term and survival, residuals, non-solicit or non-compete language, IP ownership, publicity, governing law, venue, fee shifting, and any obligations that go beyond confidentiality."
                        : "Identify the agreement type from the title, exhibits, and core obligations. Check parties, scope, payment, term and renewal, termination, confidentiality, data protection, IP ownership, warranties, indemnity, limitation of liability, audit rights, assignment, change of control, governing law, venue, dispute resolution, unusual operational obligations, and missing schedules or exhibits.",
            },
            {
                heading: "Source And Verification Log",
                content: [
                    `User-provided documents: ${filenames}.`,
                    "Research connector: not used.",
                    "Legal citations: none verified.",
                    "Status: draft for attorney review.",
                ].join("\n"),
            },
        ],
        verificationWarnings: warnings,
    };
}

function buildSystemPrompt(definition: CounselBridgeWorkflowDefinition): string {
    const candidateSkills = definition.candidateSkills?.length
        ? `Candidate downstream skills for routing only: ${definition.candidateSkills.join(", ")}. Do not claim to have fully executed a downstream skill unless its SKILL.md is included below.`
        : "";
    return [
        "You are CounselBridge, a legal workflow gateway that adapts Claude Legal plugin workflows for MikeOSS.",
        "You are not giving final legal advice. Every output is a draft for attorney review.",
        `Selected CounselBridge workflow: ${definition.title}.`,
        `Claude Legal plugin: ${definition.plugin}.`,
        `Loaded Claude Legal skill files: ${definition.skills.join(", ")}.`,
        candidateSkills,
        "Apply the Claude Legal plugin files below as the controlling workflow reference.",
        definition.missingProfileDefault,
        "Route by document structure first: main title, exhibits, schedules, order forms, DPAs, SLAs, and attachments. Body keywords alone are not enough.",
        "For generic commercial review, produce a useful first-pass issue memo even when a downstream specialized skill is only identified as a route candidate.",
        "Do not invent citations. If no research connector is available, say so.",
        "Your entire response must be one valid JSON object matching the requested shape. No markdown fence, no commentary outside JSON.",
        "",
        buildClaudeLegalReference(definition),
        "",
        "Return only valid JSON.",
    ].join("\n");
}

function buildUserPrompt(
    userMessage: string,
    docs: SourceDocument[],
    definition: CounselBridgeWorkflowDefinition,
): string {
    const docBlocks = docs.map((doc) =>
        [
            `Document ID: ${doc.doc_id}`,
            `Filename: ${doc.filename}`,
            "Text:",
            doc.text.slice(0, 24000),
        ].join("\n"),
    );
    return [
        "Return only a JSON object. The response must start with { and end with }.",
        "",
        "MikeOSS user request:",
        userMessage,
        "",
        `Selected workflow: ${definition.title}`,
        `Expected internal workflow id: ${definition.defaultWorkflow}`,
        definition.candidateSkills?.length
            ? `Route candidates to consider: ${definition.candidateSkills.join(", ")}`
            : "",
        "If the uploaded document is an NDA, MSA, vendor agreement, SaaS agreement, order form, DPA, SLA, amendment, or mixed commercial package, identify that routing in the Document Routing memo section.",
        "Produce a downloadable memo payload even if the source playbook is only a template. In that case, clearly state the playbook gap and use YELLOW/attorney-review style triage rather than approval.",
        "",
        "Available source documents:",
        docBlocks.length ? docBlocks.join("\n\n---\n\n") : "(none)",
        "",
        "Return this exact JSON shape:",
        JSON.stringify(
            {
                workflow: definition.defaultWorkflow,
                answerMarkdown:
                    "Short chat response telling the user a downloadable Word memo was created. Mention draft/attorney-review status and verification limits.",
                memoTitle: definition.defaultMemoTitle,
                memoSections: definition.defaultSections.map((heading) => ({
                    heading,
                    content: `${heading} content.`,
                })),
                verificationWarnings: [
                    "No legal research connector was used in this v1 workflow.",
                ],
            },
            null,
            2,
        ),
    ].join("\n");
}

async function readSourceDocument(
    doc_id: string,
    document_id: string,
    filename: string,
    docStore: DocStore,
): Promise<SourceDocument | null> {
    const record = docStore.get(doc_id);
    if (!record) return null;
    const raw = await downloadFile(record.storage_path);
    if (!raw) return null;
    const bytes = Buffer.from(raw);
    let text = "";
    if (record.file_type === "pdf" || filename.toLowerCase().endsWith(".pdf")) {
        text = await extractPdfText(bytes.buffer as ArrayBuffer);
    } else if (
        record.file_type === "docx" ||
        record.file_type === "doc" ||
        /\.docx?$/i.test(filename)
    ) {
        text = await extractDocxBodyText(bytes);
    } else {
        text = bytes.toString("utf8");
    }
    text = normalizeWhitespace(text);
    if (!text) return null;
    return { doc_id, document_id, filename, text };
}

async function collectSourceDocuments(params: {
    docStore: DocStore;
    docIndex: DocIndex;
    attachedDocuments?: AttachedDocument[];
    displayedDoc?: DisplayedDocument;
}): Promise<SourceDocument[]> {
    const requested = new Map<string, { document_id: string; filename: string }>();
    const addByDocumentId = (document_id: string, filename: string) => {
        for (const [label, info] of Object.entries(params.docIndex)) {
            if (info.document_id === document_id) {
                requested.set(label, {
                    document_id,
                    filename: info.filename || filename,
                });
                return;
            }
        }
        const label = resolveDocLabel(document_id, params.docStore, params.docIndex);
        if (label) requested.set(label, { document_id, filename });
    };

    for (const doc of params.attachedDocuments ?? []) {
        addByDocumentId(doc.document_id, doc.filename);
    }
    if (params.displayedDoc) {
        addByDocumentId(params.displayedDoc.document_id, params.displayedDoc.filename);
    }
    if (requested.size === 0 && Object.keys(params.docIndex).length === 1) {
        const [label, info] = Object.entries(params.docIndex)[0];
        requested.set(label, {
            document_id: info.document_id,
            filename: info.filename,
        });
    }

    const out: SourceDocument[] = [];
    for (const [doc_id, info] of requested.entries()) {
        const doc = await readSourceDocument(
            doc_id,
            info.document_id,
            info.filename,
            params.docStore,
        );
        if (doc) out.push(doc);
    }
    return out;
}

export async function runCounselBridgeProjectTurn(params: {
    userMessage: string;
    userId: string;
    projectId?: string | null;
    workflowId?: string | null;
    db: ReturnType<typeof createServerSupabase>;
    docStore: DocStore;
    docIndex: DocIndex;
    attachedDocuments?: AttachedDocument[];
    displayedDoc?: DisplayedDocument;
    apiKeys?: UserApiKeys;
}): Promise<{
    events: CounselBridgeEvent[];
    answerMarkdown: string;
    artifacts: CounselBridgeArtifact[];
}> {
    const docs = await collectSourceDocuments({
        docStore: params.docStore,
        docIndex: params.docIndex,
        attachedDocuments: params.attachedDocuments,
        displayedDoc: params.displayedDoc,
    });

    const definition = resolveWorkflowDefinition(params.workflowId);
    if (docs.length === 0 && workflowRequiresSourceDocument(definition)) {
        const answerMarkdown = [
            `CounselBridge selected **${definition.title}**, but no source document is available in this project chat turn.`,
            "",
            "Upload or attach the document you want reviewed, or open a project that contains the document, then run the workflow again.",
            "",
            "No Word memo was generated because reviewing without a source document could pull in the wrong context or produce an unreliable result.",
        ].join("\n");
        return {
            events: [{ type: "content", text: answerMarkdown }],
            answerMarkdown,
            artifacts: [],
        };
    }
    let workflow = fallbackReview(params.userMessage, docs, definition);
    const model = process.env.COUNSELBRIDGE_CLAUDE_MODEL ?? DEFAULT_MODEL;

    if (params.apiKeys?.claude || process.env.ANTHROPIC_API_KEY) {
        try {
            const raw = await completeText({
                model,
                systemPrompt: buildSystemPrompt(definition),
                user: buildUserPrompt(params.userMessage, docs, definition),
                maxTokens: 5000,
                apiKeys: params.apiKeys,
            });
            workflow = parseClaudeResponse(raw) ?? workflow;
        } catch (err) {
            console.error("[counselbridge] Claude workflow failed", err);
        }
    }

    const artifacts: CounselBridgeArtifact[] = [];
    const events: CounselBridgeEvent[] = [];
    const docx = await generateDocx(
        workflow.memoTitle || "CounselBridge Legal Review Memo",
        workflow.memoSections,
        params.userId,
        params.db,
        { projectId: params.projectId ?? null },
    );

    if ("download_url" in docx && "filename" in docx) {
        const artifact: CounselBridgeArtifact = {
            type: "docx",
            title: workflow.memoTitle,
            filename: String(docx.filename),
            download_url: String(docx.download_url),
            document_id:
                typeof docx.document_id === "string" ? docx.document_id : undefined,
            version_id:
                typeof docx.version_id === "string" ? docx.version_id : undefined,
            version_number:
                typeof docx.version_number === "number"
                    ? docx.version_number
                    : null,
        };
        artifacts.push(artifact);
        events.push({
            type: "doc_created",
            filename: artifact.filename,
            download_url: artifact.download_url,
            document_id: artifact.document_id,
            version_id: artifact.version_id,
            version_number: artifact.version_number,
        });
    } else {
        const error =
            "error" in docx && typeof docx.error === "string"
                ? docx.error
                : "Unknown DOCX generation error";
        workflow.answerMarkdown += `\n\nDocument generation failed: ${error}`;
    }

    const warningBlock = workflow.verificationWarnings.length
        ? `\n\nVerification warnings:\n${workflow.verificationWarnings.map((w) => `- ${w}`).join("\n")}`
        : "";
    const answerMarkdown = `${workflow.answerMarkdown}${warningBlock}`;
    events.push({ type: "content", text: answerMarkdown });

    return { events, answerMarkdown, artifacts };
}
