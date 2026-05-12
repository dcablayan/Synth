# ⬡ Synth

**AI contract review for legal and financial documents.**

> ⚠️ **Disclaimer:** Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.

Synth is a local-first, CLI-driven, agent-native AI contract review system. Clone the repo, drop contracts into `/documents/inbox`, run commands, and receive structured reviews, financial analysis, revision packets, memos, and polished PDFs.

**This is not a chat interface. It's a repo-based AI operations system for contract review.**

---

## Problem

Most "AI contract review" tools are chat interfaces. Synth is a document operations system:

- Structured, repeatable analysis — not free-form chat
- Generated artifacts: JSON, Markdown, HTML, PDF
- Predictable output folders you can build on
- Works through Claude Code CLI, Codex CLI, or direct npm scripts
- Local-first: documents never leave your machine without explicit API configuration

---

## Career-Ops-Inspired Workflow

Synth is designed like an AI operations repo. Instead of being only a web app, it works as a local command center where you drop documents into `/documents/inbox`, run CLI commands, and get structured outputs, memos, revision packets, and PDFs.

Inspired by [career-ops](https://github.com/santifer/career-ops): a repo-first, agent-native design where another AI coding agent can clone the repo, read the agent docs, and operate or improve the system without human instruction.

---

## Features

- **Contract Risk Review** — Risk score (0-100), risk level, clause analysis, citations
- **Clause Extraction** — Payment, renewal, termination, liability, confidentiality, governing law
- **Financial Term Analysis** — Fees, penalties, equity, revenue share, renewal cost changes
- **Revision Packets** — Original language, issue, suggested replacement, negotiation notes
- **PDF Reports** — Professional PDFs via Playwright/Chromium
- **Executive Memos** — Plain-English summary, risks, deadlines, lawyer questions
- **Local Dashboard** — Next.js UI showing all report artifacts
- **Mock Mode** — Full demo without an API key
- **Agent Docs** — CLAUDE.md and CODEX.md for AI agent operation

---

## Quickstart

```bash
git clone [repo-url]
cd synth
npm install
npx playwright install chromium   # Required for PDF generation
npm run doctor                     # Check setup
npm run demo                       # Run full demo on sample documents
npm run dashboard                  # Open local dashboard at localhost:3000
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run doctor` | Check Node version, folders, samples, env, PDF engine |
| `npm run verify` | Verify required files, scripts, templates, and directories |
| `npm run demo` | Full pipeline on all 3 sample documents |
| `npm run analyze` | Analyze all documents in `/documents/inbox` |
| `npm run memo` | Generate executive memo from latest review |
| `npm run revise` | Generate revision packet from latest review |
| `npm run pdf` | Generate PDFs from latest artifacts |
| `npm run packet` | Full pipeline: analyze → memo → revise → pdf |
| `npm run dashboard` | Start Next.js dashboard at `localhost:3000` |
| `npm run build` | Build Next.js for production deployment |

---

## Folder Structure

```
synth/
├── documents/
│   ├── inbox/                   ← Drop documents here
│   │   ├── sample-saas-agreement.txt
│   │   ├── sample-term-sheet.txt
│   │   └── sample-contractor-agreement.txt
│   └── processed/
├── reports/
│   ├── reviews/                 ← JSON + Markdown reviews
│   ├── memos/                   ← JSON + Markdown memos
│   ├── financials/              ← Financial analysis JSON
│   ├── revisions/               ← Revision packets
│   ├── html/                    ← HTML intermediates
│   ├── pdfs/                    ← Generated PDFs
│   └── exports/
├── templates/                   ← HTML PDF templates
├── src/
│   ├── app/                     ← Next.js App Router
│   │   ├── page.tsx             ← Landing page
│   │   ├── dashboard/           ← Dashboard
│   │   └── case-study/          ← Case study
│   ├── cli/                     ← CLI scripts
│   │   ├── doctor.ts
│   │   ├── verify.ts
│   │   ├── demo.ts
│   │   ├── analyze.ts
│   │   ├── memo.ts
│   │   ├── revise.ts
│   │   ├── generate-pdf.ts
│   │   └── packet.ts
│   ├── lib/                     ← Library modules
│   ├── schemas/                 ← Zod schemas
│   └── prompts/                 ← AI prompts
└── agent/
    ├── CLAUDE.md                ← Claude Code CLI docs
    ├── CODEX.md                 ← Codex CLI docs
    ├── SYSTEM_OVERVIEW.md
    ├── WORKFLOWS.md
    └── SAFETY.md
```

---

## Demo Workflow

```bash
# 1. Check setup
npm run doctor

# 2. Run demo (processes all 3 sample documents)
npm run demo

# 3. View outputs
ls reports/reviews/     # → JSON + Markdown reviews
ls reports/memos/       # → Memo files
ls reports/pdfs/        # → Generated PDFs (if Playwright installed)

# 4. Open dashboard
npm run dashboard
# → http://localhost:3000
```

---

## PDF Generation

Synth uses Playwright (headless Chromium) to generate PDFs.

```bash
# Install Chromium
npx playwright install chromium

# Generate PDFs from latest artifacts
npm run pdf
```

PDFs are saved to `/reports/pdfs/`.
HTML intermediates are always saved to `/reports/html/` — even if PDF generation fails.

PDF reports include:
- Contract Review PDF (cover page, executive summary, risk matrix, key terms, action items)
- Financial Analysis PDF (fee tables, red flags, citations)
- Executive Memo PDF (plain-English summary, risks, deadlines, lawyer questions)
- Revision Packet PDF (clause table, suggested replacements, negotiation notes)

---

## Environment Variables

```env
# Optional. If not set, mock mode is used.
OPENAI_API_KEY=sk-...

# Optional. Use for any OpenAI-compatible provider (Together, Groq, etc.)
OPENAI_BASE_URL=https://api.openai.com/v1

# Optional. Defaults to gpt-4o.
OPENAI_MODEL=gpt-4o
```

**Mock Mode:** If no `OPENAI_API_KEY` is set, Synth runs in mock mode — full workflow with illustrative output. No API key required for development or portfolio demo.

---

## Screenshots

```
[Screenshot: npm run doctor — all checks passing]
[Screenshot: npm run demo — processing sample documents]
[Screenshot: Dashboard — document list and risk matrix]
[Screenshot: Dashboard — financial terms and memo]
[Screenshot: Generated PDF — Contract Review]
[Screenshot: Generated PDF — Revision Packet]
```

*Screenshots captured from local demo run.*

---

## AI Safety Design

Synth is built with explicit AI safety guardrails:

- **Citation-required policy:** Every finding includes a direct quote from the document
- **"Not found" behavior:** Missing data outputs `"Not found in the document."` — never invented
- **Revision framing:** Suggested edits are always labeled "suggested replacement language for review by a qualified professional"
- **Schema validation:** All AI output is validated by Zod schemas. Invalid output triggers a graceful fallback
- **Mock mode default:** Works without an API key for safe demonstration
- **Local-first:** Documents never leave your machine without explicit API configuration

Full details: [agent/SAFETY.md](agent/SAFETY.md)

---

## Limitations

- **Mock mode** produces illustrative output only — not document-specific analysis
- **Plain text only** — no PDF/DOCX ingestion (OCR not included)
- **OpenAI-compatible API** required for real analysis
- **No authentication** or multi-user support
- **Not production legal software** — this is a prototype
- **Playwright/Chromium** required for PDF generation

---

## Operating with Claude Code or Codex CLI

Synth includes full agent documentation:

- [agent/CLAUDE.md](agent/CLAUDE.md) — Claude Code CLI operating guide
- [agent/CODEX.md](agent/CODEX.md) — Codex CLI guide with `/goal` examples
- [agent/WORKFLOWS.md](agent/WORKFLOWS.md) — Step-by-step workflow reference
- [agent/SYSTEM_OVERVIEW.md](agent/SYSTEM_OVERVIEW.md) — Architecture and data flow
- [agent/SAFETY.md](agent/SAFETY.md) — Safety constraints

Another AI coding agent can clone this repo, read the agent docs, and operate or extend the system without human instruction.

---

## Roadmap

- [ ] PDF/DOCX ingestion with OCR
- [ ] Anthropic Claude API provider
- [ ] Contract comparison mode (diff two versions)
- [ ] SAFE note / employment offer / MSA specialized prompts
- [ ] Vercel deployment for dashboard (CLI stays local)
- [ ] Export to Google Docs / Notion
- [ ] Fine-tuned risk weights per document type

---

## Resume Bullets

For portfolio and resume use:

> Built Synth, a local-first AI contract review system in TypeScript/Next.js. Implemented CLI pipeline with structured document analysis, risk scoring via Zod-validated schemas, PDF generation via Playwright, and agent-native documentation enabling operation by Claude Code or Codex CLI. Includes mock mode, financial term extraction, revision packet generation, and a Next.js dashboard displaying review artifacts.

---

## Tech Stack

- **TypeScript** + **Node.js** — CLI and library layer
- **Next.js App Router** — Local dashboard
- **Tailwind CSS** — Dashboard styling
- **Zod** — Schema validation for all AI output
- **Playwright** — Headless Chromium PDF generation
- **tsx** — TypeScript CLI execution without compilation

---

## License

MIT — Use freely. Not legal advice.

---

> ⚠️ **Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.**
