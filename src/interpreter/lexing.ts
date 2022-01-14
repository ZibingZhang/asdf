import {
  AtomSExpr,
  ListSExpr,
  SExpr
} from "./sexpr";
import {
  RS_BAD_SYNTAX_ERR,
  RS_DIV_BY_ZERO_ERR,
  RS_EXPECTED_CLOSING_PAREN_ERR,
  RS_EXPECTED_CLOSING_QUOTE_ERR,
  RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
  RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR,
  RS_ILLEGAL_USE_OF_DOT_ERR,
  RS_NESTED_QUOTES_UNSUPPORTED_ERR,
  RS_QUASI_QUOTE_UNSUPPORTED_ERR,
  RS_UNEXPECTED_ERR,
  RS_UNKNOWN_ESCAPE_SEQUENCE_ERR
} from "./error";
import {
  Stage,
  StageError,
  StageOutput
} from "./pipeline";
import {
  Token,
  TokenType
} from "./token";
import {
  SETTINGS
} from "./settings";
import {
  SourceSpan
} from "./sourcespan";

export {
  Lexer
};

const DELIMITER_RE = /[\s"'([{)\]};`,]/;
const LEFT_PAREN_RE = /^[([{]$/;
const RIGHT_PAREN_RE = /^[)\]}]$/;
const QUASI_QUOTE_RE = /^[`,]$/;
const TRUE_LITERAL_RE = /^#(T|t|true)$/;
const FALSE_LITERAL_RE = /^#(F|f|false)$/;
const INTEGER_RE = /^[+-]?\d+\.?$/;
const RATIONAL_RE = /^[+-]?\d+\/\d+$/;
const DECIMAL_RE = /^[+-]?\d*\.\d+$/;
const DIV_BY_ZERO_RE = /^[+-]?\d+\/0+$/;
const PLACEHOLDER_RE = /^\.{2,6}$/;

const ESCAPED_A = String.fromCharCode(7);
const ESCAPED_B = String.fromCharCode(8);
const ESCAPED_T = String.fromCharCode(9);
const ESCAPED_N = String.fromCharCode(10);
const ESCAPED_V = String.fromCharCode(11);
const ESCAPED_F = String.fromCharCode(12);
const ESCAPED_R = String.fromCharCode(13);
const ESCAPED_E = String.fromCharCode(27);

class Lexer implements Stage<string, SExpr[]> {
  private position = 0;
  private lineno = 1;
  private colno = 0;
  private input = "";
  private atEnd = false;
  private quoting = false;

  run(input: StageOutput<string>): StageOutput<SExpr[]> {
    this.position = 0;
    this.lineno = 1;
    this.colno = 0;
    this.input = input.output;
    this.atEnd = this.input.length === 0;
    this.quoting = false;
    const sexprs: SExpr[] = [];
    const sexprCommentDepth = this.eatSpace();
    try {
      while (!this.atEnd) {
        const sexpr = this.nextSExpr();
        if (sexprCommentDepth.length > 0) {
          sexprCommentDepth.pop();
        } else {
          sexprs.push(sexpr);
        }
        sexprCommentDepth.push(...this.eatSpace());
      }
      if (sexprCommentDepth.length > 0) {
        throw new StageError(
          RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
          <SourceSpan>sexprCommentDepth.pop()
        );
      }
      return new StageOutput(sexprs);
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput([], [e]);
      } else {
        throw e;
      }
    }
  }

  private nextSExpr(): SExpr {
    const ch = this.next();

    if (ch.match(LEFT_PAREN_RE)) {
      return this.nextListSExpr(ch);
    } else if (ch.match(RIGHT_PAREN_RE)) {
      throw new StageError(
        RS_UNEXPECTED_ERR(ch),
        new SourceSpan(this.lineno, this.colno - 1, this.lineno, this.colno)
      );
    } else if (ch === "#") {
      return this.nextPoundSExpr();
    } else if (ch.match(QUASI_QUOTE_RE)) {
      throw new StageError(
        RS_QUASI_QUOTE_UNSUPPORTED_ERR,
        new SourceSpan(this.lineno, this.colno - 1, this.lineno, this.colno)
      );
    } else if (ch === "'") {
      return this.nextQuotedSExpr();
    } else if (ch === "\"") {
      return this.nextString(this.lineno, this.colno - 1);
    }

    const name = ch + this.nextName();
    const sourceSpan = new SourceSpan(this.lineno, this.colno - name.length, this.lineno, this.colno);
    let tokenType;
    if (name === ".") {
      throw new StageError(
        RS_ILLEGAL_USE_OF_DOT_ERR,
        sourceSpan
      );
    } else if (name.match(INTEGER_RE)) {
      tokenType = TokenType.Integer;
    } else if (name.match(RATIONAL_RE)) {
      if (name.match(DIV_BY_ZERO_RE)) {
        throw new StageError(
          RS_DIV_BY_ZERO_ERR(name),
          sourceSpan
        );
      }
      tokenType = TokenType.Rational;
    } else if (name.match(DECIMAL_RE)) {
      tokenType = TokenType.Decimal;
    } else if (SETTINGS.syntax.forms.includes(name)) {
      tokenType = TokenType.Keyword;
    } else if (name.match(PLACEHOLDER_RE)) {
      tokenType = TokenType.Placeholder;
    } else {
      tokenType = TokenType.Name;
    }
    return new AtomSExpr(
      new Token(tokenType, name, sourceSpan),
      sourceSpan
    );
  }

  private nextListSExpr(opening: string): ListSExpr {
    const openingLineno = this.lineno;
    const openingColno = this.colno - 1;
    const sexprs: SExpr[] = [];
    const sexprCommentDepth = this.eatSpace();
    while (!this.atEnd && !this.peek().match(RIGHT_PAREN_RE)) {
      const sexpr = this.nextSExpr();
      if (sexprCommentDepth.length > 0) {
        sexprCommentDepth.pop();
      } else {
        sexprs.push(sexpr);
      }
      sexprCommentDepth.push(...this.eatSpace());
    }
    if (this.atEnd) {
      throw new StageError(
        RS_EXPECTED_CLOSING_PAREN_ERR(opening),
        new SourceSpan(openingLineno, openingColno, openingLineno, openingColno + 1)
      );
    }
    const closing = this.next();
    if (sexprCommentDepth.length > 0) {
      throw new StageError(
        RS_UNEXPECTED_ERR(closing),
        <SourceSpan>sexprCommentDepth.pop()
      );
    }
    if (!this.parenMatches(opening, closing)) {
      throw new StageError(
        RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR(opening, closing),
        new SourceSpan(this.lineno, this.colno - 1, this.lineno, this.colno)
      );
    }
    return new ListSExpr(
      sexprs,
      new SourceSpan(openingLineno, openingColno, this.lineno, this.colno)
    );
  }

  private nextPoundSExpr(): AtomSExpr {
    const poundLineno = this.lineno;
    const poundColno = this.colno - 1;
    const poundSourceSpan = new SourceSpan(poundLineno, poundColno, poundLineno, poundColno + 1);
    if (this.atEnd) {
      throw new StageError(
        RS_BAD_SYNTAX_ERR("#"),
        poundSourceSpan
      );
    }
    if (this.peek().match(DELIMITER_RE)) {
      const ch = this.next();
      throw new StageError(
        RS_BAD_SYNTAX_ERR("#" + ch),
        new SourceSpan(poundLineno, poundColno, this.lineno, this.colno)
      );
    }
    const name = "#" + this.nextName();
    if (name.match(TRUE_LITERAL_RE)) {
      const sourceSpan = new SourceSpan(poundLineno, poundColno, this.lineno, this.colno);
      return new AtomSExpr(
        new Token(TokenType.True, name, sourceSpan),
        sourceSpan
      );
    } else if (name.match(FALSE_LITERAL_RE)) {
      const sourceSpan = new SourceSpan(poundLineno, poundColno, this.lineno, this.colno);
      return new AtomSExpr(
        new Token(TokenType.False, name, sourceSpan),
        sourceSpan
      );
    } else {
      throw new StageError(
        RS_BAD_SYNTAX_ERR(name),
        new SourceSpan(poundLineno, poundColno, this.lineno, this.colno)
      );
    }
  }

  private nextQuotedSExpr(): ListSExpr {
    const quoteLineno = this.lineno;
    const quoteColno = this.colno - 1;
    const quoteSourceSpan = new SourceSpan(quoteLineno, quoteColno, quoteLineno, quoteColno + 1);
    if (this.quoting) {
      throw new StageError(
        RS_NESTED_QUOTES_UNSUPPORTED_ERR,
        quoteSourceSpan
      );
    }
    this.quoting = true;
    const sexprCommentDepth = this.eatSpace();
    while (sexprCommentDepth.length > 0) {
      if (this.atEnd) {
        throw new StageError(
          RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
          <SourceSpan>sexprCommentDepth.pop()
        );
      }
      this.nextSExpr();
      sexprCommentDepth.pop();
      sexprCommentDepth.push(...this.eatSpace());
    }
    if (this.atEnd) {
      throw new StageError(
        RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR("end-of-file"),
        quoteSourceSpan
      );
    }
    const sexpr = this.nextSExpr();
    this.quoting = false;
    return new ListSExpr(
      [
        new AtomSExpr(
          new Token(TokenType.Keyword, "quote", quoteSourceSpan),
          quoteSourceSpan
        ),
        sexpr
      ],
      new SourceSpan(quoteLineno, quoteColno, this.lineno, this.colno)
    );
  }

  private nextString(lineno: number, colno: number): AtomSExpr {
    let str = "\"";
    while (!this.atEnd) {
      const ch = this.next();
      switch (ch) {
        case "\"": {
          return new AtomSExpr(
            new Token(
              TokenType.String,
              str + "\"",
              new SourceSpan(lineno, colno, this.lineno, this.colno)
            ),
            new SourceSpan(lineno, colno, this.lineno, this.colno)
          );
        }
        case "\\": {
          if (this.atEnd) {
            throw new StageError(
              RS_EXPECTED_CLOSING_QUOTE_ERR,
              new SourceSpan(lineno, colno, this.lineno, this.colno)
            );
          }
          const ch = this.next();
          switch (ch) {
            case "a": {
              str += ESCAPED_A;
              break;
            }
            case "b": {
              str += ESCAPED_B;
              break;
            }
            case "t": {
              str += ESCAPED_T;
              break;
            }
            case "n": {
              str += ESCAPED_N;
              break;
            }
            case "v": {
              str += ESCAPED_V;
              break;
            }
            case "f": {
              str += ESCAPED_F;
              break;
            }
            case "r": {
              str += ESCAPED_R;
              break;
            }
            case "e": {
              str += ESCAPED_E;
              break;
            }
            case "\"":
            case "'":
            case "\\": {
              str += ch;
              break;
            }
            case "\n": {
              break;
            }
            default: {
              throw new StageError(
                RS_UNKNOWN_ESCAPE_SEQUENCE_ERR(ch),
                new SourceSpan(this.lineno, this.colno - 2, this.lineno, this.colno)
              );
            }
          }
          break;
        }
        default: {
          str += ch;
        }
      }
    }
    throw new StageError(
      RS_EXPECTED_CLOSING_QUOTE_ERR,
      new SourceSpan(lineno, colno, this.lineno, this.colno)
    );
  }

  private nextName(): string {
    let name = "";
    while (!this.atEnd && !this.peek().match(DELIMITER_RE)) {
      name += this.next();
    }
    return name;
  }

  private parenMatches(opening: string, right: string): boolean {
    switch (opening) {
      case "(": return right === ")";
      case "[": return right === "]";
      case "{": return right === "}";
      default: return false;
    }
  }

  private eatSpace(): SourceSpan[] {
    if (this.atEnd) {
      return [];
    }
    const ch = this.peek();
    if (ch.match(/\s/)) {
      while(this.peek().match(/\s/)) {
        this.next();
      }
      return this.eatSpace();
    } else if (ch === ";" || (ch === "#" && this.peek(3).match(/^#![ /]$/))) {
      while(!this.atEnd && this.peek() != "\n") {
        this.next();
      }
      if (this.peek() === "\n") {
        this.next();
      }
      return this.eatSpace();
    } else if (ch === "#" && this.match("#|")) {
      let depth = 1;
      while(!this.atEnd && depth > 0) {
        const ch = this.next();
        if (ch === "#" && this.match("|")) {
          depth++;
        } else if (ch === "|" && this.match("#")) {
          depth--;
        }
      }
      return this.eatSpace();
    } else if (ch === "#" && this.match("#;")) {
      return [new SourceSpan(this.lineno, this.colno - 2, this.lineno, this.colno)].concat(this.eatSpace());
    } else {
      return [];
    }
  }

  private next(): string {
    this.position++;
    this.checkAtEnd();
    const ch = this.input[this.position - 1];
    if (ch === "\n") {
      this.lineno++;
      this.colno = 0;
    } else {
      this.colno++;
    }
    return ch;
  }

  private peek(n = 1): string {
    return this.input.slice(this.position, Math.min(this.position + n, this.input.length));
  }

  private match(s: string): boolean {
    if (this.peek(s.length) === s) {
      for (let i = 0; i < s.length; i++) {
        this.next();
      }
      return true;
    } else {
      return false;
    }
  }

  private checkAtEnd() {
    if (this.position == this.input.length) { this.atEnd = true; }
  }
}
