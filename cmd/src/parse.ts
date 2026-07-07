export function parseLines(data: string): string[] {
  return data.split(/\r?\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function parseTrimmed(data: string): string {
  return data.trim();
}

export function parseJson(data: string): Record<string, unknown> {
  return JSON.parse(data);
}
