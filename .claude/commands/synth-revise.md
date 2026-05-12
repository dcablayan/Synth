Generate a contract revision packet PDF for the most recently analyzed document.

Steps:
1. Check that reports/reviews/ has at least one review JSON. If not, tell the user to run /synth first.
2. Run `npm run revise` to generate the revision packet.
3. Run `npm run pdf` to generate the PDF.
4. Read the latest revision markdown from reports/revisions/ and display:
   - The revision summary
   - All priority changes (numbered list)
   - The first 3 clause revisions with: section name, issue, and suggested replacement language
5. Report the full path to the generated revision PDF.

Always include this disclaimer:
"⚠️ Suggested revisions are not legal advice. They are suggested replacement language for review by a qualified professional. Consult an attorney before using any suggested language."
