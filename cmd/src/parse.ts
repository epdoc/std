export function parseLines(data: string): string[] {
  return data.split(/\r?\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
