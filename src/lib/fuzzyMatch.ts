// Levenshtein distance algorithm for fuzzy name matching
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  if (aLower.length === 0) return bLower.length;
  if (bLower.length === 0) return aLower.length;

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bLower.length][aLower.length];
}

export function similarityScore(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

export interface SanctionMatch {
  sanctionedName: string;
  inputName: string;
  similarity: number;
  isMatch: boolean;
}

// Check name against sanctions list with fuzzy matching
export function checkAgainstSanctions(
  name: string,
  sanctionsList: string[],
  threshold: number = 0.85
): SanctionMatch | null {
  let bestMatch: SanctionMatch | null = null;
  let highestSimilarity = 0;

  for (const sanctionedName of sanctionsList) {
    const similarity = similarityScore(name, sanctionedName);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = {
        sanctionedName,
        inputName: name,
        similarity,
        isMatch: similarity >= threshold,
      };
    }
  }

  return bestMatch;
}

// Check multiple names against sanctions list
export function checkNamesAgainstSanctions(
  names: string[],
  sanctionsList: string[],
  threshold: number = 0.85
): SanctionMatch[] {
  const matches: SanctionMatch[] = [];

  for (const name of names) {
    const match = checkAgainstSanctions(name, sanctionsList, threshold);
    if (match && match.isMatch) {
      matches.push(match);
    }
  }

  return matches;
}
