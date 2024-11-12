import * as msub from './msub.ts';

export function StringEx(str: unknown): StringUtil {
  return new StringUtil(str);
}

export class StringUtil {
  private _str: string;
  private _msub: msub.MSub | undefined;

  constructor(str: unknown) {
    this._str = String(str);
  }

  msubInit(opts: msub.InitOptions): msub.MSub {
    this._msub = msub.createMSub(opts);
    return this._msub;
  }

  msub(s: string, ...args: msub.Param[]): string {
    if (!this._msub) {
      this._msub = msub.createMSub();
    }
    return this._msub.replace(s, ...args);
  }

  /**
   * Returns the plural form of a word based on the given count. If the plural
   * form is not provided, it defaults to the singular form with an 's'
   * appended.
   * @param {string} singular - The singular form of the word.
   * @param {Integer} n - The count of items.
   * @param {string} [plural] - The plural form of the word (optional).
   * @returns {string} The plural form of the word.
   */
  pluralize(count: number, str?: string): string {
    if (count === 1) {
      return this._str;
    }
    return str ? str : this._str + 's';
  }

  /** LLM generated function to count and remove tabs at the beginning of a string */
  countLeadingTabs(): number {
    let count = 0;
    for (let i = 0; i < this._str.length; i++) {
      if (this._str[i] === '\t') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  rightPadAndTruncate(length: number, char = ' '): string {
    return this._str.length > length
      ? this._str.slice(0, length)
      : this._str + char.repeat(length - this._str.length);
  }

  hexEncode(): string {
    let result = '';
    for (let i = 0; i < this._str.length; i++) {
      const hex = this._str.charCodeAt(i).toString(16);
      result += ('000' + hex).slice(-4);
    }
    return result;
  }
}
