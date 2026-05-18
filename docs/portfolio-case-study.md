# Synth Portfolio Case Study

## Problem

Small teams often receive diligence packets that mix contracts, cap tables, payment schedules, and vendor invoices. A chat interface can answer isolated questions, but it does not naturally produce a repeatable issue log, evidence trail, exports, or run-to-run comparison. Synth explores a repo-first workflow where the source documents stay local and the outputs are structured enough for review, handoff, and auditing.

Synth is not legal advice or financial advice. It is a document review aid and portfolio project.

## Why Not Just Chat With PDF

Chat-with-PDF is optimized for ad hoc Q&A. Synth is optimized for a repeatable diligence workflow:

- The CLI writes durable artifacts instead of transient chat answers.
- Zod schemas define the shape of reviews, spreadsheet analysis, data room summaries, issues, evidence, and compare reports.
- Every issue links to at least one evidence item.
- CSV/XLSX exports let a reviewer sort, filter, and hand off findings outside the app.
- Compare reports make repeated data room runs auditable.

## Workflow

1. Place sample or user-provided files in `documents/inbox/`.
2. Run `npm run demo` for contract review, financial extraction, memo, revision packet, HTML, and PDF attempts.
3. Run `npm run dataroom` for mixed contract and spreadsheet analysis.
4. Run `npm run triage` to convert report findings into issues and evidence.
5. Run `npm run export` to produce CSV files and a multi-sheet XLSX workbook.
6. Run `npm run compare` to diff two data room runs.
7. Use `/demo`, `/artifacts`, `/dashboard`, and `/case-study` to present the outputs.

## Evidence Ledger

The v5 triage layer produces an `IssueLog` plus evidence records. Issues include severity, category, source files, recommendation, affected rows, and evidence IDs. Evidence records include source filename, quote or spreadsheet row, verification status, and verification notes when direct evidence is unavailable.

The eval harness checks that every issue has evidence and that evidence IDs link back to valid issues. This makes the demo more credible than a freeform AI summary because claims have a structured path back to source material.

## Outputs

Key generated outputs:

- `reports/dataroom/`: mixed-packet data room summaries in JSON, Markdown, and HTML.
- `reports/issues/`: unified issue logs in JSON, Markdown, and HTML.
- `reports/evidence/`: evidence ledger JSON.
- `reports/exports/issues.csv`: issue handoff table.
- `reports/exports/evidence.csv`: evidence handoff table.
- `reports/exports/payments.csv`: payment schedule export.
- `reports/exports/cap-table.csv`: cap table export.
- `reports/exports/dataroom-summary.xlsx`: multi-sheet workbook.
- `reports/compare/`: run comparison reports.
- `public/demo-artifacts/`: stable portfolio artifacts for the deployed gallery.

## Limitations

- Mock mode is illustrative and deterministic. It is not live document-specific analysis.
- AI mode requires an OpenAI-compatible provider and can still produce incorrect output.
- Synth does not replace review by a qualified lawyer, accountant, compliance professional, or diligence analyst.
- PDF generation requires Playwright Chromium.
- PDF parsing supports text-based PDFs, not scanned image-only PDFs.
- Spreadsheet parsing targets standard CSV/XLSX tables, not complex workbooks with pivots, merged cells, or macros.

## Screenshots Needed

- `/demo`: issue log and evidence ledger visible together.
- `/artifacts`: artifact cards for issue log, evidence ledger, CSV, XLSX, PDF, and compare report.
- `/dashboard`: local report dashboard after running the CLI workflow.
- Terminal: `npm run eval` showing 98/98 checks passed.
- Finder or editor: `reports/exports/` showing CSV files and `dataroom-summary.xlsx`.

## Best Portfolio Framing

Synth is evidence-backed AI diligence for mixed legal and financial document packets. It turns local contracts and spreadsheets into structured reports, a traceable issue log, an evidence ledger, CSV/XLSX exports, and run comparison without requiring cloud storage or a chat-only workflow.
