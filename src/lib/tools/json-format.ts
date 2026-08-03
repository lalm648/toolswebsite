/**
 * A JSON re-formatter that preserves number literals exactly.
 *
 * `JSON.parse` followed by `JSON.stringify` routes every number through a float, so
 * 64-bit identifiers lose precision (12345678901234567890 -> 12345678901234568000)
 * and trailing zeros disappear (1.0 -> 1). API payloads are the main thing people
 * paste into a JSON formatter, so that silent corruption matters. This walks the
 * source text and re-emits the original numeric tokens untouched.
 */

export type JsonFormatFailure = {
  message: string;
  line: number;
  column: number;
};

export type JsonFormatResult =
  | { ok: true; output: string }
  | { ok: false; error: JsonFormatFailure };

const whitespace = new Set([" ", "\t", "\n", "\r"]);

class JsonReformatter {
  private pos = 0;
  private out = "";
  private readonly text: string;
  private readonly indentUnit: string;

  // Written out longhand rather than as constructor parameter properties, because the
  // test runner strips types without transforming them.
  constructor(text: string, indentUnit: string) {
    this.text = text;
    this.indentUnit = indentUnit;
  }

  format(): string {
    this.skipWhitespace();
    this.readValue(0);
    this.skipWhitespace();

    if (this.pos < this.text.length) {
      this.fail(`Unexpected ${JSON.stringify(this.text[this.pos])} after the top-level value`);
    }

    return this.out;
  }

  private get pretty() {
    return this.indentUnit.length > 0;
  }

  private newline(depth: number) {
    if (!this.pretty) return "";
    return `\n${this.indentUnit.repeat(depth)}`;
  }

  private fail(message: string): never {
    let line = 1;
    let lineStart = 0;

    for (let index = 0; index < this.pos && index < this.text.length; index += 1) {
      if (this.text[index] === "\n") {
        line += 1;
        lineStart = index + 1;
      }
    }

    const error = new Error(message) as Error & JsonFormatFailure;
    error.message = message;
    error.line = line;
    error.column = this.pos - lineStart + 1;
    throw error;
  }

  private skipWhitespace() {
    while (this.pos < this.text.length && whitespace.has(this.text[this.pos])) {
      this.pos += 1;
    }
  }

  private expect(char: string) {
    if (this.text[this.pos] !== char) {
      this.fail(
        this.pos >= this.text.length
          ? `Unexpected end of input, expected ${JSON.stringify(char)}`
          : `Expected ${JSON.stringify(char)} but found ${JSON.stringify(this.text[this.pos])}`
      );
    }
    this.pos += 1;
  }

  private readValue(depth: number) {
    if (this.pos >= this.text.length) {
      this.fail("Unexpected end of input");
    }

    const char = this.text[this.pos];

    if (char === "{") return this.readObject(depth);
    if (char === "[") return this.readArray(depth);
    if (char === '"') return this.readString();
    if (char === "-" || (char >= "0" && char <= "9")) return this.readNumber();
    if (this.text.startsWith("true", this.pos)) return this.readLiteral("true");
    if (this.text.startsWith("false", this.pos)) return this.readLiteral("false");
    if (this.text.startsWith("null", this.pos)) return this.readLiteral("null");

    this.fail(`Unexpected ${JSON.stringify(char)}`);
  }

  private readLiteral(literal: string) {
    this.out += literal;
    this.pos += literal.length;
  }

  private readString() {
    const start = this.pos;
    this.pos += 1; // opening quote

    while (this.pos < this.text.length) {
      const char = this.text[this.pos];

      if (char === "\\") {
        const escape = this.text[this.pos + 1];

        if (escape === undefined) {
          this.fail("Unterminated escape sequence in string");
        }

        if (escape === "u") {
          const hex = this.text.slice(this.pos + 2, this.pos + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            this.pos += 1;
            this.fail("Invalid \\u escape: expected four hexadecimal digits");
          }
          this.pos += 6;
          continue;
        }

        if (!'"\\/bfnrt'.includes(escape)) {
          this.pos += 1;
          this.fail(`Invalid escape sequence \\${escape}`);
        }

        this.pos += 2;
        continue;
      }

      if (char === '"') {
        this.pos += 1;
        this.out += this.text.slice(start, this.pos);
        return;
      }

      // Raw control characters are not legal inside a JSON string.
      if (char < " ") {
        this.fail("Unescaped control character in string");
      }

      this.pos += 1;
    }

    this.pos = start;
    this.fail("Unterminated string");
  }

