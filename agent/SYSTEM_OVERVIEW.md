# Synth — System Overview

## Architecture

Synth is a four-layer system:

```
┌─────────────────────────────────────────────────┐
│  CLI Layer          /src/cli/                    │
│  doctor · verify · demo · analyze                │
│  memo · revise · generate-pdf · packet           │
├─────────────────────────────────────────────────┤
│  Library Layer      /src/lib/                   │
│  document-loader · parser · ai-provider          │
│  mock-provider · risk-scoring · report-writer    │
│  html-renderer · pdf-writer                      │
├─────────────────────────────────────────────────┤
│  Schema Layer       /src/schemas/               │
│  review · financial · memo · revision (Zod)      │
├─────────────────────────────────────────────────┤
│  Prompt Layer       /src/prompts/               │
│  contract-review · financial-analysis            │
│  memo · revision                                 │
└─────────────────────────────────────────────────┘
│  UI Layer           /src/app/                   │
│  Next.js App Router — reads /reports/ at runtime │
└─────────────────────────────────────────────────┘
```

## Data Flow

```
/documents/inbox/[file.txt]
      ↓
document-loader.ts → loads text
      ↓
parser.ts → detects type, extracts title
      ↓
ai-provider.ts → calls mock or real AI
      ↓
Zod schema validation
      ↓
report-writer.ts → saves JSON + Markdown
html-renderer.ts → saves HTML
pdf-writer.ts → saves PDF (if Playwright available)
      ↓
/reports/{reviews,financials,memos,revisions,html,pdfs}/
      ↓
Next.js dashboard reads /reports/ at request time
```

## File Flow

| Input | Command | Output |
|-------|---------|--------|
| /documents/inbox/*.txt | npm run analyze | /reports/reviews/*.json + *.md + HTML |
| /reports/reviews/*.json | npm run memo | /reports/memos/*.json + *.md + HTML |
| /reports/reviews/*.json | npm run revise | /reports/revisions/*.json + *.md + HTML |
| /reports/html/*.html | npm run pdf | /reports/pdfs/*.pdf |
| All of above | npm run packet | All of above |

## AI Provider Flow

```
isMockMode() →
  true  → generateMock*() functions in mock-provider.ts
  false → callOpenAI() → parse JSON → Zod.parse() → return
```

If `OPENAI_API_KEY` is set:
- Uses OpenAI (or OpenAI-compatible) API
- Model: `OPENAI_MODEL` env var, default `gpt-4o`
- Base URL: `OPENAI_BASE_URL` env var, default OpenAI

If no key:
- Mock mode is used automatically
- No API calls are made
- All outputs are clearly labeled as mock

## Mock Mode Flow

1. `isMockMode()` checks `process.env.OPENAI_API_KEY`
2. If no key, calls `generateMockReview()`, `generateMockFinancial()`, etc. from `mock-provider.ts`
3. Mock data includes realistic structure with clear "mock mode active" notices
4. All Zod schemas are still applied to mock output
5. CLI outputs a notice: `[mock mode] Using mock provider`

## Report Generation Flow

```typescript
// Review
const review = await runContractReview(text, title)  // → Review type (Zod-validated)
saveReviewJSON(review)                                 // → /reports/reviews/*.json
saveReviewMarkdown(review)                             // → /reports/reviews/*.md
saveHTML(renderReviewHTML(review), name)               // → /reports/html/*.html

// Financial
const financial = await runFinancialAnalysis(text, title)
saveFinancialJSON(financial)                           // → /reports/financials/*.json

// Memo
const memo = await runMemoGeneration(review)
saveMemoJSON(memo)                                     // → /reports/memos/*.json
saveMemoMarkdown(memo)                                 // → /reports/memos/*.md

// Revision
const revision = await runRevisionGeneration(text, review)
saveRevisionJSON(revision)                             // → /reports/revisions/*.json
saveRevisionMarkdown(revision)                         // → /reports/revisions/*.md
```

## PDF Generation Flow

```typescript
// 1. Render HTML
const html = renderReviewHTML(review)        // → HTML string
const htmlPath = saveHTML(html, name)        // → /reports/html/name.html

// 2. Launch Playwright
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({ path: outputPath, format: 'A4', printBackground: true })
await browser.close()
// → /reports/pdfs/name.pdf
```

If Playwright fails:
- Error is caught and surfaced cleanly
- HTML is still saved
- CLI continues (does not crash)

## Dashboard Flow

The Next.js dashboard uses App Router with `force-dynamic` rendering.

At each request:
1. Reads `/reports/reviews/*.json`
2. Reads `/reports/financials/*.json`
3. Reads `/reports/memos/*.json`
4. Reads `/reports/revisions/*.json`
5. Checks `/reports/pdfs/` for PDF filenames
6. Renders all data server-side — no client-side data fetching required

The dashboard is a read-only view of the filesystem output from CLI commands.

## Environment

```
OPENAI_API_KEY     — Optional. If absent, mock mode.
OPENAI_BASE_URL    — Optional. Any OpenAI-compatible endpoint.
OPENAI_MODEL       — Optional. Default: gpt-4o
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| tsx | Run TypeScript CLI scripts without compilation |
| zod | Schema validation for all AI output |
| playwright | Headless Chromium for PDF generation |
| next | Dashboard UI |
| chalk | CLI output formatting |
| glob | File discovery |
| marked | Markdown rendering (utility) |
