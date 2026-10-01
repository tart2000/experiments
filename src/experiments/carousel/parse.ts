/**
 * Coupe le texte en slides sur chaque séparateur `---` (où qu'il soit : seul sur sa ligne ou non).
 * Nombre de slides = nombre de séparateurs + 1. Les retours à la ligne dans un bloc sont conservés.
 */
export function splitSlides(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/-{3,}/)
    .map((b) => b.replace(/^\s*\n/, '').replace(/\s+$/, '').replace(/^[ \t]+/, ''))
}