  private readNumber() {
    const start = this.pos;

    if (this.text[this.pos] === "-") this.pos += 1;

    if (this.text[this.pos] === "0") {
      this.pos += 1;
    } else if (this.text[this.pos] >= "1" && this.text[this.pos] <= "9") {
      while (this.text[this.pos] >= "0" && this.text[this.pos] <= "9") this.pos += 1;
    } else {
      this.fail("Invalid number");
    }

    if (this.text[this.pos] === ".") {
      this.pos += 1;
      if (!(this.text[this.pos] >= "0" && this.text[this.pos] <= "9")) {
        this.fail("Invalid number: expected a digit after the decimal point");
      }
      while (this.text[this.pos] >= "0" && this.text[this.pos] <= "9") this.pos += 1;
    }

    if (this.text[this.pos] === "e" || this.text[this.pos] === "E") {
      this.pos += 1;
      if (this.text[this.pos] === "+" || this.text[this.pos] === "-") this.pos += 1;
      if (!(this.text[this.pos] >= "0" && this.text[this.pos] <= "9")) {
        this.fail("Invalid number: expected a digit in the exponent");
      }
      while (this.text[this.pos] >= "0" && this.text[this.pos] <= "9") this.pos += 1;
    }

    // The raw token, verbatim — this is the whole point of the parser.
    this.out += this.text.slice(start, this.pos);
  }

  private readObject(depth: number) {
    this.expect("{");
    this.skipWhitespace();

    if (this.text[this.pos] === "}") {
      this.pos += 1;
      this.out += "{}";
      return;
    }

    this.out += "{";

    for (;;) {
      this.out += this.newline(depth + 1);
      this.skipWhitespace();

      if (this.text[this.pos] !== '"') {
        this.fail("Expected a double-quoted property name");
      }

      this.readString();
      this.skipWhitespace();
      this.expect(":");
      this.out += this.pretty ? ": " : ":";
      this.skipWhitespace();
      this.readValue(depth + 1);
      this.skipWhitespace();

      if (this.text[this.pos] === ",") {
        this.pos += 1;
        this.out += ",";
        continue;
      }

      if (this.text[this.pos] === "}") {
        this.pos += 1;
        this.out += this.newline(depth) + "}";
        return;
      }

      this.fail(
        this.pos >= this.text.length
          ? "Unexpected end of input, expected ',' or '}'"
          : `Expected ',' or '}' but found ${JSON.stringify(this.text[this.pos])}`
      );
    }
  }

  private readArray(depth: number) {
    this.expect("[");
    this.skipWhitespace();

    if (this.text[this.pos] === "]") {
      this.pos += 1;
      this.out += "[]";
      return;
    }

    this.out += "[";

    for (;;) {
      this.out += this.newline(depth + 1);
      this.skipWhitespace();
      this.readValue(depth + 1);
      this.skipWhitespace();

      if (this.text[this.pos] === ",") {
        this.pos += 1;
        this.out += ",";
        continue;
      }

      if (this.text[this.pos] === "]") {
        this.pos += 1;
        this.out += this.newline(depth) + "]";
        return;
      }

      this.fail(
        this.pos >= this.text.length
          ? "Unexpected end of input, expected ',' or ']'"
          : `Expected ',' or ']' but found ${JSON.stringify(this.text[this.pos])}`
      );
    }
  }
}

export function reformatJson(text: string, indentUnit: string): JsonFormatResult {
  if (!text.trim()) {
    return { ok: false, error: { message: "Paste some JSON to format.", line: 1, column: 1 } };
  }

  try {
    return { ok: true, output: new JsonReformatter(text, indentUnit).format() };
  } catch (caught) {
    const failure = caught as Error & Partial<JsonFormatFailure>;
    return {
      ok: false,
      error: {
        message: failure.message || "Invalid JSON.",
        line: failure.line ?? 1,
        column: failure.column ?? 1,
      },
    };
  }
}

/** True when a numeric token cannot survive a JS float round trip. */
export function findPrecisionRisks(text: string) {
  const risky: string[] = [];

  for (const match of text.matchAll(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g)) {
    const raw = match[0];
    if (String(Number(raw)) !== raw) {
      risky.push(raw);
    }
  }

  return [...new Set(risky)];
}
