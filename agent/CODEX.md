# Synth — Agent Guide for Codex CLI

> **Safety First:** Synth is not legal advice or financial advice. It is a document review aid.
> Every output must include the disclaimer. Never invent document facts. Never remove safety guardrails.

## What is Synth?

Synth is a local-first, CLI-driven AI contract review system. Users clone the repo, drop documents into `/documents/inbox`, and run npm scripts to receive structured reviews, financial analysis, revision packets, memos, and PDFs.

## Quick Start

```bash
npm install
npx playwright install chromium
npm run doctor
npm run demo
```

## Recommended /goal Examples for Future Improvements

### Add a new document parser
```
/goal Add a parser for SAFE (Simple Agreement for Future Equity) documents in src/lib/parser.ts. 
Add "SAFE Agreement" to the DocumentType enum in src/schemas/review.schema.ts. 
Add sample-safe-agreement.txt to documents/inbox with realistic but fake content.
Test with npm run analyze.
```

### Improve risk scoring
```
/goal Improve the risk scoring algorithm in src/lib/risk-scoring.ts. 
Current scoring: Critical=25, High=15, Medium=8, Low=3 per risk, capped at 100.
Consider: number of risks, document type weighting, missing clause penalties.
Update calculateRiskScore() and scoreToLevel() functions.
Test by running npm run demo and verifying scores change.
```

### Add a new HTML template style
```
/goal Redesign the PDF templates in /templates/ and src/lib/html-renderer.ts to use a more modern style.
Keep: cover page, disclaimer, risk badges, tables, page numbers.
Change: typography, color scheme, layout.
Test with npm run pdf after npm run demo.
```

### Add PDF comparison mode
```
/goal Add a new CLI script src/cli/compare.ts that compares two JSON reviews from /reports/reviews/ 
and outputs a diff showing which risks changed, which clauses changed, and a side-by-side summary.
Add "compare": "tsx src/cli/compare.ts" to package.json scripts.
```

### Improve prompts for contractor agreements
```
/goal Review and improve the contract review prompt in src/prompts/contract-review.prompt.ts 
specifically for independent contractor agreements. Add guidance about non-compete enforceability, 
work-for-hire provisions, and contractor misclassification risk. Test with sample-contractor-agreement.txt.
```

### Add Anthropic API support
```
/goal Add Anthropic Claude API support to src/lib/ai-provider.ts as an alternative to OpenAI.
If ANTHROPIC_API_KEY is set, use the Anthropic Messages API. If OPENAI_API_KEY is set, use OpenAI.
If neither, use mock mode. Keep the provider selection logic clear and documented.
```

## Workflow Commands

```bash
npm run doctor      # Check system setup
npm run verify      # Check repo integrity
npm run demo        # Run all samples through full pipeline
npm run analyze     # Analyze /documents/inbox
npm run memo        # Generate memo from latest review
npm run revise      # Generate revision packet from latest review
npm run pdf         # Generate PDFs from latest artifacts
npm run packet      # Full pipeline: analyze → memo → revise → pdf
npm run dashboard   # Start Next.js dashboard at localhost:3000
npm run build       # Build for production
```

## Adding New Parsers

Edit `src/lib/parser.ts`:

```typescript
// Add to TYPE_SIGNALS array:
{
  type: 'SAFE Agreement',
  patterns: [
    /safe|simple agreement for future equity/i,
    /valuation cap|discount rate|pro.rata rights/i,
  ],
},
```

Then add to the `DocumentType` union in `src/schemas/review.schema.ts`.

## Adding New Sample Documents

1. Create a realistic but entirely fake document
2. Place in `/documents/inbox/sample-[type].txt`
3. Include enough clauses to test: payment, renewal, termination, confidentiality, liability, governing law
4. Run `npm run demo` to verify it processes correctly
5. Run `npm run doctor` to confirm sample detection passes

## Improving Templates

HTML templates are in two places:
- `/templates/` — static reference templates
- `src/lib/html-renderer.ts` — dynamic HTML generation functions

To change PDF design:
1. Edit the render functions in `html-renderer.ts`
2. Run `npm run pdf` to test
3. HTML is also saved to `/reports/html/` for inspection

## Refining Risk Scoring

Risk scoring is in `src/lib/risk-scoring.ts`. Current weights:

| Severity | Points |
|----------|--------|
| Critical | 25 |
| High | 15 |
| Medium | 8 |
| Low | 3 |

Score → Level mapping:
- 0-30: Low
- 31-60: Medium  
- 61-80: High
- 81-100: Critical

## Safety Rules — Never Violate

1. Every output must include: "Synth is not legal advice or financial advice."
2. Never remove the `disclaimer` field from any schema.
3. Never invent document facts — every finding needs a `supportingQuote`.
4. Revision language must be labeled as "for review by a qualified professional."
5. If data is not found: output "Not found in the document." — never make something up.
6. Mock mode must always work without an API key.
