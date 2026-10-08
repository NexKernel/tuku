export const CONFIDENCE_OPTIONS = [
  { value: 1, label: "Poco" },
  { value: 2, label: "Más o menos" },
  { value: 3, label: "Muy seguro" },
];

export function appendText(current: string, addition: string): string {
  return current.trim() ? `${current.trimEnd()} ${addition}` : addition;
}
