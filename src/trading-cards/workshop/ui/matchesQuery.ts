/** Returns true if the section should be visible given the current search query. */
export function matchesSectionQuery(query: string, keywords: string): boolean {
  if (!query) return true;
  return keywords.toLowerCase().includes(query.toLowerCase());
}
