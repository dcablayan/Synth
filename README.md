# Synth v3

**AI contract review for legal and financial documents.**

[![CI](https://github.com/dylancablayan/synth/actions/workflows/ci.yml/badge.svg)](https://github.com/dylancablayan/synth/actions/workflows/ci.yml)

> ⚠️ Synth is not legal advice or financial advice. It is a document review aid built as a portfolio project. Consult a qualified professional before making any decisions based on this software.

Synth is a local-first, CLI-driven document review system. Drop a contract into `/documents/inbox`, run a command, and get a structured risk review, financial analysis, revision packet, and polished PDF — all saved to your machine.

**[Live Demo →](https://synth.dylancablayan.com/demo)** · **[Artifact Gallery →](https://synth.dylancablayan.com/artifacts)** · **[Case Study →](https://synth.dylancablayan.com/case-study)**

---

## Quickstart

```bash
git clone https://github.com/dylancablayan/synth
cd synth
npm install
npx playwright install chromium
npm run doctor
npm run demo
npm run dashboard
```

No API key required — runs in mock mode by default.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run doctor` | Check that everything is set up correctly |
| `npm run verify` | Verify all required files and scripts exist |
| `npm run demo` | Run the full pipeline on all 3 sample documents |
| `npm run analyze` | Analyze documents in `documents/inbox/` |
| `npm run memo` | Generate executive memo for latest analysis |
| `npm run revise` | Generate revision packet for latest analysis |
| `npm run pdf` | Generate individual PDFs from HTML reports |
| `npm run packet` | Run full pipeline: analyze → memo → revise → pdf → full-packet |
| `npm run seed-demo` | Refresh static demo data and artifact gallery from pipeline |
| `npm run eval` | Run deterministic eval harness on sample documents |
| `npm run dashboard` | Open local dashboard at http://localhost:3000 |
| `npm run build` | Build Next.js for deployment |
| `npm run type-check` | TypeScript type check (no emit) |

---

## Deployed vs. Local

**Deployed site** (`/demo`, `/artifacts`): Works without cloning the repo. Uses static fixture data committed to the repo. Shows full review, financial analysis, memo, revisions, and downloadable artifacts.

**Local workflow** (`npm run demo`, `npm run packet`): Runs the CLI pipeline on your documents. Generates real JSON, Markdown, HTML, and PDF reports in `/reports/`. Requires Node.js 18+ and Playwright Chromium for PDF generation.

---

## Demo Mode

The `/demo` route is a recruiter-ready, no-setup demonstration of Synth's outputs. It uses committed fixture data in `/src/data/demo/` — no local reports, no API key, no filesystem access needed.

To refresh the demo data from the live pipeline:

```bash
npm run seed-demo
```

This runs the sample SaaS agreement through the full pipeline and copies the outputs to:
- `src/data/demo/` — JSON fixtures for the `/demo` route
- `public/demo-artifacts/` — downloadable artifacts for `/artifacts`

---

## Artifact Gallery

The `/artifacts` route shows downloadable sample outputs:

| Artifact | Format |
|----------|--------|
| Full Review Packet | HTML |
| Contract Review | HTML |
| Revision Packet | HTML |
| Executive Memo | HTML |
| Contract Review | Markdown |
| Contract Review | JSON |

All artifacts are in `public/demo-artifacts/`. Run `npm run seed-demo` to regenerate them.

---

## Eval Harness

```bash
npm run eval
```

Runs deterministic checks on the 3 sample documents:

- Sample docs parse (`.txt`, `.md`, `.pdf`, `.docx` supported)
- Document type is detected correctly
- Known clauses are found when present
- Missing fields return `"Not found in the document."` (not empty string)
- Risks include real supporting quotes (not generic "See document")
- Provider metadata is attached to outputs
- Full pipeline (review → financial → memo → revision) completes
- Legal disclaimers are present in all outputs

Reports saved to `reports/evals/` as JSON + Markdown.

---

## AI Reliability

`ai-provider.ts` includes:

- **Safe JSON parsing** — if AI output is not valid JSON, the raw string and error are saved to `reports/errors/`
- **Zod schema validation** — if the parsed JSON fails schema validation, full error details are saved
- **Graceful mock fallback** — on any AI failure, the system falls back to mock mode and attaches a warning to the output
- **Provider metadata** — all outputs include `providerMode`, `fallbackUsed`, `sourceFilename`, `parsedCharacterCount`

---

## Report Metadata

Every output (review, financial, memo, revision) includes:

```json
{
  "sourceFilename": "my-contract.pdf",
  "sourceExtension": ".pdf",
  "parsedCharacterCount": 12453,
  "providerMode": "mock",
  "fallbackUsed": false,
  "warnings": []
}
```

---

## Supported Input Formats

| Format | Extension |
|--------|-----------|
| Plain text | `.txt` |
| Markdown | `.md` |
| PDF (text-based) | `.pdf` |
| Word document | `.docx` |

Drop files into `documents/inbox/` and run `npm run packet`.

---

## Using a Real AI Provider

Add to `.env.local`:

```
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1  # optional
OPENAI_MODEL=gpt-4o                         # optional
```

Any OpenAI-compatible endpoint works (OpenRouter, Together, Groq, local Ollama, etc.).

---

## Output Structure

```
reports/
  reviews/    — JSON + Markdown contract reviews
  financials/ — Financial analysis JSON
  memos/      — Memo JSON + Markdown
  revisions/  — Revision packet JSON + Markdown
  html/       — HTML reports
  pdfs/       — PDFs (requires Playwright Chromium)
  evals/      — Eval harness JSON + Markdown reports
  errors/     — Raw AI error logs (when fallback is triggered)
```

---

## Recruiter Screenshot Checklist

For a full demo of Synth's capabilities:

1. `/demo` — Static demo with full review, financials, memo, revisions
2. `/artifacts` — Downloadable sample outputs in HTML, Markdown, and JSON
3. `/dashboard` (local) — Run `npm run demo` first, then `npm run dashboard`
4. `/case-study` — Architecture, v1→v3 evolution, safety design, resume bullets
5. `npm run eval` — Pass/fail eval harness output in the terminal

---

## CI

GitHub Actions runs on every push to `main`:

- `npm ci`
- `npm run type-check`
- `npm run verify`
- `npm run build`
- `npm run eval`

Eval reports are uploaded as CI artifacts.

---

## Project Structure

```
src/
  app/         — Next.js routes: /, /demo, /artifacts, /dashboard, /case-study
  cli/         — CLI commands (tsx scripts)
  data/demo/   — Static fixture data for /demo route
  lib/         — AI provider, document loader, parser, renderers
  prompts/     — AI prompt modules
  schemas/     — Zod schemas for all outputs
documents/
  inbox/       — Drop your contracts here
  samples/     — Reference documents
public/
  demo-artifacts/ — Static downloadable artifacts for /artifacts
reports/         — All pipeline outputs
agent/           — CLAUDE.md, CODEX.md agent docs
```

---

> ⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.
