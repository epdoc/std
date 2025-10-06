import type { Integer, StripJsonCommentsOpts } from './types.ts';

// Use readonly for constant regex to prevent reassignment
const REG = {
  allWhitespace: new RegExp(/[^ \t\r\n]/, 'g') as Readonly<RegExp>,
};

// Use a type alias for the different comment states to improve clarity
type CommentState = 'single' | 'multi' | false;

// Create a function that determines the strip function to use
const getStripper = (whitespace: boolean) =>
  whitespace
    ? (s: string, start: Integer, end?: Integer) => s.slice(start, end).replace(REG.allWhitespace, ' ')
    : () => '';

const isEscaped = (jsonString: string, quotePosition: Integer): boolean => {
  let index = quotePosition - 1;
  let backslashCount = 0;

  while (jsonString[index] === '\\') {
    index -= 1;
    backslashCount += 1;
  }

  return backslashCount % 2 === 1;
};

/**
 * Removes comments from a JSON string.
 *
 * @param jsonString The JSON string to strip comments from.
 * @param options Options for stripping comments.
 * @returns The JSON string without comments.
 * @throws {TypeError} If the `jsonString` argument is not a string.
 */
export default function stripJsonComments(jsonString: string, options: StripJsonCommentsOpts = {}): string {
  if (typeof jsonString !== 'string') {
    throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof jsonString}\``);
  }

  const { whitespace = true, trailingCommas = false } = options;
  const strip = getStripper(whitespace);

  let isInsideString = false;
  let isInsideComment: CommentState = false;
  let offset = 0;
  let buffer = '';
  let result = '';
  let commaIndex = -1;

  for (let index = 0; index < jsonString.length; index++) {
    const currentCharacter = jsonString[index];
    const nextCharacter = jsonString[index + 1];

    if (!isInsideComment && currentCharacter === '"') {
      const escaped = isEscaped(jsonString, index);
      if (!escaped) {
        isInsideString = !isInsideString;
      }
    }

    if (isInsideString) {
      continue;
    }

    if (!isInsideComment && currentCharacter === '/' && nextCharacter === '/') {
      buffer += jsonString.slice(offset, index);
      offset = index;
      isInsideComment = 'single';
      index++;
    } else if (isInsideComment === 'single') {
      if (currentCharacter === '\n' || (currentCharacter === '\r' && nextCharacter === '\n')) {
        isInsideComment = false;
        buffer += strip(jsonString, offset, currentCharacter === '\r' ? index + 2 : index + 1);
        offset = currentCharacter === '\r' ? index + 2 : index + 1;
        if (currentCharacter === '\r') {
          index++;
        }
      }
    } else if (!isInsideComment && currentCharacter === '/' && nextCharacter === '*') {
      buffer += jsonString.slice(offset, index);
      offset = index;
      isInsideComment = 'multi';
      index++;
      continue;
    } else if (isInsideComment === 'multi' && currentCharacter === '*' && nextCharacter === '/') {
      isInsideComment = false;
      buffer += strip(jsonString, offset, index + 2);
      offset = index + 2;
      index++;
      continue;
    } else if (trailingCommas && !isInsideComment) {
      if (commaIndex !== -1) {
        if (currentCharacter === '}' || currentCharacter === ']') {
          buffer += jsonString.slice(offset, index);
          result += strip(buffer, 0, 1) + buffer.slice(1);
          buffer = '';
          offset = index;
          commaIndex = -1;
        } else if (/\S/.test(currentCharacter)) {
          buffer += jsonString.slice(offset, index);
          offset = index;
          commaIndex = -1;
        }
      } else if (currentCharacter === ',') {
        result += buffer + jsonString.slice(offset, index);
        buffer = '';
        offset = index;
        commaIndex = index;
      }
    }
  }

  const remaining = isInsideComment === 'single' ? strip(jsonString, offset) : jsonString.slice(offset);

  return result + buffer + remaining;
}
