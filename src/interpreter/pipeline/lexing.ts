import {
  AtomSExpr,
  ListSExpr,
  SExpr,
  makeAtomSExpr,
  makeListSExpr
} from "../ir/sexpr";
import {
  RS_BAD_CHARACTER_CONSTANT_ERR,
  RS_BAD_SYNTAX_ERR,
  RS_DIV_BY_ZERO_ERR,
  RS_EOF_FOLLOWING_BACKSLASH_ERR,
  RS_EXPECTED_CHARACTER_ERR,
  RS_EXPECTED_CLOSING_BLOCK_COMMENT_ERR,
  RS_EXPECTED_CLOSING_PAREN_ERR,
  RS_EXPECTED_CLOSING_PIPE_ERR,
  RS_EXPECTED_CLOSING_QUOTE_ERR,
  RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
  RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR,
  RS_EXPECTED_ELEMENT_FOR_UNQUOTING_ERR,
  RS_ILLEGAL_USE_ERR,
  RS_NESTED_QUOTES_UNSUPPORTED_ERR,
  RS_UNEXPECTED_ERR,
  RS_UNKNOWN_ESCAPE_SEQUENCE_ERR,
  UQ_MISUSE_NOT_UNDER_BACKQUOTE_ERR
} from "../error";
import {
  SourceSpan,
  makeSourceSpan
} from "../data/sourcespan";
import {
  Stage,
  StageError,
  StageResult,
  makeStageResult
} from "../data/stage";
import {
  Token,
  TokenType
} from "../ir/token";
import {
  Keyword
} from "../data/keyword";
import {
  SETTINGS
} from "../settings";

export {
  Lexer
};

