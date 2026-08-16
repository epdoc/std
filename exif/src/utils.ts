import { _ } from '@epdoc/type';

export function truncateLongStrings(data: unknown, maxLength = 256, previewLength = 64): unknown {
  if (_.isString(data)) {
    if (data.length > maxLength) {
      const preview = data.slice(0, previewLength);
      return `${preview}… (${data.length} bytes)`;
    }
    return data;
  }

  if (_.isArray(data)) {
    return data.map((item) => truncateLongStrings(item, maxLength, previewLength));
  }

  if (_.isObject(data)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = truncateLongStrings(value, maxLength, previewLength);
    }
    return result;
  }

  return data;
}

/**
 * Display label for a key. Defaults to a title-cased version of the camelCase
 * key (e.g. `createdAt` → `Created At`). Override via the `title` field on
 * the InfoDef.
 */
export function titleCase(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
