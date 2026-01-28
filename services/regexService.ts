
import { ROLE_KEYWORDS } from '../constants';

export interface DetectedUrls {
  github?: string;
  linkedin?: string;
}

export function detectParticulars(text: string, foundLinks: string[] = []): DetectedUrls {
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9-._]+(?:\/[a-zA-Z0-9-._]+)?/gi;
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-\%\_]+(?:\/)?/gi;

  let github = foundLinks.find(l => githubRegex.test(l));
  let linkedin = foundLinks.find(l => linkedinRegex.test(l));

  githubRegex.lastIndex = 0;
  linkedinRegex.lastIndex = 0;

  if (!github) {
    const ghMatches = text.match(githubRegex);
    if (ghMatches) github = ghMatches[0];
  }
  if (!linkedin) {
    const liMatches = text.match(linkedinRegex);
    if (liMatches) linkedin = liMatches[0];
  }

  const formatUrl = (url: string | undefined) => {
    if (!url) return undefined;
    let clean = url.trim();
    if (!clean.startsWith('http')) {
      clean = `https://${clean}`;
    }
    clean = clean.replace(/[.,;]$/, '');
    return clean;
  };

  return {
    github: formatUrl(github),
    linkedin: formatUrl(linkedin),
  };
}

export function extractGithubUsername(url: string): string | null {
  if (!url) return null;
  const match = url.match(/github\.com\/([a-zA-Z0-9-._]+)/i);
  return match ? match[1] : null;
}

export function extractRecentJobTitle(text: string): string | null {
  const lowerText = text.toLowerCase();
  const sectionPatterns = [
    /professional experience/i,
    /work experience/i,
    /employment history/i,
    /career history/i,
    /experience/i,
    /work history/i
  ];

  let startIndex = 0;
  for (const pat of sectionPatterns) {
    const match = lowerText.match(pat);
    if (match && match.index !== undefined) {
      startIndex = match.index;
      break;
    }
  }

  // Scan the text immediately following the section header
  const relevantText = text.slice(startIndex, startIndex + 1500); 
  const lines = relevantText.split('\n').map(l => l.trim()).filter(l => l.length > 3);

  const titlePatterns = [
    // Pattern: "Job Title | Company" or "Job Title - Company"
    /^([A-Z][a-zA-Z\s]{3,})\s*[\-|\||@]\s*.+$/m,
    // Pattern: "Job Title at Company"
    /^([A-Z][a-zA-Z\s]{3,})\s+at\s+.+$/im,
    // Pattern: Keywords for titles often appearing on their own line
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*(?:Engineer|Manager|Scientist|Developer|Analyst|Designer|Director|Lead|Specialist|Architect))\b/m,
    // Catch-all for capitalized words that look like a title
    /^[A-Z][a-zA-Z\s]{5,25}$/m
  ];

  for (const line of lines.slice(0, 15)) {
    // Skip if line looks like dates (e.g. "2020 - 2022")
    if (/\d{4}/.test(line) && line.length < 25) continue;
    
    for (const regex of titlePatterns) {
      const match = line.match(regex);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length > 3 && title.length < 50) return title;
      }
    }
  }

  return null;
}

export function inferTargetRole(rawTitle: string | null, fullText: string): string {
  const scores: Record<string, number> = {};
  const lowerText = fullText.toLowerCase();
  const lowerTitle = rawTitle?.toLowerCase() || "";

  for (const [targetRole, keywords] of Object.entries(ROLE_KEYWORDS)) {
    // Keywords in the title get 5x weight
    const titleWeight = keywords.reduce((count, kw) => {
      return count + (lowerTitle.includes(kw.toLowerCase()) ? 5 : 0);
    }, 0);

    // Keywords in the text get 1x weight
    const textWeight = keywords.reduce((count, kw) => {
      const matches = lowerText.match(new RegExp(`\\b${kw}\\b`, 'g'));
      return count + (matches ? matches.length : 0);
    }, 0);

    scores[targetRole] = titleWeight + textWeight;
  }

  const sortedRoles = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const winner = sortedRoles[0];

  // If the top score is significantly low, default to General
  if (!winner || winner[1] < 2) {
    return "General Autonomy Check";
  }

  return winner[0];
}
