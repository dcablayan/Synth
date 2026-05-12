Generate an executive memo PDF for the most recently analyzed document.

Steps:
1. Check that reports/reviews/ has at least one review JSON. If not, tell the user to run /synth first.
2. Run `npm run memo` to generate the memo.
3. Run `npm run pdf` to generate the PDF.
4. Read the latest memo markdown from reports/memos/ and display it inline: executive summary, biggest risks, questions for a lawyer, action items.
5. Report the full path to the generated memo PDF.

Always include this disclaimer:
"⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions."
