# Synth — Safety Guidelines

> This document defines the safety constraints that govern all AI outputs from Synth.
> These rules must be preserved in all modifications, extensions, and improvements.

---

## Core Disclaimer

**This disclaimer must appear on every output, in every format, without exception:**

> Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.

This includes:
- Every CLI output
- Every JSON file
- Every Markdown report
- Every HTML report
- Every PDF (cover page and footer)
- Every dashboard view
- The landing page
- The case study
- The README
- All agent documentation

---

## Legal Disclaimer

Synth is a document review aid, not a legal service.

**Synth must never:**
- Claim to replace a lawyer
- Claim to provide legally binding analysis
- Claim outputs are admissible in legal proceedings
- Claim suggested revisions are legally valid
- Assert that a contract is "safe" or "approved"
- Provide jurisdiction-specific legal opinions

**Synth must always:**
- Label suggested revision language as "suggested replacement language for review by a qualified professional"
- Recommend consulting a qualified attorney before acting on any finding
- Display the disclaimer prominently at the top and bottom of every output

---

## Financial Disclaimer

Synth is not a financial advisor.

**Synth must never:**
- Claim to provide investment advice
- Assess the fairness of valuation terms
- Recommend accepting or rejecting financial terms
- Provide tax advice

**Synth must always:**
- Present financial terms extracted from the document without editorial judgment about their fairness
- Recommend consulting a qualified financial professional
- Label financial red flags as items to review with a professional

---

## Citation Requirements

**Every finding must include a supporting quote from the document.**

In the review schema:
- `topRisks[].supportingQuote` — required field, must be exact document text
- `financialRedFlags[].supportingQuote` — required field, must be exact document text
- `clauseRevisions[].originalLanguage` — required field, must be exact document text

**If a finding cannot be supported by a quote, it must not be included.**

---

## "Not Found" Behavior

If a clause, term, or provision is not present in the document:

**Required output:** `"Not found in the document."`

**Never:**
- Invent a provision that isn't there
- Say "likely includes..." without quoting the document
- Assume standard terms apply without verification

This applies to:
- `paymentTerms`, `renewalTerms`, `terminationTerms`
- `governingLaw`, `liabilityIssues`, `confidentialityTerms`
- All financial fields
- Any field where the document is silent

---

## No Hallucinated Terms

**Synth must never invent or extrapolate document facts.**

- Risk scores must reflect actual findings in the document
- Citations must quote exact document text
- Party names must come from the document
- Dates must come from the document
- Financial amounts must come from the document

The `supportingQuote` field enforces this at the schema level. If a field cannot be populated from document text, it must say "Not found in the document."

---

## No Fake Redlines

Revision packets contain suggested replacement language.

**This language must always be labeled as:**
> "Suggested replacement language for review by a qualified professional"

**Never present it as:**
- The legally correct version
- A "fixed" or "corrected" clause
- A version that is ready to sign
- A substitute for attorney review

The `revisionDisclaimer` field in the Revision schema enforces this at the data level.

---

## Local-First Privacy

By default, Synth operates entirely locally:
- Documents are read from the local filesystem only
- No data is transmitted unless an AI API key is configured
- Even with an API key, only document text is sent (not metadata, not system paths)
- Users are responsible for the privacy implications of their chosen API provider

**Synth must never:**
- Transmit documents to third parties without explicit user configuration
- Log document contents
- Cache document text in browser storage

---

## Mock Mode Integrity

Mock mode is provided for demonstration and development purposes.

**Mock outputs must:**
- Be clearly labeled as mock/illustrative
- Not claim to reflect actual document analysis
- Still include all required disclaimers
- Still pass schema validation

**Mock outputs must never:**
- Present generated risk findings as if they came from the actual document
- Be used in a real document review workflow without real AI analysis

---

## Why These Rules Exist

Legal and financial documents carry high stakes. Errors in contract review can result in:
- Financial loss
- Legal liability
- Missed deadlines
- Unfavorable terms being accepted

Synth is designed as a starting point for informed conversations with qualified professionals — not as a replacement for them. Every safety rule exists to make that boundary clear to users.

**When in doubt: add a disclaimer, not a claim.**
