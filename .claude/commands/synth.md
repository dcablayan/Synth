Run the full Synth contract review pipeline on documents in /documents/inbox and produce a revised contract PDF.

Steps:
1. Run `npm run doctor` to check the system is ready. If it fails on required items, stop and report what's missing.
2. Check what documents are in `documents/inbox/`. List them for the user.
3. Run `npm run packet` to execute the full pipeline: analyze → memo → revise → pdf.
4. After it completes, list all generated PDFs in `reports/pdfs/`.
5. Read the latest revision markdown from `reports/revisions/` and display the revision summary and top priority changes inline so the user can read them without opening a file.
6. Tell the user exactly which PDF contains the revision packet and its full path.

Always include this disclaimer in your response:
"⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions."

If the user passes a specific filename as an argument (e.g. /synth my-contract.txt), copy that file into documents/inbox/ first if it isn't already there, then run the pipeline.
