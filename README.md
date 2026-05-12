# Synth

**AI contract review for legal and financial documents.**

> ⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.

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
| `npm run demo` | Run the full pipeline on all sample documents |
| `npm run analyze` | Analyze documents in `/documents/inbox` |
| `npm run memo` | Generate an executive memo from the latest review |
| `npm run revise` | Generate a clause-by-clause revision packet |
| `npm run pdf` | Generate PDFs from the latest artifacts |
| `npm run packet` | Full pipeline: analyze → memo → revise → pdf |
| `npm run dashboard` | Open the local dashboard at `localhost:3000` |

---

## How it works

1. Drop a `.txt` contract into `/documents/inbox/`
2. Run `npm run packet`
3. Get structured outputs in `/reports/`:
   - Risk review (JSON + Markdown + HTML)
   - Financial analysis
   - Executive memo
   - Clause-by-clause revision packet
   - PDFs of all of the above

---

## Claude Code slash commands

If you're using Claude Code CLI, these slash commands work from inside this repo:

| Command | What it does |
|---------|-------------|
| `/synth` | Full pipeline + revision summary inline |
| `/synth-revise` | Revision packet + PDF |
| `/synth-memo` | Executive memo + PDF |

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
└── pdfs/          Generated PDFs
```

---

## Sample documents

Three realistic fake contracts are included for testing:

- `sample-saas-agreement.txt` — SaaS subscription with auto-renewal and data rights issues
- `sample-term-sheet.txt` — Series A term sheet with liquidation preference and pro-rata rights
- `sample-contractor-agreement.txt` — Independent contractor agreement with non-compete and IP assignment

---

## Environment

No API key required. Synth runs in mock mode by default.

To use a real AI provider, add to `.env.local`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

Any OpenAI-compatible provider works (`OPENAI_BASE_URL` to override the endpoint).

---

## PDF generation

Requires Playwright:

```bash
npx playwright install chromium
npm run pdf
```

PDFs are saved to `/reports/pdfs/`. If Playwright isn't installed, HTML is still saved to `/reports/html/`.

---

## Stack

TypeScript · Node.js · Next.js App Router · Tailwind CSS · Zod · Playwright

---

## Limitations

- Plain text only (no PDF/DOCX ingestion)
- Mock mode output is illustrative, not document-specific
- Not a production legal system — this is a prototype

---

> ⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.
