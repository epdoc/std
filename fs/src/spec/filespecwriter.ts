export class FileSpecWriter {
  private _writer: WritableStreamDefaultWriter<Uint8Array>;
  private _stream: WritableStream<Uint8Array>;
  private _encoder: TextEncoder;

  constructor(stream: WritableStream<Uint8Array>) {
    this._stream = stream;
    this._writer = stream.getWriter();
    this._encoder = new TextEncoder();
  }

  /**
   * Writes a chunk of data. Strings will be automatically encoded as UTF-8.
   */
  async write(data: string | Uint8Array): Promise<void> {
    const chunk = typeof data === 'string' ? this._encoder.encode(data) : data;
    await this._writer.write(chunk);
  }

  /**
   * Writes a line of text, automatically appending a newline character.
   */
  async writeLine(line: string): Promise<void> {
    await this.write(line + '\n');
  }

  /**
   * Closes the writer and the underlying file stream.
   */
  async close(): Promise<void> {
    this._writer.releaseLock();
    await this._stream.close();
  }
}
