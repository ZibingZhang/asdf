import { Stage, StageError, StageOutput } from "./pipeline.js";
import { AtomSExpr, ListSExpr, SExpr } from "./sexpr.js";
import { NO_SOURCE_SPAN, SourceSpan } from "./sourcespan.js";
import { NO_TOKEN, Token, TokenType } from "./token.js";

export {
  Lexer
};

const LEFT_PAREN_RE = /^[([{]$/;
const RIGHT_PAREN_RE = /^[)\]}]$/;
const QUASI_QUOTE_RE = /^[`,]$/;
const TRUE_LITERAL_RE = /^#(T|t|true)$/;
const FALSE_LITERAL_RE = /^#(F|f|false)$/;
const INTEGER_RE = /^[+-]?\d+\.?$/;
const RATIONAL_RE = /^[+-]?\d+\/\d+$/;
const DECIMAL_RE = /^[+-]?\d*\.\d+$/;
const DIV_BY_ZERO_RE = /^[+-]?\d+\/0+$/;

const BAD_SYNTAX_ERR = (syntax: string) => {
  return `read-syntax: bad syntax \`${syntax}\``;
};
const DIV_BY_ZERO_ERR = (number: string) => {
  return `read-syntax: division by zero in \`${number}\``;
};
const EXPECTED_CLOSING_PAREN_ERR = (opening: string) => {
  if (opening === "(") {
    return "read-syntax: expected a `)` to close preceding `(`";
  } else if (opening === "[") {
    return "read-syntax: expected a `]` to close preceding `[`";
  } else {
    return "read-syntax: expected a `}` to close preceding `{`";
  }
};
const EXPECTED_COMMENTED_OUT_ELEMENT_ERR = "read-syntax: expected a commented-out element for `#;`, but found end-of-file";
const EXPECTED_CORRECT_CLOSING_PAREN_ERR = (opening: string | null, found: string): string => {
  if (opening === "(") {
    return `read-syntax: expected \`)\` to close preceding \`(\`, found instead \`${found}\``;
  } else if (opening === "[") {
    return `read-syntax: expected \`]\` to close preceding \`[\`, found instead \`${found}\``;
  } else {
    return `read-syntax: expected \`}\` to close preceding \`{\`, found instead \`${found}\``;
  }
};
const EXPECTED_ELEMENT_FOR_QUOTING_ERR = (found: string) => {
  return `read-syntax: expected an element for quoting "'", but found ${found}`;
};
const ILLEGAL_USE_OF_DOT_ERR = "read-syntax: illegal use of `.`";
const NESTED_QUOTES_UNSUPPORTED_ERR = "read-syntax: nested quotes are not supported";
const QUASI_QUOTE_UNSUPPORTED_ERR = "read-syntax: quasiquotes are not supported";
const UNCLOSED_STRING_ERR = "read-syntax: expected a closing `\"`";
const UNEXPECTED_ERR = (found: string) => {
  return `read-syntax: unexpected \`${found}\``;
};

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

class LexerError extends StageError {}

class Lexer implements Stage {
  private position = 0;
  private input = "";
  private isAtEnd = false;

