type BuiltinWorkflow = { id: string; title: string; prompt_md: string };

const counselBridgePrompt = (
    title: string,
    plugin: string,
    description: string,
    routes: string[],
): string =>
    `## ${title}\n\n` +
    `Use CounselBridge to route this MikeOSS request to the Claude Legal \`${plugin}\` plugin reference.\n\n` +
    `${description}\n\n` +
    "Required behavior:\n" +
    "- Read the attached or project document when one is available.\n" +
    "- Identify the request type and route it to the closest Claude Legal plugin workflow or skill.\n" +
    `- Route candidates: ${routes.join(", ")}.\n` +
    "- If the relevant Claude Legal practice profile, playbook, matter file, or integration is missing, state the gap clearly.\n" +
    "- Do not invent citations or pretend external connectors were used.\n" +
    "- Produce a downloadable Word memo unless the workflow clearly calls for a short chat-only answer.\n" +
    "- Include source and verification warnings.\n\n" +
    "This is a CounselBridge workflow powered by Claude Legal plugin files. It is not a final legal opinion and not a substitute for attorney review.";

const COUNSELBRIDGE_CLAUDE_WORKFLOWS: BuiltinWorkflow[] = [
    {
        id: "builtin-counselbridge-claude-legal-commercial-review",
        title: "Claude Legal - Commercial Review",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Commercial Review",
            "commercial-legal",
            "Generic commercial-contract routing for vendor agreements, NDAs, SaaS subscriptions, order forms, DPAs, SLAs, amendments, renewals, and stakeholder summaries.",
            ["review", "nda-review", "vendor-agreement-review", "saas-msa-review"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-corporate",
        title: "Claude Legal - Corporate",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Corporate",
            "corporate-legal",
            "Corporate workflow routing for M&A diligence, tabular reviews, material-contract schedules, closing checklists, board minutes, written consents, and entity compliance.",
            ["tabular-review", "diligence-issue-extraction", "closing-checklist", "board-minutes"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-litigation",
        title: "Claude Legal - Litigation",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Litigation",
            "litigation-legal",
            "Litigation workflow routing for matter intake, chronologies, claim charts, demands, legal holds, subpoena triage, privilege logs, deposition prep, and briefing.",
            ["matter-intake", "chronology", "claim-chart", "demand-draft", "brief-section-drafter"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-employment",
        title: "Claude Legal - Employment",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Employment",
            "employment-legal",
            "Employment workflow routing for termination review, worker classification, hiring review, wage-hour questions, leave tracking, investigations, and policies.",
            ["termination-review", "worker-classification", "hiring-review", "wage-hour-qa", "policy-drafting"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-privacy",
        title: "Claude Legal - Privacy",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Privacy",
            "privacy-legal",
            "Privacy workflow routing for DPA review, use-case triage, PIAs, DSAR responses, policy monitoring, and regulatory gap analysis.",
            ["dpa-review", "use-case-triage", "pia-generation", "dsar-response", "reg-gap-analysis"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-ai-governance",
        title: "Claude Legal - AI Governance",
        prompt_md: counselBridgePrompt(
            "Claude Legal - AI Governance",
            "ai-governance-legal",
            "AI governance routing for use-case triage, AI inventory, impact assessments, vendor AI terms, policy starts, monitoring, and regulatory gaps.",
            ["use-case-triage", "ai-inventory", "aia-generation", "vendor-ai-review", "policy-monitor"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-ip",
        title: "Claude Legal - IP",
        prompt_md: counselBridgePrompt(
            "Claude Legal - IP",
            "ip-legal",
            "IP workflow routing for IP clause review, trademark clearance, FTO triage, infringement triage, OSS review, invention intake, takedowns, and portfolios.",
            ["ip-clause-review", "clearance", "fto-triage", "infringement-triage", "oss-review"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-product",
        title: "Claude Legal - Product",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Product",
            "product-legal",
            "Product legal routing for launch review, feature risk assessment, quick issue triage, and marketing-claims review.",
            ["launch-review", "feature-risk-assessment", "is-this-a-problem", "marketing-claims-review"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-regulatory",
        title: "Claude Legal - Regulatory",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Regulatory",
            "regulatory-legal",
            "Regulatory routing for gap analysis, policy diffs, policy redrafts, comment drafting, gap surfacing, and regulatory-feed monitoring.",
            ["gaps", "gap-surfacer", "policy-diff", "policy-redraft", "comments"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-legal-clinic",
        title: "Claude Legal - Legal Clinic",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Legal Clinic",
            "legal-clinic",
            "Legal clinic routing for client intake, research starts, memos, drafts, client letters, deadline tracking, forms, and supervisor review.",
            ["client-intake", "research-start", "memo", "draft", "client-letter"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-law-student",
        title: "Claude Legal - Law Student",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Law Student",
            "law-student",
            "Learning workflow routing for case briefs, legal writing, outlines, IRAC practice, Socratic drill, bar prep, and study plans.",
            ["case-brief", "legal-writing", "outline-builder", "irac-practice", "bar-prep-questions"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-nda-review",
        title: "Claude Legal - NDA Review",
        prompt_md: counselBridgePrompt(
            "Claude Legal - NDA Review",
            "commercial-legal",
            "Specific commercial NDA review using the Claude Legal commercial review and NDA review skill references.",
            ["review", "nda-review", "escalation-flagger", "stakeholder-summary"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-vendor-agreement-review",
        title: "Claude Legal - Vendor Agreement Review",
        prompt_md: counselBridgePrompt(
            "Claude Legal - Vendor Agreement Review",
            "commercial-legal",
            "Specific commercial review for vendor agreements, services contracts, and related procurement-side terms.",
            ["review", "vendor-agreement-review", "saas-msa-review", "escalation-flagger"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-saas-msa-review",
        title: "Claude Legal - SaaS MSA Review",
        prompt_md: counselBridgePrompt(
            "Claude Legal - SaaS MSA Review",
            "commercial-legal",
            "Specific commercial review for SaaS MSAs, subscriptions, order forms, SLAs, security exhibits, and auto-renewal terms.",
            ["review", "saas-msa-review", "vendor-agreement-review", "renewal-tracker"],
        ),
    },
    {
        id: "builtin-counselbridge-claude-legal-dpa-review",
        title: "Claude Legal - DPA Review",
        prompt_md: counselBridgePrompt(
            "Claude Legal - DPA Review",
            "privacy-legal",
            "Specific privacy review for Data Processing Agreements, controller/processor roles, sectoral overlays, and policy consistency.",
            ["dpa-review", "use-case-triage", "pia-generation", "reg-gap-analysis"],
        ),
    },
];

export const BUILTIN_WORKFLOWS: BuiltinWorkflow[] = [
    {
        id: "builtin-cp-checklist",
        title: "Generate CP Checklist",
        prompt_md:
            "## Generate Conditions Precedent Checklist\n\n" +
            "Review the uploaded credit agreement or financing document and generate a comprehensive " +
            "Conditions Precedent (CP) checklist.\n\n" +
            "You MUST use the generate_docx tool to produce the checklist as a downloadable Word document. " +
            "You MUST pass landscape: true to the generate_docx tool — the document must be in landscape orientation. " +
            "Do not display the checklist inline — generate the .docx file and provide the download link.\n\n" +
            "Structure the document as follows:\n" +
            "- For each category of conditions (e.g. Corporate, Financial, Legal, Security), add a section with a heading\n" +
            "- Under each category heading, include a table with exactly these four columns in this order:\n" +
            "  1. Index — sequential number within the category (1, 2, 3…)\n" +
            "  2. Clause Number — the clause or schedule reference from the agreement\n" +
            "  3. Clause — a concise description of the condition precedent\n" +
            "  4. Status — leave blank (empty string) for the user to fill in\n\n" +
            "Use the table field in the section object (not content) for each category's rows.\n\n" +
            "Before finalizing, double-check that every table is formatted correctly: each table must have exactly the four columns above in the same order, headers must match exactly (Index, Clause Number, Clause, Status), every row must have the same number of cells as the headers, the Index column must be sequential starting from 1 within each category, and no cells should contain stray markdown, newlines, or placeholder text (use an empty string for Status).",
    },
    {
        id: "builtin-credit-summary",
        title: "Credit Agreement Summary",
        prompt_md:
            "## Credit Agreement Summary\n\n" +
            "Review the uploaded credit agreement and produce a comprehensive legal summary covering the following topics. " +
            "For each section, identify the key provisions, quote the relevant clause or schedule references, and flag any unusual, onerous, or non-market terms.\n\n" +
            "1. **Lenders** — All lenders or members of the lender syndicate, including their full legal name and role (e.g. mandated lead arranger, original lender, agent bank)\n" +
            "2. **Borrowers** — All borrowers, including their full legal name and jurisdiction of incorporation\n" +
            "3. **Guarantors** — All guarantors, including their full legal name and the scope of their guarantee obligation\n" +
            "4. **Other Parties** — Any other material parties (e.g. facility agent, security agent, hedge counterparties, issuing bank) and their roles\n" +
            "5. **Date of Agreement** — Date of the credit agreement\n" +
            "6. **Facilities** — Each facility available (e.g. Revolving Credit Facility, Term Loan A, Term Loan B, Term Loan C), the facility type, tranche name, and any key structural features\n" +
            "7. **Amount** — Total committed amount across all facilities, the currency, and breakdown by tranche if applicable\n" +
            "8. **Purpose** — Stated purpose for which borrowings may be used and any restrictions on use of proceeds\n" +
            "9. **Interest** — Applicable reference rate (e.g. SOFR, EURIBOR, base rate), the margin, any margin ratchet mechanism, and how interest periods are structured\n" +
            "10. **Commitment Fee** — Commitment or utilisation fees, the applicable rate, how they are calculated, and the basis (e.g. undrawn commitment, average utilisation)\n" +
            "11. **Repayment Schedule** — Repayment profile for each facility, whether by scheduled instalments or bullet repayment, and the repayment dates and amounts\n" +
            "12. **Maturity** — Final maturity date for each facility\n" +
            "13. **Security** — Each class of security granted or required (e.g. share pledges, fixed and floating charges, real estate mortgages, account pledges) and the assets or entities over which security is taken\n" +
            "14. **Guarantees** — Guarantee obligations, the guarantors, the scope of the guarantee, and any limitations (e.g. up-stream guarantee limitations, guarantor coverage test)\n" +
            "15. **Financial Covenants** — Each financial covenant, the metric (e.g. leverage ratio, interest cover, cashflow cover), the applicable test, testing frequency, and any equity cure rights\n" +
            "16. **Events of Default** — Each event of default, noting any grace periods, materiality thresholds, or cross-default provisions\n" +
            "17. **Assignment** — Restrictions or permissions on assignment or transfer (e.g. white/blacklists, borrower consent for lender transfers; restrictions on borrower assignment)\n" +
            "18. **Change of Control** — What constitutes a change of control, what obligations it triggers (e.g. mandatory prepayment, cancellation, lender consent), and any cure period\n" +
            "19. **Prepayment Fee** — Any prepayment fees, make-whole premiums, or soft-call protections, the applicable fee, the period during which it applies, and any exceptions (e.g. prepayment from insurance proceeds or asset disposals)\n" +
            "20. **Governing Law** — Governing law of the agreement\n" +
            "21. **Dispute Resolution** — Whether disputes go to litigation or arbitration, the chosen forum or seat, and any submission to jurisdiction provisions\n\n" +
            "Deliver the summary inline in your chat response — do NOT call generate_docx. Only produce a downloadable Word document if the user explicitly asks for one.",
    },
    {
        id: "builtin-sha-summary",
        title: "Shareholder Agreement Summary",
        prompt_md:
            "## Shareholder Agreement Summary\n\n" +
            "Review the uploaded shareholder agreement and produce a comprehensive legal summary covering the following topics. " +
            "For each section, identify the key provisions, quote the relevant clause references, and flag any unusual, onerous, or market-standard deviations.\n\n" +
            "1. **Parties & Shareholdings** — Full legal names, roles, share classes held, and percentage interests (on a fully diluted basis if stated)\n" +
            "2. **Share Classes & Rights** — For each class: voting rights, dividend rights, liquidation preference, conversion or redemption features\n" +
            "3. **Board Composition & Governance** — Board size, director appointment rights (and the shareholding thresholds required to maintain them), quorum, and casting vote\n" +
            "4. **Reserved Matters** — Decisions requiring a special majority, unanimity, or a specific shareholder's consent; note the threshold and whose consent is required for each\n" +
            "5. **Pre-emption on New Shares** — Who holds pre-emption rights, procedure, timeline, and any carve-outs (e.g. employee option schemes)\n" +
            "6. **Transfer Restrictions** — Lock-up periods, prohibited transfers, permitted transfers (e.g. to affiliates), and any board or shareholder approval requirements\n" +
            "7. **Right of First Refusal / Pre-emption on Transfer** — Trigger, procedure, pricing mechanics, and any exceptions\n" +
            "8. **Drag-Along Rights** — Who holds the right, threshold to trigger, conditions (e.g. minimum price, independent valuation), and minority protections\n" +
            "9. **Tag-Along Rights** — Who holds the right, triggering threshold, exercise procedure, and price terms\n" +
            "10. **Anti-Dilution Protections** — Type (full ratchet, weighted average), trigger events, calculation mechanics, and exceptions\n" +
            "11. **Dividend Policy** — Any obligation or target to pay dividends, preferential dividend rights, and restrictions on distributions\n" +
            "12. **Exit & Liquidity** — Agreed exit routes (trade sale, IPO, drag sale), timelines, and liquidation preferences on exit\n" +
            "13. **Deadlock** — Deadlock definition, escalation and resolution mechanisms (e.g. Russian roulette, put/call options), and consequences if unresolved\n" +
            "14. **Non-Compete & Non-Solicitation** — Who is bound, scope of activities and geography, duration, and carve-outs\n" +
            "15. **Governing Law & Dispute Resolution** — Applicable law, forum, arbitration or litigation, and any mandatory escalation steps\n\n" +
            "Generate the summary as a downloadable Word document.",
    },
    ...COUNSELBRIDGE_CLAUDE_WORKFLOWS,
];
