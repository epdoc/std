import { type IError, isError } from '@epdoc/type';

export interface FSErrorOptions {
  cause?: string;
  code?: string | number;
  path?: string;
}

export class FSError extends Error implements IError {
  code: string | number | undefined;
  path: string | undefined;

  constructor(err: string | Error | unknown, opts: FSErrorOptions = {}) {
    // Normalize message
    const message = isError(err) ? (err.message as string) : String(err ?? '');

    // Pass ErrorOptions compatible shape (keep `.cause` for Node)
    // Note: we intentionally do not rely on runtime-specific globals.
    // The opts.cause is preserved in FSErrorOptions and also forwarded to Error when supported.
    super(message, { cause: opts.cause });

    // Narrow type for platform errors that may include a code
    type ErrWithCode = { code?: string | number; errno?: number | string; message?: string };
    const maybe = err as ErrWithCode;

    if (maybe && (maybe.code !== undefined || maybe.errno !== undefined)) {
      this.code = typeof maybe.code === 'string' || typeof maybe.code === 'number'
        ? maybe.code
        : (maybe.errno !== undefined ? String(maybe.errno) : undefined);
    }

    if (opts.code !== undefined) this.code = opts.code;
    this.path = opts.path;

    // maintain proper name for instanceof checks
    this.name = this.constructor.name;
  }
}

/**
 * Raised when the underlying operating system indicates that the file
 * was not found.
 *
 * @category Errors */
export class NotFound extends FSError {}
/**
 * Raised when the underlying operating system indicates the current user
 * which the Deno process is running under does not have the appropriate
 * permissions to a file or resource.
 *
 * Before Deno 2.0, this error was raised when the user _did not_ provide
 * required `--allow-*` flag. As of Deno 2.0, that case is now handled by
 * the {@link NotCapable} error.
 *
 * @category Errors */
export class PermissionDenied extends FSError {}
/**
 * Raised when the underlying operating system reports that a connection to
 * a resource is refused.
 *
 * @category Errors */
export class ConnectionRefused extends FSError {}
/**
 * Raised when the underlying operating system reports that a connection has
 * been reset. With network servers, it can be a _normal_ occurrence where a
 * client will abort a connection instead of properly shutting it down.
 *
 * @category Errors */
export class ConnectionReset extends FSError {}
/**
 * Raised when the underlying operating system reports an `ECONNABORTED`
 * error.
 *
 * @category Errors */
export class ConnectionAborted extends FSError {}
/**
 * Raised when the underlying operating system reports an `ENOTCONN` error.
 *
 * @category Errors */
export class NotConnected extends FSError {}
/**
 * Raised when attempting to open a server listener on an address and port
 * that already has a listener.
 *
 * @category Errors */
export class AddrInUse extends FSError {}
/**
 * Raised when the underlying operating system reports an `EADDRNOTAVAIL`
 * error.
 *
 * @category Errors */
export class AddrNotAvailable extends FSError {}
/**
 * Raised when trying to write to a resource and a broken pipe error occurs.
 * This can happen when trying to write directly to `stdout` or `stderr`
 * and the operating system is unable to pipe the output for a reason
 * external to the Deno runtime.
 *
 * @category Errors */
export class BrokenPipe extends FSError {}
/**
 * Raised when trying to create a resource, like a file, that already
 * exits.
 *
 * @category Errors */
export class AlreadyExists extends FSError {}
/**
 * Raised when an operation returns data that is invalid for the
 * operation being performed.
 *
 * @category Errors */
export class InvalidData extends FSError {}
/**
 * Raised when the underlying operating system reports that an I/O operation
 * has timed out (`ETIMEDOUT`).
 *
 * @category Errors */
export class TimedOut extends FSError {}
/**
 * Raised when the underlying operating system reports an `EINTR` error. In
 * many cases, this underlying IO error will be handled internally within
 * Deno, or result in an {@link BadResource} error instead.
 *
 * @category Errors */
export class Interrupted extends FSError {}
/**
 * Raised when the underlying operating system would need to block to
 * complete but an asynchronous (non-blocking) API is used.
 *
 * @category Errors */
export class WouldBlock extends FSError {}
/**
 * Raised when expecting to write to a IO buffer resulted in zero bytes
 * being written.
 *
 * @category Errors */
export class WriteZero extends FSError {}
/**
 * Raised when attempting to read bytes from a resource, but the EOF was
 * unexpectedly encountered.
 *
 * @category Errors */
export class UnexpectedEof extends FSError {}
/**
 * The underlying IO resource is invalid or closed, and so the operation
 * could not be performed.
 *
 * @category Errors */
export class BadResource extends FSError {}
/**
 * Raised in situations where when attempting to load a dynamic import,
 * too many redirects were encountered.
 *
 * @category Errors */
export class Http extends FSError {}
/**
 * Raised when the underlying IO resource is not available because it is
 * being awaited on in another block of code.
 *
 * @category Errors */
export class Busy extends FSError {}
/**
 * Raised when the underlying Deno API is asked to perform a function that
 * is not currently supported.
 *
 * @category Errors */
export class NotSupported extends FSError {}
/**
 * Raised when too many symbolic links were encountered when resolving the
 * filename.
 *
 * @category Errors */
export class FilesystemLoop extends FSError {}
/**
 * Raised when trying to open, create or write to a directory.
 *
 * @category Errors */
export class IsADirectory extends FSError {}
/**
 * Raised when performing a socket operation but the remote host is
 * not reachable.
 *
 * @category Errors */
export class NetworkUnreachable extends FSError {}
/**
 * Raised when trying to perform an operation on a path that is not a
 * directory, when directory is required.
 *
 * @category Errors */
export class NotADirectory extends FSError {}

/**
 * Raised when trying to perform an operation while the relevant Deno
 * permission (like `--allow-read`) has not been granted.
 *
 * Before Deno 2.0, this condition was covered by the {@link PermissionDenied}
 * error.
 *
 * @category Errors */
export class NotCapable extends FSError {}
