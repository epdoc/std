# Webstream API

The Webstream API provides an efficient and standardized way to handle streams of data, enabling web applications to process data incrementally. It is particularly useful for large data transfers, real-time data processing, and network requests where data can be consumed or produced in chunks.

## ReadableStream

A `ReadableStream` represents a source of data, which can be read asynchronously. This allows data to be consumed piece by piece, without waiting for the entire data source to be available.

## WritableStream

A `WritableStream` represents a destination for data, which can be written to asynchronously. This allows data to be written piece by piece, without having to stage the entire data in memory.

## TransformStream

A `TransformStream` consists of a pair of streams: a `WritableStream` and a `ReadableStream`. Data written to the writable side is transformed and then made available to be read from the readable side. This is useful for operations like compression, decompression, or encryption.

## Usage Example

Here's a simple example demonstrating how to create a `ReadableStream` and pipe it through a `TransformStream` to a `WritableStream`.

```typescript
// Create a ReadableStream
const readableStream = new ReadableStream({
  start(controller) {
    controller.enqueue("Hello");
    controller.enqueue(" ");
    controller.enqueue("World");
    controller.close();
  },
});

// Create a TransformStream to convert text to uppercase
const transformStream = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(chunk.toUpperCase());
  },
});

// Create a WritableStream to log the output
const writableStream = new WritableStream({
  write(chunk) {
    console.log(chunk);
  },
});

// Pipe the streams together
readableStream
  .pipeThrough(transformStream)
  .pipeTo(writableStream)
  .then(() => console.log("Stream finished."));
```

## Why use Webstream API?

- **Efficiency**: Process large amounts of data without loading it all into memory at once.
- **Responsiveness**: Maintain a responsive user interface by processing data in chunks.
- **Interoperability**: Standardized API for handling data streams across different web platforms and services.
- **Flexibility**: Easily compose and transform streams to fit various data processing needs.

## Further Reading

- [MDN Web Docs: Web Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Streams_API)
- [MDN Web Docs: ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [MDN Web Docs: WritableStream](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream)
- [MDN Web Docs: TransformStream](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream)

## Proposal: Web Stream Integration in FileSpec

To enhance the `FileSpec` class and align it with modern asynchronous data handling, we propose integrating the Web Streams API for file reading and writing operations. This will provide a more efficient and flexible way to manage file I/O, especially for large files.

### Reading with `readableStream()`

We propose adding a `readableStream()` method to `FileSpec` that returns a `ReadableStream<Uint8Array>`. This will allow consumers to read file content incrementally, which is highly memory-efficient.

**Proposed Implementation:**
```typescript
// In FileSpec class
public async readableStream(): Promise<ReadableStream<Uint8Array>> {
  const file = await Deno.open(this.path, { read: true });
  return file.readable;
}
```

### Writing with `writableStream()`

Similarly, we propose a `writableStream()` method that returns a `WritableStream<Uint8Array>`. This will enable writing data to a file in a streaming fashion, for instance, directly from a network response.

**Proposed Implementation:**
```typescript
// In FileSpec class
public async writableStream(): Promise<WritableStream<Uint8Array>> {
  const file = await Deno.open(this.path, { write: true, create: true });
  return file.writable;
}
```

### API Refinements and Usage Patterns

While `readableStream()` and `writableStream()` are the core components, we can introduce higher-level helper methods to improve the API's ergonomics for common use cases.

#### Consuming Streams

There are two primary ways to consume a `ReadableStream`:

1.  **Piping (`.pipeTo()`):** This is the simplest method, where the entire stream is piped to a `WritableStream`. The API handles backpressure and closing automatically.

    ```typescript
    const readable = await myFile.readableStream();
    await readable.pipeTo(Deno.stdout.writable);
    ```

2.  **Using a Reader (`for await...of`):** For more granular control, you can iterate over the stream chunks.

    ```typescript
    const readable = await myFile.readableStream();
    for await (const chunk of readable) {
      console.log(`Received ${chunk.length} bytes`);
    }
    ```

#### Proposed Helper Methods

To make the API even more convenient, we can add the following helper methods to the `FileSpec` class.

**`pipeFrom(source: ReadableStream<Uint8Array>): Promise<void>`**

This method would simplify writing from an existing `ReadableStream` to the file.

```typescript
// Proposed method in FileSpec
public async pipeFrom(source: ReadableStream<Uint8Array>): Promise<void> {
  const destination = await this.writableStream();
  await source.pipeTo(destination);
}

// Usage
const response = await fetch("https://example.com/data.bin");
if (response.body) {
  const fileSpec = new FileSpec("data.bin");
  await fileSpec.pipeFrom(response.body);
}
```

**`pipeTo(destination: WritableStream<Uint8Array>): Promise<void>`**

This method would simplify reading from the file and piping to a `WritableStream`.

```typescript
// Proposed method in FileSpec
public async pipeTo(destination: WritableStream<Uint8Array>): Promise<void> {
  const source = await this.readableStream();
  await source.pipeTo(destination);
}

// Usage
const fileSpec = new FileSpec("data.bin");
await fileSpec.pipeTo(Deno.stdout.writable);
```

### Benefits of Integration

- **Memory Efficiency**: By streaming data, we avoid loading entire files into memory, which is crucial for large file processing.
- **Composability**: Web Streams are highly composable, allowing `FileSpec` streams to be piped to or from other streams, such as those from `fetch` requests or other data sources.
- **Backpressure Handling**: The Web Streams API automatically handles backpressure, ensuring that a fast-producing stream does not overwhelm a slow-consuming stream.

### Example Usage

**Example 1: Piping a network download directly to a file**
```typescript
const url = "https://example.com/large-file.zip";
const fileSpec = new FileSpec("./downloaded-file.zip");

const response = await fetch(url);
if (response.body) {
  const fileStream = await fileSpec.writableStream();
  await response.body.pipeTo(fileStream);
}
```

**Example 2: Reading a file and piping it to standard output**
```typescript
const fileSpec = new FileSpec("./my-large-log-file.log");
const fileStream = await fileSpec.readableStream();
await fileStream.pipeTo(Deno.stdout.writable);
```