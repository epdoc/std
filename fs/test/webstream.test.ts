import { FileSpec, FolderSpec } from '../src/mod.ts';
import { assertEquals } from '@std/assert';
import { Readable } from 'node:stream';
import type { Buffer } from 'node:buffer';
import { TextDecoder, TextEncoder } from 'node:util';

Deno.test('FileSpec Web Stream API', async (t) => {
  const testDir = await FolderSpec.makeTemp({ prefix: 'webstream_test_' });
  const testFile = new FileSpec(testDir, 'stream_test.txt');

  try {
    await t.step('readableStream() should return a ReadableStream that reads file content', async () => {
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

      assertEquals(receivedContent, content);
    });

    await t.step('writableStream() should return a WritableStream that writes to the file', async () => {
      const content = 'Writing with WritableStream.';
      const writable = await testFile.writableStream();
      const writer = writable.getWriter();

      await writer.write(new TextEncoder().encode(content));
      await writer.close();

      const fileContent = await testFile.readAsString();
      assertEquals(fileContent, content);
    });

    await t.step('nodeReadableStream() should return a Node.js Readable stream that reads file content', async () => {
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

      assertEquals(receivedContent, content);
    });

    await t.step('nodeWritableStream() should return a Node.js Writable stream that writes to the file', async () => {
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
      assertEquals(fileContent, content);
    });

    await t.step('nodeWritableStream() should work with pipe from Node.js Readable', async () => {
      const content = 'Piping from Node.js Readable to file.';
      const readable = Readable.from([content]);
      const writable = await testFile.nodeWritableStream();

      await new Promise<void>((resolve, reject) => {
        readable.pipe(writable);
        writable.on('finish', () => resolve());
        writable.on('error', reject);
      });

      const fileContent = await testFile.readAsString();
      assertEquals(fileContent, content);
    });

    await t.step('pipeFrom() should pipe content from a ReadableStream to the file', async () => {
      const content = 'Piping from a source stream.';
      const sourceStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(content));
          controller.close();
        },
      });

      await testFile.pipeFrom(sourceStream);

      const fileContent = await testFile.readAsString();
      assertEquals(fileContent, content);
    });

    await t.step('pipeTo() should pipe file content to a WritableStream', async () => {
      const content = 'Piping to a destination stream.';
      await testFile.write(content);

      let receivedContent = '';
      const destinationStream = new WritableStream<Uint8Array>({
        write(chunk) {
          receivedContent += new TextDecoder().decode(chunk);
        },
      });

      await testFile.pipeTo(destinationStream);

      assertEquals(receivedContent, content);
    });

    await t.step('writer() and FileSpecWriter should write content using FileSpecWriter', async () => {
      const writer = await testFile.writer();
      await writer.write('First line.');
      await writer.writeLine('Second line.');
      await writer.close();

      const fileContent = await testFile.readAsString();
      assertEquals(fileContent, 'First line.Second line.\n');
    });
  } finally {
    await testDir.remove({ recursive: true });
  }
});
