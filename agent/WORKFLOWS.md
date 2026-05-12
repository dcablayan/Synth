# Synth — Workflows

## 1. Review a New Contract

```bash
# 1. Place document in inbox
cp my-contract.txt documents/inbox/

# 2. Run analysis
npm run analyze

# 3. Check outputs
ls reports/reviews/
ls reports/financials/
ls reports/html/
```

**What happens:**
- Document type is detected automatically
- Contract review JSON is created with risk score, risks, key terms, citations
- Financial analysis JSON is created
- Markdown and HTML reports are saved
- No document is modified in inbox

---

## 2. Generate a Memo

```bash
npm run memo
```

**Requires:** At least one review in `/reports/reviews/`

**Outputs:**
- `/reports/memos/[document-name]-memo.json`
- `/reports/memos/[document-name]-memo.md`
- `/reports/html/[document-name]-memo.html`

**What it contains:**
- Executive summary
- Biggest risks with severity
- Financial obligations
- Important deadlines
- Questions to ask a lawyer
- Action items
- Disclaimer

---

## 3. Generate PDFs

```bash
# Ensure Playwright is installed
npx playwright install chromium

# Run PDF generation
npm run pdf
```

**Requires:** At least one review in `/reports/reviews/`

**Outputs:**
- `/reports/pdfs/[name]-review.pdf`
- `/reports/pdfs/[name]-memo.pdf` (if memo exists)
- `/reports/pdfs/[name]-revision.pdf` (if revision exists)
- `/reports/html/[name]-*.html` (always saved, even if PDF fails)

**If PDF fails:**
HTML is still saved. Common fix: `npx playwright install chromium`

---

## 4. Create a Revision Packet

```bash
npm run revise
```

**Requires:** At least one review in `/reports/reviews/`

**Outputs:**
- `/reports/revisions/[name]-revision.json`
- `/reports/revisions/[name]-revision.md`
- `/reports/html/[name]-revision.html`

**Revision packet includes:**
- Revision summary
- Priority changes
- Clause-by-clause revisions with original language and suggested replacement
- Negotiation notes
- Questions for a lawyer
- Disclaimer (always)

---

## 5. Full Packet (all at once)

```bash
npm run packet
```

Runs: `analyze → memo → revise → pdf`

---

## 6. Add a New Parser

1. Open `src/lib/parser.ts`
2. Add entry to `TYPE_SIGNALS`:
```typescript
{
  type: 'Employment Agreement',
  patterns: [
    /employment agreement|offer letter/i,
    /base salary|at.will employment/i,
  ],
},
```
3. Add to `DocumentType` in `src/schemas/review.schema.ts`
4. Test: place a sample document in `/documents/inbox/` and run `npm run analyze`

---

## 7. Add a New Sample Document

1. Create a realistic but entirely **fictional** document
2. Include:
   - Payment terms
   - Renewal provisions
   - Termination clause
   - Confidentiality section
   - Liability limitations
   - Governing law
   - At least one vague, unusual, or risky clause
3. Place in `/documents/inbox/sample-[type].txt`
4. Run `npm run demo` to verify processing
5. Run `npm run doctor` to confirm detection

---

## 8. Improve Risk Scoring

1. Open `src/lib/risk-scoring.ts`
2. Modify `SEVERITY_WEIGHTS`:
```typescript
const SEVERITY_WEIGHTS = {
  Critical: 30,   // was 25
  High: 18,       // was 15
  Medium: 8,
  Low: 3,
} as const;
```
3. Modify `scoreToLevel()` thresholds if needed
4. Run `npm run demo` to see score changes across sample documents

---

## 9. Prepare a Portfolio Demo

**Screenshots to capture:**

1. `npm run doctor` — all checks passing
2. `npm run demo` — processing all 3 samples
3. Dashboard at `localhost:3000/dashboard` — full document loaded
4. Dashboard risk matrix section
5. Dashboard financial terms table
6. A generated PDF open in a viewer
7. The `/case-study` page
8. A Markdown review file open in VS Code or a text editor

**Commands to run for clean demo:**
```bash
# Clean state
rm -rf reports/reviews/* reports/memos/* reports/financials/* reports/revisions/* reports/html/* reports/pdfs/*

# Full pipeline
npm run demo

# Open dashboard
npm run dashboard
# → http://localhost:3000
```

---

## 10. Debug a Failed Command

**npm run analyze fails:**
1. Check that documents exist in `/documents/inbox/`
2. Check `npm run doctor` output
3. If using real AI: check `OPENAI_API_KEY` is set and valid
4. If mock mode: check for Zod validation errors in console output

**npm run pdf fails:**
1. Run `npx playwright install chromium`
2. Run `npm run doctor` to check Playwright status
3. HTML is saved even when PDF fails — check `/reports/html/`

**npm run dashboard shows empty:**
1. Run `npm run demo` first to generate reports
2. Restart dashboard: `npm run dashboard`

**Zod validation error:**
- The AI response didn't match the expected schema
- Check the raw JSON in the error output
- Fix the prompt in `/src/prompts/` to enforce the exact schema structure
- Or add fallback handling in the affected provider function
