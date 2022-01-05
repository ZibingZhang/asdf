import {
  RS_BAD_SYNTAX_ERR,
  RS_DIV_BY_ZERO_ERR,
  RS_EXPECTED_CLOSING_PAREN_ERR,
  RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
  RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR,
  RS_ILLEGAL_USE_OF_DOT_ERR,
  RS_NESTED_QUOTES_UNSUPPORTED_ERR,
  RS_QUASI_QUOTE_UNSUPPORTED_ERR,
  RS_UNCLOSED_STRING_ERR,
  RS_UNEXPECTED_ERR
} from "./error.js";
import {
  Stage,
  StageError,
  StageOutput
} from "./pipeline.js";
import {
  AtomSExpr,
  ListSExpr,
  SExpr
} from "./sexpr.js";
import {
  NO_SOURCE_SPAN,
  SourceSpan
} from "./sourcespan.js";
import {
  NO_TOKEN,
  Token,
  TokenType
} from "./token.js";

export {
  Lexer
};

const KEYWORDS = new Set(
  [
    "and",
    "cond",
    "define",
    "define-struct",
    "if",
    "or"
  ]
);

const LEFT_PAREN_RE = /^[([{]$/;
const RIGHT_PAREN_RE = /^[)\]}]$/;
const QUASI_QUOTE_RE = /^[`,]$/;
const TRUE_LITERAL_RE = /^#(T|t|true)$/;
const FALSE_LITERAL_RE = /^#(F|f|false)$/;
const INTEGER_RE = /^[+-]?\d+\.?$/;
const RATIONAL_RE = /^[+-]?\d+\/\d+$/;
const DECIMAL_RE = /^[+-]?\d*\.\d+$/;
const DIV_BY_ZERO_RE = /^[+-]?\d+\/0+$/;

enum State {
  INIT,
  BLOCK_COMMENT,
  BLOCK_COMMENT_PIPE,
  BLOCK_COMMENT_POUND,
  LINE_COMMENT,
  NAME,
  POUND,
  QUOTE,
  STRING
}

class Lexer implements Stage {
  private position = 0;
  private input = "";
  private isAtEnd = false;

  run(input: StageOutput): StageOutput {
    try {
      return new StageOutput(this.runHelper(input.output));
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(null, [e]);
      } else {
        throw e;
      }
    }
  }

  private runHelper(rawInput: string): SExpr[] {
    this.position = 0;
    this.input = rawInput;
    this.isAtEnd = this.input.length === 0;

    const sexprs: SExpr[] = [];
    const sexprStack: SExpr[][] = [];
    const parenStack: Token[] = [];
    let opening;
    let state = State.INIT;
    let text = "";
    let lineno = 1;
    let colno = 0;

    let blockCommentDepth = 0;
    let quoteSourceSpan = NO_SOURCE_SPAN;
    let expectingElementToQuote = false;
    let sexprCommentSourceSpan = NO_SOURCE_SPAN;
    let expectingSExprToComment = false;
    let commentingListSExpr = false;

    const addToken = (lineno: number, colno: number, type: TokenType, text: string) => {
      const token = new Token(type, text, new SourceSpan(lineno, colno, lineno, colno + text.length));
      let sexpr: SExpr = new AtomSExpr(token, token.sourceSpan);
      if (expectingSExprToComment) {
        expectingSExprToComment = false;
      } else {
        if (expectingElementToQuote) {
          sexpr = new ListSExpr(
            [
              new AtomSExpr(
                new Token(
                  TokenType.NAME,
                  "quote",
                  NO_SOURCE_SPAN
                ),
                NO_SOURCE_SPAN
              ),
              sexpr
            ],
            new SourceSpan(
              quoteSourceSpan.startLineno,
              quoteSourceSpan.startColno,
              sexpr.sourceSpan.endLineno,
              sexpr.sourceSpan.endColno
            )
          );
          expectingElementToQuote = false;
        }
        if (sexprStack.length === 0) {
          sexprs.push(sexpr);
        } else {
          sexprStack[sexprStack.length - 1].push(sexpr);
        }
      }
      text = "";
    };
    const addNameToken = (lineno: number, colno: number, text: string) => {
      if (text === ".") {
        throw new StageError(
          RS_ILLEGAL_USE_OF_DOT_ERR,
          new SourceSpan(lineno, colno, lineno, colno + 1)
        );
      } else if (text === "...") {
        addToken(lineno, colno, TokenType.PLACEHOLDER, text);
      } else if (text.match(INTEGER_RE)) {
        addToken(lineno, colno, TokenType.INTEGER, text);
      } else if (text.match(RATIONAL_RE)) {
        if (text.match(DIV_BY_ZERO_RE)) {
          throw new StageError(
            RS_DIV_BY_ZERO_ERR(text),
            new SourceSpan(lineno, colno, lineno, colno + text.length)
          );
        } else {
          addToken(lineno, colno, TokenType.RATIONAL, text);
        }
      } else if (text.match(DECIMAL_RE)) {
        addToken(lineno, colno, TokenType.DECIMAL, text);
      } else if (KEYWORDS.has(text)) {
        addToken(lineno, colno, TokenType.KEYWORD, text);
      } else {
        addToken(lineno, colno, TokenType.NAME, text);
      }
    };
    const addLeftParenToken = (lineno: number, colno: number, paren: string) => {
      if (expectingSExprToComment) {
        expectingSExprToComment = false;
        commentingListSExpr = true;
      }
      sexprStack.push([]);
      parenStack.push(new Token(TokenType.LEFT_PAREN, paren, new SourceSpan(lineno, colno, lineno, colno + 1)));
      text = "";
    };
    const addRightParenToken = (lineno: number, colno: number, paren: string) => {
      if (parenStack.length === 0) {
        throw new StageError(
          RS_UNEXPECTED_ERR(paren),
          new SourceSpan(lineno, colno, lineno, colno + 1)
        );
      } else if (!this.matches((opening = parenStack.pop() || NO_TOKEN).text, paren)) {
        throw new StageError(
          RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR(opening?.text, paren),
          new SourceSpan(lineno, colno, lineno, colno + 1)
        );
      } else {
        let sexpr: SExpr = new ListSExpr(
          sexprStack.pop() || [],
          new SourceSpan(
            opening.sourceSpan.startLineno,
            opening.sourceSpan.startColno,
            lineno,
            colno + 1
          )
        );
        if (commentingListSExpr) {
          commentingListSExpr = false;
        } else {
          if (expectingElementToQuote) {
            sexpr = new ListSExpr(
              [
                new AtomSExpr(
                  new Token(
                    TokenType.NAME,
                    "quote",
                    NO_SOURCE_SPAN
                  ),
                  NO_SOURCE_SPAN
                ),
                sexpr
              ],
              new SourceSpan(
                quoteSourceSpan.startLineno,
                quoteSourceSpan.startColno,
                lineno,
                colno + 1
              )
            );
            expectingElementToQuote = false;
          }
          if (sexprStack.length === 0) {
            sexprs.push(sexpr);
          } else {
            sexprStack[sexprStack.length - 1].push(sexpr);
          }
        }
        text = "";
      }
    };

    while (!this.isAtEnd) {
      const ch = this.next();

      switch (state) {
        case State.INIT: {
          text = ch;
          if (ch.match(QUASI_QUOTE_RE)) {
            throw new StageError(
              RS_QUASI_QUOTE_UNSUPPORTED_ERR,
              new SourceSpan(lineno, colno, lineno, colno + 1)
            );
          } else if (ch.match(/\s/)) {
            // skip
          } else if (ch.match(LEFT_PAREN_RE)) {
            addLeftParenToken(lineno, colno, ch);
          } else if (ch.match(RIGHT_PAREN_RE)) {
            addRightParenToken(lineno, colno, ch);
          } else if (ch === "\"") {
            state = State.STRING;
          } else if (ch === "#") {
            if (this.match(";")) {
              colno++;
              expectingSExprToComment = true;
              sexprCommentSourceSpan = new SourceSpan(lineno, colno, lineno, colno + 2);
            } else if (this.match("|")) {
              colno++;
              blockCommentDepth = 0;
              state = State.BLOCK_COMMENT;
            } else if (this.peek(2).match(/!\/?/)) {
              state = State.LINE_COMMENT;
            } else {
              state = State.POUND;
            }
          } else if (ch === "'") {
            quoteSourceSpan = new SourceSpan(lineno, colno, lineno, colno + 1);
            state = State.QUOTE;
          } else if (ch === ";") {
            state = State.LINE_COMMENT;
          } else {
            state = State.NAME;
          }
          break;
        }

        case State.BLOCK_COMMENT: {
          if (ch === "#") {
            state = State.BLOCK_COMMENT_POUND;
          } else if (ch === "|") {
            state = State.BLOCK_COMMENT_PIPE;
          }
          break;
        }

        case State.BLOCK_COMMENT_PIPE: {
          if (ch === "#") {
            if (blockCommentDepth === 0) {
              if (expectingElementToQuote) {
                state = State.QUOTE;
              } else {
                state = State.INIT;
              }
            } else {
              blockCommentDepth--;
              state = State.BLOCK_COMMENT;
            }
          } else {
            state = State.BLOCK_COMMENT;
          }
          break;
        }

        case State.BLOCK_COMMENT_POUND: {
          if (ch === "|") {
            blockCommentDepth++;
            state = State.BLOCK_COMMENT;
          } else {
            state = State.BLOCK_COMMENT;
          }
          break;
        }

        case State.LINE_COMMENT: {
          if (ch === "\n") {
            if (expectingElementToQuote) {
              state = State.QUOTE;
            } else {
              state = State.INIT;
            }
          }
          break;
        }

        case State.NAME: {
          if (ch.match(QUASI_QUOTE_RE)) {
            throw new StageError(
              RS_QUASI_QUOTE_UNSUPPORTED_ERR,
              new SourceSpan(lineno, colno, lineno, colno + 1)
            );
          } else if (ch.match(/\s/)) {
            addNameToken(lineno, colno - text.length, text);
            state = State.INIT;
          } else if (ch.match(LEFT_PAREN_RE)) {
            addNameToken(lineno, colno - text.length, text);
            addLeftParenToken(lineno, colno, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            addNameToken(lineno, colno - text.length, text);
            addRightParenToken(lineno, colno, ch);
            state = State.INIT;
          } else if (ch === "\"") {
            addNameToken(lineno, colno - text.length, text);
            text = ch;
            state = State.STRING;
          } else if (ch === "'") {
            addNameToken(lineno, colno - text.length, text);
            quoteSourceSpan = new SourceSpan(lineno, colno, lineno, colno + 1);
            state = State.QUOTE;
          } else {
            text += ch;
          }
          break;
        }

        case State.POUND: {
          if (ch.match(QUASI_QUOTE_RE)) {
            throw new StageError(
              RS_QUASI_QUOTE_UNSUPPORTED_ERR,
              new SourceSpan(lineno, colno, lineno, colno + 1)
            );
          } else if (ch.match(/\s/)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new StageError(
                RS_BAD_SYNTAX_ERR(text),
                new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1)
              );
            }
            state = State.INIT;
          } else if (ch.match(LEFT_PAREN_RE)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new StageError(
                RS_BAD_SYNTAX_ERR(text),
                new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1)
              );
            }
            addLeftParenToken(lineno, colno + 1, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new StageError(
                RS_BAD_SYNTAX_ERR(text),
                new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1)
              );
            }
            addRightParenToken(lineno, colno, ch);
            state = State.INIT;
          } else if (ch === "\"") {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new StageError(
                RS_BAD_SYNTAX_ERR(text),
                new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1)
              );
            }
            text = ch;
            state = State.STRING;
          } else if (ch === "'") {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new StageError(
                RS_BAD_SYNTAX_ERR(text),
                new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1)
              );
            }
            quoteSourceSpan = new SourceSpan(lineno, colno, lineno, colno + 1);
            state = State.QUOTE;
          } else {
            text += ch;
          }
          break;
        }

        case State.QUOTE: {
          text = ch;
          if (!expectingSExprToComment) { expectingElementToQuote = true; }
          if (ch.match(QUASI_QUOTE_RE)) {
            throw new StageError(
              RS_QUASI_QUOTE_UNSUPPORTED_ERR,
              new SourceSpan(lineno, colno, lineno, colno + 1)
            );
          } else if (ch.match(/\s/)) {
            throw new StageError(
              RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR,
              new SourceSpan(lineno, colno - 1, lineno, colno)
            );
          } else if (ch.match(LEFT_PAREN_RE)) {
            addLeftParenToken(lineno, colno, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            throw new StageError(
              RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR(ch),
              new SourceSpan(lineno, colno, lineno, colno + 1)
            );
          } else if (ch === "\"") {
            state = State.STRING;
          } else if (ch === "#") {
            if (this.match(";")) {
              throw new StageError(
                RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR,
                new SourceSpan(lineno, colno - 1, lineno, colno)
              );
            } else if (this.match("|")) {
              throw new StageError(
                RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR,
                new SourceSpan(lineno, colno - 1, lineno, colno)
              );
            } else if (this.peek(2).match(/!\/?/)) {
              throw new StageError(
                RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR,
                new SourceSpan(lineno, colno - 1, lineno, colno)
              );
            } else {
              state = State.POUND;
            }
          } else if (ch === "'") {
            throw new StageError(
              RS_NESTED_QUOTES_UNSUPPORTED_ERR,
              new SourceSpan(lineno, colno, lineno, colno + 1)
            );
          } else if (ch === ";") {
            throw new StageError(
              RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR,
              new SourceSpan(lineno, colno - 1, lineno, colno)
            );
          } else {
            state = State.NAME;
          }
          break;
        }

        case State.STRING: {
          if (ch === "\"") {
            addToken(lineno, colno - text.length, TokenType.STRING, text + ch);
            state = State.INIT;
          } else if (ch === "\n") {
            throw new StageError(
              RS_UNCLOSED_STRING_ERR,
              new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1)
            );
          }
          text += ch;
          break;
        }
      }

      if (ch === "\n") { lineno++; colno = 0; } else { colno++; }
    }

    switch (state) {
      case State.NAME: {
        addNameToken(lineno, colno - text.length, text);
        break;
      }

      case State.POUND: {
        if (text.match(TRUE_LITERAL_RE)) {
          addToken(lineno, colno - text.length, TokenType.TRUE, text);
        } else if (text.match(FALSE_LITERAL_RE)) {
          addToken(lineno, colno - text.length, TokenType.FALSE, text);
        } else {
          throw new StageError(
            RS_BAD_SYNTAX_ERR(text),
            new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1)
          );
        }
        break;
      }

      case State.QUOTE: {
        throw new StageError(
          RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR("end-of-file"),
          new SourceSpan(lineno, colno - 1, lineno, colno)
        );
      }

      case State.STRING: {
        throw new StageError(
          RS_UNCLOSED_STRING_ERR,
          new SourceSpan(lineno, colno - text.length, lineno, colno)
        );
      }
    }

    let errorSourceSpan = NO_SOURCE_SPAN;
    let error: StageError | false = false;

    if (expectingElementToQuote && quoteSourceSpan.comesAfter(errorSourceSpan)) {
      errorSourceSpan = quoteSourceSpan;
      error = new StageError(
        RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR("end-of-file"),
        new SourceSpan(quoteSourceSpan.startLineno, quoteSourceSpan.startColno, lineno, colno)
      );
    }

    if (expectingSExprToComment && sexprCommentSourceSpan.comesAfter(errorSourceSpan)) {
      error = new StageError(
        RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
        new SourceSpan(sexprCommentSourceSpan.startLineno, sexprCommentSourceSpan.startColno, lineno, colno)
      );
    }

    if ((opening = parenStack.pop()) && opening.sourceSpan.comesAfter(errorSourceSpan)) {
      error = new StageError(
        RS_EXPECTED_CLOSING_PAREN_ERR(opening.text),
        new SourceSpan(opening.sourceSpan.startLineno, opening.sourceSpan.startColno, opening.sourceSpan.startLineno, opening.sourceSpan.startColno + 1)
      );
    }

    if (error) { throw error; }

    return sexprs;
  }

  private matches(left: string | null, right: string): boolean {
    switch (left) {
      case "(": return right === ")";
      case "[": return right === "]";
      case "{": return right === "}";
      default: return false;
    }
  }

  private next(): string {
    this.position++;
    this.checkAtEnd();
    return this.input[this.position - 1];
  }

  private peek(n = 1): string {
    return this.input.slice(this.position, Math.min(this.position + n, this.input.length));
  }

  private match(s: string): boolean {
    if (this.peek(s.length) === s) {
      this.position += s.length;
      return true;
    } else {
      return false;
    }
  }

  private checkAtEnd() {
    if (this.position == this.input.length) { this.isAtEnd = true; }
  }
}
