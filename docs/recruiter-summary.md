# Synth Recruiter Summary

Synth is a local-first TypeScript diligence system for mixed legal and financial document packets. It ingests sample contracts and spreadsheets, produces structured reviews and data room summaries, converts findings into an issue log backed by an evidence ledger, exports CSV/XLSX handoff files, and compares repeated runs. The project is built as a portfolio prototype, with visible disclaimers and mock mode by default so reviewers can clone and run it without an API key.

## Resume Bullets

- Built a local-first AI diligence pipeline in TypeScript with CLI commands, Zod schemas, mock/live provider modes, HTML/PDF rendering, and a Next.js portfolio dashboard.
- Implemented an evidence-backed issue engine that converts contract, spreadsheet, and data room findings into structured issues linked to document quotes, spreadsheet rows, or verification notes.
- Shipped handoff and verification surfaces including CSV/XLSX exports, run comparison reports, static demo artifacts, and a deterministic eval harness covering 98 checks.

## Screenshot Suggestions

1. `/demo` with the issue log and evidence ledger visible.
2. `/artifacts` showing PDF, issue log, evidence ledger, CSV, XLSX, and compare report cards.
3. `/dashboard` after running `npm run demo && npm run dataroom && npm run triage && npm run export`.
4. Terminal output from `npm run eval` showing `98/98 checks passed`.
5. `reports/exports/` showing `issues.csv`, `evidence.csv`, `payments.csv`, `cap-table.csv`, and `dataroom-summary.xlsx`.