  run(input: StageOutput): StageOutput {
    try {
      return new StageOutput(this.runHelper(input.output));
    } catch (e) {
      if (e instanceof LexerError) {
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
    let lineno = 0;
    let colno = 0;

    let blockCommentDepth = 0;
    let expectingElementToQuote = false;
    let quoteSourceSpan = NO_SOURCE_SPAN;
    let sexprCommentSourceSpan = NO_SOURCE_SPAN;
    let expectingSExprToComment = false;

    const addToken = (lineno: number, colno: number, type: TokenType, text: string) => {
      const token = new Token(type, text, new SourceSpan(lineno, colno, lineno, colno + text.length));
      let sexpr: SExpr = new AtomSExpr(token, token.sourceSpan);
      if (expectingSExprToComment) {
        expectingSExprToComment = false;
      } else {
        if (expectingElementToQuote) {
          sexpr = new ListSExpr(
            [
              new Token(
                TokenType.NAME, "quote", NO_SOURCE_SPAN
              ), sexpr
            ],
            new SourceSpan(
              quoteSourceSpan.startLineno,
              quoteSourceSpan.startColno,
              sexpr.sourceSpan.endLineno,
              sexpr.sourceSpan.endColno
            )
          );
        }
        if (sexprStack.length === 0) {
          sexprs.push(sexpr);
        } else {
          sexprStack[sexprStack.length - 1].push(sexpr);
        }
      }
      text = "";
      expectingElementToQuote = false;
    };
    const addNameToken = (lineno: number, colno: number, text: string) => {
      if (text === ".") {
        throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), ILLEGAL_USE_OF_DOT_ERR);
      } else if (text === "...") {
        addToken(lineno, colno, TokenType.PLACEHOLDER, text);
      } else if (text.match(INTEGER_RE)) {
        addToken(lineno, colno, TokenType.INTEGER, text);
      } else if (text.match(RATIONAL_RE)) {
        if (text.match(DIV_BY_ZERO_RE)) {
          throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + text.length), DIV_BY_ZERO_ERR(text));
        } else {
          addToken(lineno, colno, TokenType.RATIONAL, text);
        }
      } else if (text.match(DECIMAL_RE)) {
        addToken(lineno, colno, TokenType.DECIMAL, text);
      } else {
        addToken(lineno, colno, TokenType.NAME, text);
      }
    };
    const addLeftParenToken = (lineno: number, colno: number, paren: string) => {
      sexprStack.push([]);
      parenStack.push(new Token(TokenType.LEFT_PAREN, paren, new SourceSpan(lineno, colno, lineno, colno + 1)));
      text = "";
    };
    const addRightParenToken = (lineno: number, colno: number, paren: string) => {
      if (parenStack.length === 0) {
        throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), UNEXPECTED_ERR(paren));
      } else if (!this.matches((opening = parenStack.pop() || NO_TOKEN).text, paren)) {
        throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), EXPECTED_CORRECT_CLOSING_PAREN_ERR(opening?.text, paren));
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
        if (expectingSExprToComment) {
          expectingSExprToComment = false;
        } else {
          if (expectingElementToQuote) {
            sexpr = new ListSExpr(
              [
                new Token(
                  TokenType.NAME,
                  "quote",
                  new SourceSpan(
                    opening.sourceSpan.startLineno,
                    opening.sourceSpan.startColno,
                    lineno,
                    colno + 1
                  )
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
          }
          if (sexprStack.length === 0) {
            sexprs.push(sexpr);
          } else {
            sexprStack[sexprStack.length - 1].push(sexpr);
          }
        }
        text = "";
        expectingElementToQuote = false;
      }
    };

    while (!this.isAtEnd) {
      const ch = this.next();

      switch (state) {
        case State.INIT: {
          text = ch;
          if (ch.match(QUASI_QUOTE_RE)) {
            throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), QUASI_QUOTE_UNSUPPORTED_ERR);
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
              expectingSExprToComment = true;
              sexprCommentSourceSpan = new SourceSpan(lineno, colno, lineno, colno + 2);
            } else if (this.match("|")) {
              blockCommentDepth = 0;
              state = State.BLOCK_COMMENT;
            } else if (this.peek(2).match(/!\/?/)) {
              state = State.LINE_COMMENT;
            } else {
              state = State.POUND;
            }
          } else if (ch === "'") {
            if (expectingElementToQuote) {
              throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), NESTED_QUOTES_UNSUPPORTED_ERR);
            }
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
            throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), QUASI_QUOTE_UNSUPPORTED_ERR);
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
            throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new LexerError(new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1), BAD_SYNTAX_ERR(text));
            }
            state = State.INIT;
          } else if (ch.match(LEFT_PAREN_RE)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new LexerError(new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1), BAD_SYNTAX_ERR(text));
            }
            addLeftParenToken(lineno, colno + 1, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new LexerError(new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1), BAD_SYNTAX_ERR(text));
            }
            addRightParenToken(lineno, colno, ch);
            state = State.INIT;
          } else if (ch === "\"") {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new LexerError(new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1), BAD_SYNTAX_ERR(text));
            }
            text = ch;
            state = State.STRING;
          } else if (ch === "'") {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno - text.length, TokenType.FALSE, text);
            } else {
              throw new LexerError(new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1), BAD_SYNTAX_ERR(text));
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
          expectingElementToQuote = true;
          if (ch.match(QUASI_QUOTE_RE)) {
            throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            // skip
          } else if (ch.match(LEFT_PAREN_RE)) {
            addLeftParenToken(lineno, colno, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), EXPECTED_ELEMENT_FOR_QUOTING_ERR(ch));
          } else if (ch === "\"") {
            state = State.STRING;
          } else if (ch === "#") {
            if (this.match(";")) {
              // skip
            } else if (this.match("|")) {
              blockCommentDepth = 0;
              state = State.BLOCK_COMMENT;
            } else if (this.peek(2).match(/!\/?/)) {
              state = State.LINE_COMMENT;
            } else {
              state = State.POUND;
            }
          } else if (ch === "'") {
            throw new LexerError(new SourceSpan(lineno, colno, lineno, colno + 1), NESTED_QUOTES_UNSUPPORTED_ERR);
          } else if (ch === ";") {
            state = State.LINE_COMMENT;
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
            throw new LexerError(new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1), UNCLOSED_STRING_ERR);
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
          throw new LexerError(new SourceSpan(lineno, colno - text.length + 1, lineno, colno + 1), BAD_SYNTAX_ERR(text));
        }
        break;
      }

      case State.QUOTE: {
        throw new LexerError(new SourceSpan(lineno, colno - 1, lineno, colno), EXPECTED_ELEMENT_FOR_QUOTING_ERR("end-of-file"));
      }

      case State.STRING: {
        throw new LexerError(new SourceSpan(lineno, colno - text.length, lineno, colno), UNCLOSED_STRING_ERR);
      }
    }

    if (expectingElementToQuote) {
      throw new LexerError(new SourceSpan(quoteSourceSpan.startLineno, quoteSourceSpan.startColno, lineno, colno), EXPECTED_ELEMENT_FOR_QUOTING_ERR("end-of-file"));
    }

    if (expectingSExprToComment) {
      throw new LexerError(new SourceSpan(sexprCommentSourceSpan.startLineno, sexprCommentSourceSpan.startColno, lineno, colno), EXPECTED_COMMENTED_OUT_ELEMENT_ERR);
    }

    if ((opening = parenStack.pop())) {
      throw new LexerError(new SourceSpan(opening.sourceSpan.startLineno, opening.sourceSpan.startColno, opening.sourceSpan.startLineno, opening.sourceSpan.startColno + 1), EXPECTED_CLOSING_PAREN_ERR(opening.text));
    }

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
