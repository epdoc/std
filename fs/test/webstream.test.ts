import { FileSpec, FolderSpec } from '../src/mod.ts';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import { Readable } from 'node:stream';
import type { Buffer } from 'node:buffer';
import { TextDecoder, TextEncoder } from 'node:util'; // Using node:util for TextEncoder/Decoder

describe('FileSpec Web Stream API', () => {
  let testDir: FolderSpec;
  let testFile: FileSpec;

  beforeAll(async () => {
    testDir = await FolderSpec.makeTemp({ prefix: 'webstream_test_' });
    testFile = new FileSpec(testDir, 'stream_test.txt');
  });

  afterAll(async () => {
    await testDir.remove({ recursive: true });
  });

  describe('readableStream()', () => {
    it('should return a ReadableStream that reads file content', async () => {
      const content = 'Hello, Web Streams!';
      await testFile.write(content);

      const readable = await testFile.readableStream();
      const reader = readable.getReader();
      let receivedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedContent += new TextDecoder().decode(value);
      }

      expect(receivedContent).toBe(content);
    });
  });

  describe('writableStream()', () => {
    it('should return a WritableStream that writes to the file', async () => {
      const content = 'Writing with WritableStream.';
      const writable = await testFile.writableStream();
      const writer = writable.getWriter();

      await writer.write(new TextEncoder().encode(content));
      await writer.close();

      const fileContent = await testFile.readAsString();
      expect(fileContent).toBe(content);
    });
  });

  describe('nodeReadableStream()', () => {
    it('should return a Node.js Readable stream that reads file content', async () => {
      const content = 'Hello, Node Streams!';
      await testFile.write(content);

      const nodeStream = await testFile.nodeReadableStream();
      let receivedContent = '';

      await new Promise<void>((resolve, reject) => {
        nodeStream.on('data', (chunk: Buffer) => {
          receivedContent += chunk.toString();
        });
        nodeStream.on('end', () => resolve());
        nodeStream.on('error', reject);
      });

      expect(receivedContent).toBe(content);
    });
  });

  describe('nodeWritableStream()', () => {
    it('should return a Node.js Writable stream that writes to the file', async () => {
      const content = 'Writing with Node.js Writable stream.';
      const nodeStream = await testFile.nodeWritableStream();

      await new Promise<void>((resolve, reject) => {
        nodeStream.write(content, (err) => {
          if (err) reject(err);
          else {
            nodeStream.end(() => resolve());
          }
        });
      });

      const fileContent = await testFile.readAsString();
      expect(fileContent).toBe(content);
    });

    it('should work with pipe from Node.js Readable', async () => {
      const content = 'Piping from Node.js Readable to file.';
      const readable = Readable.from([content]);
      const writable = await testFile.nodeWritableStream();

      await new Promise<void>((resolve, reject) => {
        readable.pipe(writable);
        writable.on('finish', () => resolve());
        writable.on('error', reject);
      });

      const fileContent = await testFile.readAsString();
      expect(fileContent).toBe(content);
    });
  });

  describe('pipeFrom()', () => {
    it('should pipe content from a ReadableStream to the file', async () => {
      const content = 'Piping from a source stream.';
      const sourceStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(content));
          controller.close();
        },
      });

      await testFile.pipeFrom(sourceStream);

      const fileContent = await testFile.readAsString();
      expect(fileContent).toBe(content);
    });
  });

  describe('pipeTo()', () => {
    it('should pipe file content to a WritableStream', async () => {
      const content = 'Piping to a destination stream.';
      await testFile.write(content);

      let receivedContent = '';
      const destinationStream = new WritableStream<Uint8Array>({
        write(chunk) {
          receivedContent += new TextDecoder().decode(chunk);
        },
      });

      await testFile.pipeTo(destinationStream);

      expect(receivedContent).toBe(content);
    });
  });

  describe('writer() and FileSpecWriter', () => {
    it('should write content using FileSpecWriter', async () => {
      const writer = await testFile.writer();
      await writer.write('First line.');
      await writer.writeLine('Second line.');
      await writer.close();

      const fileContent = await testFile.readAsString();
      expect(fileContent).toBe('First line.Second line.\n');
    });
  });
});
