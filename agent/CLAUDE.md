# Synth — Agent Guide for Claude Code CLI

> **Safety First:** Synth is not legal advice or financial advice. It is a document review aid.
> Never remove or weaken the disclaimer. Never invent document facts. Never claim outputs are legally valid.

## What is Synth?

Synth is a local-first AI contract review and financial document analysis system. Users clone the repo, drop legal or financial documents into `/documents/inbox`, run CLI commands, and receive structured contract reviews, financial analysis, revision suggestions, memos, and polished PDFs.

**This is a repo-first AI operations system, not a web app.**

## Running the Project

```bash
npm install
npx playwright install chromium     # Required for PDF generation
npm run doctor                       # Check setup
npm run verify                       # Verify repo integrity
npm run demo                         # Full demo on sample documents
npm run dashboard                    # Start Next.js UI at localhost:3000
```

## Analyzing Documents

1. Drop a .txt document into `/documents/inbox/`
2. Run: `npm run analyze`
3. Outputs saved to `/reports/reviews/`, `/reports/financials/`, `/reports/html/`

Or run the full pipeline at once:
```bash
npm run packet
```

## Generating PDFs

```bash
npm run pdf         # Generate PDFs from latest review artifacts
npm run packet      # Full pipeline including PDFs
```

PDFs require Playwright: `npx playwright install chromium`
PDFs are saved to: `/reports/pdfs/`
HTML intermediates are saved to: `/reports/html/`

If PDF generation fails, HTML is still saved. Check that Playwright/Chromium is installed.

## Generating Revision Packets

```bash
npm run revise      # Generate clause-by-clause revision packet
```

Outputs saved to `/reports/revisions/`.

**Disclaimer:** All suggested language in revision packets is for review by a qualified professional. Never claim it is legally valid.

## Adding New Document Types

1. Open `src/lib/parser.ts`
2. Add a new entry to `TYPE_SIGNALS` with patterns that match the new document type
3. Add the type to `DocumentType` in `src/schemas/review.schema.ts`
4. Update prompts in `src/prompts/contract-review.prompt.ts` if needed
5. Test with a sample document in `/documents/inbox/`

## Improving Prompts

Prompts are in `src/prompts/`. Each file exports:
- A `SYSTEM` constant (system prompt)
- A `build*Prompt()` function that accepts document text and returns the user prompt

To improve contract review:
1. Edit `src/prompts/contract-review.prompt.ts`
2. Modify the JSON schema description or add guidance
3. Run `npm run analyze` to test

Key rules to preserve in prompts:
- "If something is not found, say 'Not found in the document.'"
- "supportingQuote must be a direct quote from the document"
- "Return only valid JSON, no markdown fences"

## Debugging Failed Analysis

**Symptom:** `npm run analyze` fails or produces empty output.

1. Check mock mode: if no `OPENAI_API_KEY` is set, mock mode is used. This is fine.
2. Check document loading: `cat documents/inbox/your-file.txt`
3. Check schema: AI output is validated by Zod. If it fails, the raw output will be logged.
4. Check the prompt: if using a real API, the response must be valid JSON matching the schema.

**Symptom:** Zod validation error.

The AI response didn't match the expected schema. Options:
1. Add better JSON instructions to the prompt
2. Set `temperature: 0` in `src/lib/ai-provider.ts`
3. Retry — some models occasionally produce malformed JSON

## Debugging Playwright/PDF Issues

```bash
# Check if Playwright is installed
npx playwright --version

# Install Chromium
npx playwright install chromium

# Run doctor check
npm run doctor
```

Common issues:
- `Error: browserType.launch: Executable doesn't exist` → Run `npx playwright install chromium`
- `PDF generation failed` → Check that Chromium path is correct
- HTML is always saved even when PDF fails — check `/reports/html/`

## Running verify, doctor, demo, packet

```bash
npm run doctor     # Environment and setup check
npm run verify     # Repo integrity check
npm run demo       # Full run on all 3 sample documents
npm run packet     # Full pipeline: analyze → memo → revise → pdf
```

## Portfolio Screenshots

Key pages/outputs to screenshot:
1. Terminal: `npm run demo` output
2. Terminal: `npm run doctor` output (all checks pass)
3. Browser: `/dashboard` showing risk matrix and document list
4. Browser: `/case-study` page
5. File: A generated PDF (open from `/reports/pdfs/`)
6. File: A generated Markdown review (open from `/reports/reviews/`)

## Environment Variables

```env
OPENAI_API_KEY=sk-...           # Optional. If not set, mock mode is used.
OPENAI_BASE_URL=...             # Optional. Defaults to OpenAI. Use for any OpenAI-compatible provider.
OPENAI_MODEL=gpt-4o             # Optional. Model to use.
```

## File Structure

```
/documents/inbox          ← Drop documents here
/documents/processed      ← Processed copies (optional)
/reports/reviews          ← JSON + Markdown reviews
/reports/financials       ← Financial JSON
/reports/memos            ← Memo JSON + Markdown
/reports/revisions        ← Revision JSON + Markdown
/reports/html             ← HTML intermediates
/reports/pdfs             ← Generated PDFs
/src/cli/                 ← All CLI scripts
/src/lib/                 ← Library modules
/src/schemas/             ← Zod schemas
/src/prompts/             ← AI prompts
/agent/                   ← Agent documentation
/templates/               ← HTML PDF templates
```
