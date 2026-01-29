import { DateEx } from '@epdoc/datetime';

export interface PDFMetadata {
  creationDate?: Date;
  modificationDate?: Date;
  title?: string;
  author?: string;
  producer?: string;
  creator?: string;
}

export class PDFMetadataReader {
  // static #INFO_REGEX = /\/Info\s+(\d+\s+\d+\s+R)/;
  // static #OBJ_REGEX = /^(\d+)\s+(\d+)\s+obj$/;
  // static #DATE_REGEX = /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/;
  static #TRAILER_REGEX = /trailer\s*<<([^>]*)>>/is;
  static #XREF_TABLE_REGEX = /xref(?:\r?\n|\r)(\d+)\s+(\d+)([\s\S]*?)trailer/;

  /**
   * Extract metadata from a PDF file
   */
  static async extractMetadata(filePath: string): Promise<PDFMetadata> {
    const data = await Deno.readFile(filePath);
    return this.extractMetadataFromBuffer(data);
  }

  /**
   * Extract metadata from a PDF buffer
   */
  static extractMetadataFromBuffer(data: Uint8Array): PDFMetadata {
    const text = new TextDecoder().decode(data);

    // Try to find Info dictionary reference in trailer
    const infoRef = this.#findInfoReference(text);
    if (!infoRef) {
      throw new Error('Could not find Info dictionary reference in PDF');
    }

    // Extract the Info dictionary content
    const infoDict = this.#extractInfoDictionary(text, infoRef, data);
    return this.#parseInfoDictionary(infoDict);
  }

  static #findInfoReference(text: string): string | null {
    // Look for /Info in trailer first
    const trailerMatch = text.match(this.#TRAILER_REGEX);
    if (trailerMatch) {
      const trailerContent = trailerMatch[1];
      const infoMatch = trailerContent.match(/\/Info\s+(\d+\s+\d+\s+R)/);
      if (infoMatch) return infoMatch[1];
    }

    // Fallback: search for /Info in the entire document
    const globalInfoMatch = text.match(/\/Info\s+(\d+\s+\d+\s+R)/);
    return globalInfoMatch ? globalInfoMatch[1] : null;
  }

  static #extractInfoDictionary(
    text: string,
    infoRef: string,
    data: Uint8Array,
  ): string {
    // Parse object number and generation
    const refMatch = infoRef.match(/(\d+)\s+(\d+)\s+R/);
    if (!refMatch) throw new Error('Invalid Info reference format');

    const objectNum = parseInt(refMatch[1]);
    const generation = parseInt(refMatch[2]);

    // Method 1: Try direct object extraction
    const directObj = this.#extractDirectObject(text, objectNum, generation);
    if (directObj) return directObj;

    // Method 2: Try cross-reference table lookup
    const xrefObj = this.#extractObjectViaXRef(text, data, objectNum, generation);
    if (xrefObj) return xrefObj;

    throw new Error(`Could not locate Info dictionary object ${objectNum} ${generation} obj`);
  }

  static #extractDirectObject(
    text: string,
    objectNum: number,
    generation: number,
  ): string | null {
    const objPattern = new RegExp(
      `^${objectNum}\\s+${generation}\\s+obj\\s*([\\s\\S]*?)\\s*endobj`,
      'm',
    );

    const match = text.match(objPattern);
    if (!match) return null;

    return match[1].trim();
  }

  static #extractObjectViaXRef(
    text: string,
    data: Uint8Array,
    objectNum: number,
    generation: number,
  ): string | null {
    const xrefMatch = text.match(this.#XREF_TABLE_REGEX);
    if (!xrefMatch) return null;

    const startObj = parseInt(xrefMatch[1]);
    const numEntries = parseInt(xrefMatch[2]);
    const xrefContent = xrefMatch[3];

    if (objectNum < startObj || objectNum >= startObj + numEntries) {
      return null;
    }

    // Parse xref entries to find byte offset
    const xrefEntries = xrefContent.split('\n');
    const entryIndex = objectNum - startObj;
    if (entryIndex >= xrefEntries.length) return null;

    const entry = xrefEntries[entryIndex].trim();
    if (!entry) return null;

    const parts = entry.split(' ');
    if (parts.length < 2) return null;

    const byteOffset = parseInt(parts[0]);
    const entryGeneration = parseInt(parts[1]);

    if (entryGeneration !== generation) return null;

    // Extract object from byte offset
    const objectText = new TextDecoder().decode(
      data.slice(byteOffset, byteOffset + 1000), // Reasonable limit
    );

    const objMatch = objectText.match(
      /^(\d+\s+\d+\s+obj\s*)([\s\S]*?)(\s*endobj)/,
    );

    return objMatch ? objMatch[2].trim() : null;
  }

  static #parseInfoDictionary(infoDict: string): PDFMetadata {
    const metadata: PDFMetadata = {};

    // Extract dates
    const creationDateMatch = infoDict.match(/\/CreationDate\s*\(([^)]+)\)/);
    const modDateMatch = infoDict.match(/\/ModDate\s*\(([^)]+)\)/);

    if (creationDateMatch) {
      metadata.creationDate = this.#parsePDFDate(creationDateMatch[1]);
    }
    if (modDateMatch) {
      metadata.modificationDate = this.#parsePDFDate(modDateMatch[1]);
    }

    // Extract other common metadata
    const titleMatch = infoDict.match(/\/Title\s*\(([^)]+)\)/);
    const authorMatch = infoDict.match(/\/Author\s*\(([^)]+)\)/);
    const producerMatch = infoDict.match(/\/Producer\s*\(([^)]+)\)/);
    const creatorMatch = infoDict.match(/\/Creator\s*\(([^)]+)\)/);

    if (titleMatch) metadata.title = this.#unescapePDFString(titleMatch[1]);
    if (authorMatch) metadata.author = this.#unescapePDFString(authorMatch[1]);
    if (producerMatch) metadata.producer = this.#unescapePDFString(producerMatch[1]);
    if (creatorMatch) metadata.creator = this.#unescapePDFString(creatorMatch[1]);

    return metadata;
  }

  static #parsePDFDate(dateStr: string): Date | undefined {
    // Use DateEx from @epdoc/datetime for PDF date parsing
    try {
      return DateEx.fromPdfDate(dateStr)?.date;
    } catch {
      return undefined;
    }
  }

  static #unescapePDFString(str: string): string {
    return str
      .replace(/\\(\d{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\([()\\])/g, '$1');
  }
}
