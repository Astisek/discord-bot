export class SGError extends Error {
  constructor(message: string) {
    super(message);
    this.message = `:x: **${message}**`;
  }
}
