/**
 * Tests a pattern against a text.
 *
 * - If the pattern looks like a regex literal (/pattern/flags), it is compiled and tested.
 * - Otherwise, the pattern is split into words and the text must contain ALL of them
 *   (case-insensitive, any order). This allows "Helvetia Invest" to match
 *   "Helvetia BVG Invest Sammelstiftung" even though the words are not adjacent.
 */
export function matchPattern(pattern: string, text: string): boolean {
  const regexLiteral = /^\/(.+)\/([gimsuy]*)$/
  const m = pattern.match(regexLiteral)
  if (m) {
    try {
      const re = new RegExp(m[1], m[2] || 'i')
      return re.test(text)
    } catch {
      return false
    }
  }
  const lower = text.toLowerCase()
  return pattern
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .every(w => lower.includes(w.toLowerCase()))
}

function patternSpecificity(pattern: string): number {
  const wordCount = pattern.trim().split(/\s+/).filter(Boolean).length
  return wordCount * 1000 + pattern.length
}

/**
 * Returns the name of the category whose most specific pattern matches the given description.
 * Specificity = number of words (primary) + total length (tiebreaker).
 * Falls back to matching the category name itself as a substring if no pattern matched.
 */
export function detectCategory(
  description: string,
  categories: Array<{ name: string; patterns: string[] }>,
): string | null {
  let best: { name: string; specificity: number } | null = null

  for (const cat of categories) {
    for (const pattern of cat.patterns) {
      const specificity = patternSpecificity(pattern)
      if (matchPattern(pattern, description) && specificity > (best?.specificity ?? -1)) {
        best = { name: cat.name, specificity }
      }
    }
  }
  if (best) return best.name

  for (const cat of categories) {
    if (matchPattern(cat.name, description)) return cat.name
  }
  return null
}
