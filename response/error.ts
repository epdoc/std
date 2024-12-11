export interface ICodeErrorOptions extends ErrorOptions {
  code?: string;
}

export interface ICodeError extends Error {
  code?: string;
}
