# Synth v4

**AI-powered legal and financial data room review — contracts, spreadsheets, cap tables, payment schedules.**

[![CI](https://github.com/dylancablayan/synth/actions/workflows/ci.yml/badge.svg)](https://github.com/dylancablayan/synth/actions/workflows/ci.yml)

> ⚠️ Synth is not legal advice or financial advice. It is a document review aid built as a portfolio project. Consult a qualified professional before making any decisions based on this software.

Synth is a local-first, CLI-driven document review system. Drop contracts, spreadsheets, cap tables, or invoices into `/documents/inbox`, run a command, and get structured analysis, cross-document findings, and polished reports saved to your machine.

**[Live Demo →](https://synth.dylancablayan.com/demo)** · **[Artifact Gallery →](https://synth.dylancablayan.com/artifacts)** · **[Case Study →](https://synth.dylancablayan.com/case-study)**

---

## Quickstart

```bash
git clone https://github.com/dylancablayan/synth
cd synth
npm install
npx playwright install chromium
npm run doctor
npm run demo           # contract review pipeline (3 sample docs)
npm run ingest         # parse all file types in inbox
npm run spreadsheet    # analyze CSV/XLSX
npm run dataroom       # full data room analysis
npm run dashboard
```

No API key required — runs in mock mode by default.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run doctor` | Check that everything is set up correctly |
| `npm run verify` | Verify all required files and scripts exist |
| `npm run demo` | Run the full contract pipeline on all 3 sample documents |
| `npm run analyze` | Analyze documents in `documents/inbox/` |
| `npm run memo` | Generate executive memo for latest analysis |
| `npm run revise` | Generate revision packet for latest analysis |
| `npm run pdf` | Generate individual PDFs from HTML reports |
| `npm run packet` | Run full contract pipeline: analyze → memo → revise → pdf |
| `npm run ingest` | Parse all supported files (contracts + spreadsheets) in inbox |
| `npm run spreadsheet` | Analyze CSV/XLSX → reports/tables/ (JSON + MD + HTML) |
| `npm run dataroom` | Full mixed-packet analysis → reports/dataroom/ (JSON + MD + HTML + PDF) |
| `npm run seed-demo` | Refresh static demo data and artifact gallery from pipeline |
| `npm run eval` | Run deterministic eval harness on sample documents + spreadsheets |
| `npm run dashboard` | Open local dashboard at http://localhost:3000 |
| `npm run build` | Build Next.js for deployment |
| `npm run type-check` | TypeScript type check (no emit) |

---

## Supported Input Formats

| Format | Extension | Analysis |
|--------|-----------|---------|
| Plain text | `.txt` | Contract review |
| Markdown | `.md` | Contract review |
| PDF (text-based) | `.pdf` | Contract review |
| Word document | `.docx` | Contract review |
| CSV spreadsheet | `.csv` | Spreadsheet / data room analysis |
| Excel spreadsheet | `.xlsx` | Spreadsheet / data room analysis |

Drop files into `documents/inbox/` and run `npm run ingest` (all types) or `npm run packet` (contracts only).

---

## Spreadsheet Analysis (v4)

```bash
npm run spreadsheet
```

Analyzes CSV/XLSX files and saves to `reports/tables/`:
- Extracts column types (string, number, date, currency, email)
- Detects payment schedules, cap tables, invoices, vendor lists
- Extracts entities, amounts, dates, emails
- Detects repeated vendors, overdue rows, blank cell warnings
- Computes totals/subtotals
- Saves JSON + Markdown + HTML per file

---

## Data Room Analysis (v4)

```bash
npm run dataroom
```

Analyzes the full `/documents/inbox` as a mixed packet and saves to `reports/dataroom/`:
- Cross-document checks: contract terms vs. payment schedules, cap tables vs. term sheets
- Party/vendor name reconciliation across documents
- Payment schedule findings with vendor, amount, due date, status
- Cap table rows with investor, share class, ownership %
- Data quality warnings (overdue rows, blank cells, repeated vendors)
- Full dataroom JSON + Markdown + HTML + PDF (if Playwright available)

---

## Deployed vs. Local

**Deployed site** (`/demo`, `/artifacts`): Works without cloning the repo. Uses static fixture data. Shows full review, financial analysis, memo, revisions, spreadsheet analyses, and data room summary.

**Local workflow** (`npm run demo`, `npm run dataroom`): Runs the full pipeline on your documents. Generates real JSON, Markdown, HTML, and PDF reports in `/reports/`. Requires Node.js 18+ and Playwright Chromium for PDF generation.

---

## Eval Harness

```bash
npm run eval
```

Runs deterministic checks (89 total in v4):

**Contract checks (per document):**
- Sample docs parse (`.txt`, `.md`, `.pdf`, `.docx` supported)
- Document type detected correctly
- Known clauses found when present
- Missing fields return `"Not found in the document."` (not empty string)
- Risks include real supporting quotes (not generic "See document")
- Full pipeline (review → financial → memo → revision) completes
- Legal disclaimers are present in all outputs

**Spreadsheet checks (v4, per file):**
- CSV/XLSX parses without error
- Headers extracted
- Row count > 0
- Correct type detected (payment schedule / cap table / invoice)
- Currency amounts extracted
- SpreadsheetAnalysis schema validates
- Key findings generated

**Data room checks (v4):**
- DataRoomSummary schema validates
- Payment findings present
- Cap table findings present
- Disclaimer present
- Executive summary is not generic

---

## AI Reliability

`ai-provider.ts` includes:

- **Safe JSON parsing** — if AI output is not valid JSON, the raw string and error are saved to `reports/errors/`
- **Zod schema validation** — if the parsed JSON fails schema validation, full error details are saved
- **Graceful mock fallback** — on any AI failure, the system falls back to mock mode and attaches a warning to the output
- **Provider metadata** — all outputs include `providerMode`, `fallbackUsed`, `sourceFilename`, `parsedCharacterCount`

---

## New Schemas (v4)

| Schema | Description |
|--------|-------------|
| `TableProfile` | Per-sheet column profiles, detected entities, amounts, dates, warnings |
| `SpreadsheetAnalysis` | Full spreadsheet analysis with all table profiles |
| `DataRoomSummary` | Cross-document data room summary |
| `CrossDocumentFinding` | Single cross-document mismatch finding |
| `PaymentScheduleFinding` | One payment row with vendor, amount, status |
| `CapTableFinding` | One cap table row with investor, share class, ownership |

---

## Output Structure

```
reports/
  reviews/    — JSON + Markdown contract reviews
  financials/ — Financial analysis JSON
  memos/      — Memo JSON + Markdown
  revisions/  — Revision packet JSON + Markdown
  html/       — HTML reports (contracts + spreadsheets)
  tables/     — Spreadsheet profile JSON + Markdown + HTML (v4)
  dataroom/   — Data room JSON + Markdown + HTML + PDF (v4)
  pdfs/       — PDFs (requires Playwright Chromium)
  evals/      — Eval harness JSON + Markdown reports
  errors/     — Raw AI error logs (when fallback is triggered)
```

---

## Recruiter Screenshot Checklist

1. `/demo` — Static demo with full review, financials, memo, revisions
2. `/artifacts` — Downloadable sample outputs including v4 spreadsheet + dataroom JSON
3. `/dashboard` (local) — Run `npm run demo && npm run dataroom` first
4. `/case-study` — Architecture, v1→v4 evolution, safety design, resume bullets
5. `npm run eval` — 89 pass/fail checks in the terminal

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

## Project Structure

```
src/
  app/         — Next.js routes: /, /demo, /artifacts, /dashboard, /case-study
  cli/         — CLI commands (tsx scripts)
    ingest.ts      — Parse all file types (v4)
    spreadsheet.ts — Analyze CSV/XLSX (v4)
    dataroom.ts    — Full data room analysis (v4)
  data/demo/   — Static fixture data for /demo route
  lib/         — AI provider, document loader, parser, renderers
    spreadsheet-parser.ts       — CSV/XLSX parsing + table profiling (v4)
    mock-spreadsheet-provider.ts — Mock analysis for spreadsheets + dataroom (v4)
  prompts/     — AI prompt modules
    spreadsheet-analysis.prompt.ts — v4
    dataroom-review.prompt.ts      — v4
  schemas/     — Zod schemas for all outputs
    spreadsheet.schema.ts — v4 schemas
documents/
  inbox/       — Drop your contracts and spreadsheets here
    sample-payment-schedule.csv — v4 sample
    sample-cap-table.csv        — v4 sample
    sample-vendor-invoices.csv  — v4 sample
public/
  demo-artifacts/ — Static downloadable artifacts for /artifacts
reports/         — All pipeline outputs
agent/           — CLAUDE.md, CODEX.md agent docs
```

---

## Limitations

- Mock mode produces illustrative output, not document-specific AI analysis
- Scanned PDFs (image-only) are not supported — only text-based PDFs
- XLSX support covers standard table sheets; complex pivot tables or merged cells may not parse correctly
- Cross-document findings are heuristic-based in mock mode — use AI mode for deeper analysis
- Not production legal or compliance software
- PDF generation requires Playwright + Chromium

---

> ⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.