const DELIMITER_RE = /[\s"'([{)\]};`,]/;
const LEFT_PAREN_RE = /^[([{]$/;
const RIGHT_PAREN_RE = /^[)\]}]$/;
const TRUE_LITERAL_RE = /^#(T|t|true)$/;
const FALSE_LITERAL_RE = /^#(F|f|false)$/;
const INTEGER_RE = /^[+-]?\d+\.?$/;
const RATIONAL_RE = /^[+-]?\d+\/\d+$/;
const DECIMAL_RE = /^[+-]?\d*\.\d+$/;
const DIV_BY_ZERO_RE = /^[+-]?\d+\/0+$/;
const PLACEHOLDER_RE = /^\.{2,6}$/;
const CHARACTER_SPECIAL_FORMS_RE = /^#\\(nul|null|backspace|tab|newline|linefeed|vtab|page|return|space|rubout)$/;

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
  private quasiQuoting = false;

  run(result: StageResult<string>): StageResult<SExpr[]> {
    this.position = 0;
    this.lineno = 1;
    this.colno = 0;
    this.input = result.output;
    this.atEnd = this.input.length === 0;
    this.quoting = false;
    this.quasiQuoting = false;
    const sexprs: SExpr[] = [];
    try {
      const sexprCommentDepth = this.eatSpace();
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
      return makeStageResult(sexprs);
    } catch (e) {
      if (e instanceof StageError) {
        return makeStageResult([], [e]);
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
        makeSourceSpan(this.lineno, this.colno - 1, this.lineno, this.colno)
      );
    } else if (ch === "#") {
      return this.nextPoundSExpr();
    } else if (ch === "'") {
      return this.nextQuotedSExpr();
    } else if (ch === "`") {
      if (!SETTINGS.syntax.quasiquoting) {
        throw new StageError(
          RS_ILLEGAL_USE_ERR("`"),
          makeSourceSpan(this.lineno, this.colno - 1, this.lineno, this.colno)
        );
      }
      return this.nextQuotedSExpr(true);
    } else if (ch === "\"") {
      return this.nextString();
    } else if (ch === ",") {
      if (!SETTINGS.syntax.quasiquoting) {
        throw new StageError(
          RS_ILLEGAL_USE_ERR(","),
          makeSourceSpan(this.lineno, this.colno - 1, this.lineno, this.colno)
        );
      }
      return this.nextUnquotedSExpr();
    }

    const lineno = this.lineno;
    this.position--;
    this.atEnd = false;
    const colno = --this.colno;
    const name = this.nextName();
    const sourceSpan = makeSourceSpan(lineno, colno, this.lineno, this.colno);

    let tokenType;
    if (name === ".") {
      throw new StageError(
        RS_ILLEGAL_USE_ERR("."),
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
    return makeAtomSExpr(
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
        makeSourceSpan(openingLineno, openingColno, openingLineno, openingColno + 1)
      );
    }
    const closing = this.next();
    if (sexprCommentDepth.length > 0) {
      throw new StageError(
        RS_UNEXPECTED_ERR(closing),
        makeSourceSpan(this.lineno, this.colno - 1, this.lineno, this.colno)
      );
    }
    if (!this.parenMatches(opening, closing)) {
      throw new StageError(
        RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR(opening, closing),
        makeSourceSpan(this.lineno, this.colno - 1, this.lineno, this.colno)
      );
    }
    return makeListSExpr(
      sexprs,
      makeSourceSpan(openingLineno, openingColno, this.lineno, this.colno)
    );
  }

  private nextPoundSExpr(): AtomSExpr {
    const poundLineno = this.lineno;
    const poundColno = this.colno - 1;
    const poundSourceSpan = makeSourceSpan(poundLineno, poundColno, poundLineno, poundColno + 1);
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
        makeSourceSpan(poundLineno, poundColno, this.lineno, this.colno)
      );
    }
    if (this.match("\\")) {
      return this.nextCharacter();
    }
    let name = "#";
    while (!this.atEnd && !this.peek().match(DELIMITER_RE)) {
      name += this.next();
    }
    const sourceSpan = makeSourceSpan(poundLineno, poundColno, this.lineno, this.colno);
    if (name.match(TRUE_LITERAL_RE)) {
      return makeAtomSExpr(
        new Token(TokenType.True, name, sourceSpan),
        sourceSpan
      );
    } else if (name.match(FALSE_LITERAL_RE)) {
      return makeAtomSExpr(
        new Token(TokenType.False, name, sourceSpan),
        sourceSpan
      );
    } else {
      throw new StageError(
        RS_BAD_SYNTAX_ERR(name),
        sourceSpan
      );
    }
  }

  private nextQuotedSExpr(quasiquote = false): ListSExpr {
    const quoteLineno = this.lineno;
    const quoteColno = this.colno - 1;
    const quoteSourceSpan = makeSourceSpan(quoteLineno, quoteColno, quoteLineno, quoteColno + 1);
    if (this.quoting || this.quasiQuoting) {
      throw new StageError(
        RS_NESTED_QUOTES_UNSUPPORTED_ERR,
        quoteSourceSpan
      );
    }
    if (quasiquote) {
      this.quasiQuoting = true;
    } else {
      this.quoting = true;
    }
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
    this.quasiQuoting = false;
    return makeListSExpr(
      [
        makeAtomSExpr(
          new Token(TokenType.Keyword, quasiquote ? Keyword.Quasiquote : Keyword.Quote, quoteSourceSpan),
          quoteSourceSpan
        ),
        sexpr
      ],
      makeSourceSpan(quoteLineno, quoteColno, this.lineno, this.colno)
    );
  }

  private nextCharacter(): AtomSExpr {
    const lineno = this.lineno;
    const colno = this.colno - 2;
    let name = "#\\";
    if (this.atEnd) {
      throw new StageError(
        RS_EXPECTED_CHARACTER_ERR,
        makeSourceSpan(lineno, colno, this.lineno, this.colno)
      );
    }
    name += this.next();
    if (name.match(/#\\[^a-z]/i)) {
      const sourceSpan = makeSourceSpan(lineno, colno, this.lineno, this.colno);
      return makeAtomSExpr(
        new Token(TokenType.Character, name, sourceSpan),
        sourceSpan
      );
    }
    while (!this.atEnd && this.peek().match(/[a-z]/i)) {
      name += this.next();
    }
    const sourceSpan = makeSourceSpan(lineno, colno, this.lineno, this.colno);
    if (name.length - 2 > 1 && !name.match(CHARACTER_SPECIAL_FORMS_RE)) {
      throw new StageError(
        RS_BAD_CHARACTER_CONSTANT_ERR(name),
        sourceSpan
      );
    }
    return makeAtomSExpr(
      new Token(TokenType.Character, name, sourceSpan),
      sourceSpan
    );
  }

  private nextString(): AtomSExpr {
    const lineno = this.lineno;
    const colno = this.colno - 1;
    let str = "\"";
    while (!this.atEnd) {
      const ch = this.next();
      switch (ch) {
        case "\"": {
          return makeAtomSExpr(
            new Token(
              TokenType.String,
              str + "\"",
              makeSourceSpan(lineno, colno, this.lineno, this.colno)
            ),
            makeSourceSpan(lineno, colno, this.lineno, this.colno)
          );
        }
        case "\\": {
          if (this.atEnd) {
            throw new StageError(
              RS_EXPECTED_CLOSING_QUOTE_ERR,
              makeSourceSpan(lineno, colno, this.lineno, this.colno)
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
            case "\r": {
              this.match("\n");
              break;
            }
            default: {
              throw new StageError(
                RS_UNKNOWN_ESCAPE_SEQUENCE_ERR(ch),
                makeSourceSpan(this.lineno, this.colno - 2, this.lineno, this.colno)
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
      makeSourceSpan(lineno, colno, this.lineno, this.colno)
    );
  }

  private nextUnquotedSExpr(): ListSExpr {
    const unquoteLineno = this.lineno;
    const unquoteColno = this.colno - 1;
    const unquoteSourceSpan = makeSourceSpan(unquoteLineno, unquoteColno, unquoteLineno, unquoteColno + 1);
    if (!this.quasiQuoting) {
      throw new StageError(
        UQ_MISUSE_NOT_UNDER_BACKQUOTE_ERR("unquote", "comma"),
        unquoteSourceSpan
      );
    }
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
        RS_EXPECTED_ELEMENT_FOR_UNQUOTING_ERR("end-of-file"),
        unquoteSourceSpan
      );
    }
    const sexpr = this.nextSExpr();
    return makeListSExpr(
      [
        makeAtomSExpr(
          new Token(TokenType.Keyword, Keyword.Unquote, unquoteSourceSpan),
          unquoteSourceSpan
        ),
        sexpr
      ],
      makeSourceSpan(unquoteLineno, unquoteColno, this.lineno, this.colno)
    );
  }

  private nextName(): string {
    const lineno = this.lineno;
    const colno = this.colno;
    let name = "";
    while (!this.atEnd && !this.peek().match(DELIMITER_RE)) {
      const ch = this.next();
      if (ch === "\\") {
        if (!this.atEnd) {
          name += this.next();
        } else {
          throw new StageError(
            RS_EOF_FOLLOWING_BACKSLASH_ERR,
            makeSourceSpan(lineno, colno, this.lineno, this.colno)
          );
        }
      } else if (ch === "|") {
        const lineno = this.lineno;
        const colno = this.colno;
        do {
          if (this.atEnd) {
            throw new StageError(
              RS_EXPECTED_CLOSING_PIPE_ERR,
              makeSourceSpan(lineno, colno, this.lineno, this.colno)
            );
          }
          const ch = this.next();
          if (ch === "|") {
            break;
          } else {
            name += ch;
          }
        } while(!this.atEnd);
      } else {
        name += ch;
      }
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
      const lineno = this.lineno;
      const colno = this.colno - 2;
      let depth = 1;
      while(!this.atEnd && depth > 0) {
        const ch = this.next();
        if (ch === "#" && this.match("|")) {
          depth++;
        } else if (ch === "|" && this.match("#")) {
          depth--;
        }
      }
      if (this.atEnd && depth > 0) {
        throw new StageError(
          RS_EXPECTED_CLOSING_BLOCK_COMMENT_ERR,
          makeSourceSpan(lineno, colno, this.lineno, this.colno)
        );
      }
      return this.eatSpace();
    } else if (ch === "#" && this.match("#;")) {
      return [makeSourceSpan(this.lineno, this.colno - 2, this.lineno, this.colno)].concat(this.eatSpace());
    } else {
      return [];
    }
  }

  private next(): string {
    const ch = this.input[this.position++];
    this.checkAtEnd();
    if (ch === "\n") {
      this.lineno++;
      this.colno = 0;
    } else if (ch !== "") {
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
