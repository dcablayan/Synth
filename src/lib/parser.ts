export type DocumentType =
  | 'SaaS Agreement'
  | 'Term Sheet'
  | 'Contractor Agreement'
  | 'Employment Agreement'
  | 'NDA'
  | 'Partnership Agreement'
  | 'Other';

const TYPE_SIGNALS: Array<{ type: DocumentType; patterns: RegExp[] }> = [
  {
    type: 'SaaS Agreement',
    patterns: [
      /saas|software.as.a.service|subscription agreement|cloud service/i,
      /software license|platform access|api access/i,
    ],
  },
  {
    type: 'Term Sheet',
    patterns: [
      /term sheet|series [a-d] preferred|venture financing|investment round/i,
      /liquidation preference|anti.dilution|cap table/i,
    ],
  },
  {
    type: 'Contractor Agreement',
    patterns: [
      /independent contractor|contractor agreement|freelance/i,
      /work for hire|statement of work|consulting agreement/i,
    ],
  },
  {
    type: 'Employment Agreement',
    patterns: [/employment agreement|offer letter|at.will employment/i, /base salary|employee benefits|stock options/i],
  },
  {
    type: 'NDA',
    patterns: [/non.disclosure|confidentiality agreement|nda/i, /proprietary information agreement/i],
  },
  {
    type: 'Partnership Agreement',
    patterns: [/partnership agreement|joint venture|revenue sharing agreement/i],
  },
];

export function detectDocumentType(text: string): DocumentType {
  for (const { type, patterns } of TYPE_SIGNALS) {
    const matches = patterns.filter((p) => p.test(text)).length;
    if (matches >= 1) return type;
  }
  return 'Other';
}

export function extractDocumentTitle(text: string, filename: string): string {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length > 5 && firstLine.length < 150) {
    return firstLine;
  }
  return filename.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');
}

export function extractParties(text: string): string[] {
  const parties: string[] = [];
  const patterns = [
    /between\s+([^,\n]+),\s*(?:a\s+\w+\s+\w+\s+)?(?:corporation|llc|inc|lp|company)[^,\n]*(?:,|and)\s+(?:and\s+)?([^,\n]+)/gi,
    /(?:the\s+)?"([^"]+)"\s*\("(?:Company|Provider|Customer|Investor|Contractor|Client)"\)/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches.slice(0, 4)) {
      if (match[1]) parties.push(match[1].trim());
      if (match[2]) parties.push(match[2].trim());
    }
  }

  return [...new Set(parties)].slice(0, 6);
}

export function chunkText(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Document truncated for analysis...]';
}

const NOT_FOUND = 'Not found in the document.';

function firstMatch(text: string, patterns: RegExp[], maxLen = 250): string {
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return m[0].replace(/\s+/g, ' ').trim().slice(0, maxLen);
  }
  return NOT_FOUND;
}

export function extractPaymentTerms(text: string): string {
  return firstMatch(text, [
    /\$[\d,]+(?:\.\d{2})?\s*(?:per|\/)\s*(?:month|year|annum|mo|yr)[^\n.]{0,120}/i,
    /(?:monthly|annual|quarterly)\s+(?:fee|payment|subscription|price)\s*(?:of|is|:)?\s*\$?[\d,]+[^\n.]{0,100}/i,
    /(?:subscription|service)\s+fee[^\n.]{0,120}/i,
    /payment\s+(?:terms?|schedule|due)[^\n.]{0,150}/i,
  ]);
}

export function extractRenewalTerms(text: string): string {
  return firstMatch(text, [
    /(?:automatically?\s+)?renews?\s+(?:for|unless|at\s+the\s+end)[^\n.]{0,200}/i,
    /auto.?renew[^\n.]{0,200}/i,
    /renewal\s+(?:term|notice|period)[^\n.]{0,200}/i,
    /(?:successive|additional)\s+(?:one.year|annual|monthly)\s+term[^\n.]{0,150}/i,
    /renewed\s+automatically[^\n.]{0,150}/i,
  ]);
}

export function extractTerminationTerms(text: string): string {
  return firstMatch(text, [
    /(?:either\s+party|party)\s+may\s+terminat[^\n.]{0,200}/i,
    /may\s+terminat[^\n.]{0,150}(?:written\s+)?notice[^\n.]{0,100}/i,
    /terminat(?:e|ion)\s+(?:for\s+cause|without\s+cause|upon)[^\n.]{0,200}/i,
    /\d+.day\s+(?:written\s+)?notice[^\n.]{0,150}/i,
    /terminat(?:e|ion)[^\n.]{0,200}/i,
  ]);
}

export function extractGoverningLaw(text: string): string {
  return firstMatch(text, [
    /(?:governed|construed)[^\n.]{0,80}laws?\s+of\s+(?:the\s+)?(?:State\s+of\s+)?[A-Z][a-zA-Z\s,]{2,40}/,
    /governing\s+law[^\n.]{0,200}/i,
    /applicable\s+law[^\n.]{0,150}/i,
    /laws?\s+of\s+(?:the\s+)?(?:State\s+of\s+)?[A-Z][a-zA-Z\s]{2,30}(?:shall\s+govern|apply)/i,
    /jurisdiction[^\n.]{0,150}/i,
  ]);
}

export function extractConfidentialityTerms(text: string): string {
  return firstMatch(text, [
    /(?:each\s+party|recipient)\s+(?:agrees?|shall)\s+(?:to\s+)?(?:keep|maintain|hold)[^\n.]{0,200}/i,
    /confidential\s+information[^\n.]{0,200}/i,
    /confidentiality\s+obligations?[^\n.]{0,200}/i,
    /non.?disclosure[^\n.]{0,200}/i,
    /proprietary\s+information[^\n.]{0,200}/i,
  ]);
}

export function extractLiabilityCap(text: string): string {
  return firstMatch(text, [
    /in\s+no\s+event\s+(?:shall|will)[^\n.]{0,200}/i,
    /aggregate\s+liability[^\n.]{0,200}/i,
    /(?:maximum|total)\s+(?:aggregate\s+)?liability[^\n.]{0,200}/i,
    /liability\s+(?:of\s+either\s+party|cap|limit)[^\n.]{0,200}/i,
    /(?:cap|limit)\s+(?:of|on)\s+(?:any\s+)?(?:aggregate\s+)?liability[^\n.]{0,200}/i,
  ]);
}

export function extractKeyDates(text: string): Array<{ label: string; date: string }> {
  const results: Array<{ label: string; date: string }> = [];
  const dateHints: Array<{ label: string; patterns: RegExp[] }> = [
    {
      label: 'Effective Date',
      patterns: [/effective\s+(?:as\s+of\s+|date\s*:?\s*)([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i],
    },
    {
      label: 'Renewal Notice Deadline',
      patterns: [/(?:cancellation|renewal)\s+notice[^\n.]{0,60}(\d+)\s+days?/i],
    },
    {
      label: 'Initial Term',
      patterns: [/initial\s+(?:term|period)\s*(?:of\s+)?(\d+\s+(?:month|year|mo|yr)s?)[^\n.]{0,60}/i],
    },
  ];

  for (const { label, patterns } of dateHints) {
    for (const p of patterns) {
      const m = p.exec(text);
      if (m) {
        results.push({ label, date: m[0].replace(/\s+/g, ' ').trim().slice(0, 120) });
        break;
      }
    }
  }

  if (results.length === 0) {
    results.push({ label: 'Effective Date', date: 'See document' });
    results.push({ label: 'Initial Term End', date: 'See document' });
  }
  return results;
}
