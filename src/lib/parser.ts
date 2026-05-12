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
