# Synth

**AI contract review for legal and financial documents.**

> ⚠️ Synth is not legal advice or financial advice. It is a document review aid built as a portfolio project. Consult a qualified professional before making any decisions based on this software.

Synth is a local-first document review system. Drop a contract into `/documents/inbox`, run a command, and get a structured risk review, financial analysis, revision packet, and PDF — all saved to your machine.

---

## Quickstart

```bash
git clone https://github.com/dcablayan/Synth
cd Synth
npm install
npx playwright install chromium
npm run doctor
npm run demo
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run doctor` | Check that everything is set up correctly |
| `npm run verify` | Verify all required files and scripts exist |
| `npm run demo` | Run the full pipeline on all 3 sample documents |
| `npm run analyze` | Analyze documents in `/documents/inbox` |
| `npm run memo` | Generate an executive memo from the latest review |
| `npm run revise` | Generate a clause-by-clause revision packet |
| `npm run pdf` | Generate individual PDFs from the latest artifacts |
| `npm run packet` | Full pipeline: analyze → memo → revise → PDF → full packet PDF |
| `npm run dashboard` | Open the local dashboard at `localhost:3000` |

---

## How it works

1. Drop a contract into `/documents/inbox/` (`.txt`, `.md`, `.pdf`, or `.docx`)
2. Run `npm run packet`
3. Get structured outputs in `/reports/`:
   - Risk review (JSON + Markdown + HTML)
   - Financial analysis
   - Executive memo
   - Clause-by-clause revision packet
   - Individual PDFs for each artifact
   - **Full combined packet PDF** (`reports/pdfs/[slug]-full-packet.pdf`)

---

## Supported input formats

| Format | Notes |
|--------|-------|
| `.txt` | Plain text — fully supported |
| `.md`  | Markdown — fully supported |
| `.pdf` | Text-based PDFs only (not scanned/image PDFs) |
| `.docx` | Word documents via mammoth |

Drop files into `/documents/inbox/`. The pipeline processes all supported files found there.

---

## Mock mode vs. AI mode

**Mock mode** (default, no API key required):
- Extracts real text snippets from your document for key terms (payment, renewal, termination, governing law, liability cap, etc.) using regex heuristics
- Falls back to "Not found in the document." when a term cannot be found
- Risk matrix, financial flags, and revision suggestions are illustrative — not document-specific

**AI mode** (requires API key):
- Full document-specific analysis using a real language model
- Structured JSON outputs validated with Zod

To use AI mode, add to `.env.local`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

Any OpenAI-compatible provider works (`OPENAI_BASE_URL` to override the endpoint).

---

## Outputs

All artifacts are saved to `/reports/`:

```
reports/
├── reviews/       JSON + Markdown risk reviews
├── financials/    Financial term extraction
├── memos/         Executive memos
├── revisions/     Clause revision packets
├── html/          HTML intermediates
├── pdfs/          Individual PDFs + full-packet.pdf
└── exports/       Reserved for future export formats
```

The full packet PDF combines review, financial analysis, executive memo, and revision packet into a single printable document.

---

## Sample documents

Three realistic fake contracts are included for testing:

- `sample-saas-agreement.txt` — SaaS subscription with auto-renewal and data rights issues
- `sample-term-sheet.txt` — Series A term sheet with liquidation preference and pro-rata rights
- `sample-contractor-agreement.txt` — Independent contractor with non-compete and IP assignment

---

## PDF generation

Requires Playwright (Chromium):

```bash
npx playwright install chromium
npm run pdf       # Individual PDFs
npm run packet    # Full pipeline including combined packet PDF
```

PDFs are saved to `/reports/pdfs/`. If Playwright isn't installed, HTML is still saved to `/reports/html/`.

---

## Claude Code slash commands

If you're using Claude Code CLI, these slash commands work from inside this repo:

| Command | What it does |
|---------|-------------|
| `/synth` | Full pipeline + revision summary inline |
| `/synth-revise` | Revision packet + PDF |
| `/synth-memo` | Executive memo + PDF |

---

## Stack

TypeScript · Node.js · Next.js 14 App Router · Tailwind CSS · Zod · Playwright · pdf-parse · mammoth

---

## What to screenshot for recruiters

1. `npm run demo` output in terminal — shows the full pipeline running
2. The dashboard at `localhost:3000/dashboard` — shows the risk matrix and extracted terms
3. A generated PDF opened in Preview/Acrobat — shows the full-packet output
4. `npm run doctor` + `npm run verify` passing — shows the system is clean

---

## Known limitations

- **No scanned PDF support.** Only text-based PDFs can be parsed. Scanned or image PDFs require OCR (not included).
- **Mock mode is illustrative.** Regex extraction finds common clause patterns but will miss unusual drafting. Run with a real API key for accurate analysis.
- **Not a production system.** This is a solo-built portfolio prototype. It has no authentication, no database, no multi-user support.
- **No legal validity.** Revision suggestions are placeholder language for professional review. Nothing in this software constitutes legal advice.
- **Playwright required for PDFs.** Run `npx playwright install chromium` once after `npm install`.

---

> ⚠️ Synth is not legal advice or financial advice. It is a document review aid built as a portfolio project. Consult a qualified professional before making decisions.
