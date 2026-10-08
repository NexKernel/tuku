/**
 * Tuku puede terminar un mensaje con una línea `OPCIONES: idea 1 | idea 2 | idea 3`
 * (ver el prompt del backend). Esa línea no se muestra ni se lee en voz alta:
 * se convierte en botones para que el niño elija tocando en vez de escribir.
 */
const OPTIONS_LINE = /^\s*\**\s*OPCIONES\s*:?\**\s*:?(.*)$/im;

export function splitOptions(content: string): { text: string; options: string[] } {
  const match = content.match(OPTIONS_LINE);
  if (!match) return { text: content, options: [] };
  const options = match[1]
    .split("|")
    .map((o) => o.replace(/[*_]/g, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  return { text: content.replace(match[0], "").trimEnd(), options };
}
