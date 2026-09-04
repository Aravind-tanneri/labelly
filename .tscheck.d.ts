declare module "bcrypt" {
  export function hash(password: string, saltRounds: number): Promise<string>;
  export function compare(password: string, hash: string): Promise<boolean>;
}

declare module "jsonwebtoken" {
  export function sign(payload: object, secret: string, options?: Record<string, unknown>): string;
  export function verify(token: string, secret: string): unknown;
}

declare module "pdfkit" {
  class PDFDocument {
    y: number;
    constructor(options?: Record<string, unknown>);
    on(event: string, listener: (...args: unknown[]) => void): this;
    fillColor(color: string): this;
    fontSize(size: number): this;
    text(text: string, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
    rect(x: number, y: number, width: number, height: number): this;
    fill(): this;
    image(data: unknown, options?: Record<string, unknown>): this;
    end(): void;
  }
  export default PDFDocument;
}

declare module "fs" {
  export function existsSync(path: string): boolean;
}

declare module "fs/promises" {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function writeFile(path: string, data: unknown, options?: unknown): Promise<void>;
  export function readFile(path: string): Promise<Buffer>;
}

declare module "path" {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
  export function extname(path: string): string;
  export const sep: string;
}

declare var process: { env: Record<string, string | undefined> };

interface Buffer {
  toString(encoding?: string): string;
}

declare const Buffer: {
  from(data: unknown): Buffer;
  concat(buffers: Buffer[]): Buffer;
};

interface RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface Response {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

declare function fetch(input: string, init?: RequestInit): Promise<Response>;