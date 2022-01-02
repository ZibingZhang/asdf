import { Stage, StageError, StageOutput } from "./pipeline.js";
import { AtomSExpr, ListSExpr, SExpr } from "./sexpr.js";
import { Token, TokenType } from "./token.js";

export {
  Lexer
};

const LEFT_PAREN_RE = /^[([{]$/;
const RIGHT_PAREN_RE = /^[)\]}]$/;
const QUASI_QUOTE_RE = /^[`,]$/;
const TRUE_LITERAL_RE = /^#(t|true)$/;
const FALSE_LITERAL_RE = /^#(f|false)$/;
const INTEGER_RE = /^[+-]?\d+\.?$/;
const RATIONAL_RE = /^[+-]?\d+\/\d+$/;
const DECIMAL_RE = /^[+-]?\d*\.\d+$/;
const DIV_BY_ZERO_RE = /^[+-]?\d+\/0+$/;

const BAD_SYNTAX_ERR = (syntax: string) => `read-syntax: bad syntax \`${syntax}\``;
const DIV_BY_ZERO_ERR = (number: string) => `read-syntax: division by zero in \`${number}\``;
const EXPECT_CLOSING_PAREN_ERR = (opening: string) => {
  if (opening === "(") {
    return "read-syntax: expected a `)` to close preceding `(`";
  } else if (opening === "[") {
    return "read-syntax: expected a `]` to close preceding `[`";
  } else {
    return "read-syntax: expected a `}` to close preceding `{`";
  }
};
const EXPECT_COMMENTED_OUT_ELEMENT_ERR = "read-syntax: expected a commented-out element for `#;`, but found end-of-file";
const EXPECT_CORRECT_CLOSING_PAREN_ERR = (opening: string | undefined, found: string): string => {
  if (opening === "(") {
    return `read-syntax: expected \`)\` to close preceding \`(\`, found instead \`${found}\``;
  } else if (opening === "[") {
    return `read-syntax: expected \`]\` to close preceding \`[\`, found instead \`${found}\``;
  } else {
    return `read-syntax: expected \`}\` to close preceding \`{\`, found instead \`${found}\``;
  }
};
const EXPECT_ELEMENT_FOR_QUOTING_ERR = (found: string) => `read-syntax: expected an element for quoting "'", but found ${found}`;
const ILLEGAL_USE_OF_DOT_ERR = "read-syntax: illegal use of `.`";
const NESTED_QUOTES_UNSUPPORTED_ERR = "read-syntax: nested quotes not supported";
const QUASI_QUOTE_UNSUPPORTED_ERR = "read-syntax: quasiquotes not supported";
const UNCLOSED_STRING_ERR = "read-syntax: expected a closing `\"`";
const UNEXPECTED_ERR = (found: string) => `read-syntax: unexpected \`${found}\``;

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
  position = 0;
  input = "";
  isAtEnd = false;

  run(input: StageOutput): StageOutput {
    this.position = 0;
    this.input = input.output;
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
    let sexprComment = new Token(-1, -1, TokenType.SEXPR_COMMENT, "#;");
    let expectingSExprToComment = false;

    const addToken = (lineno: number, colno: number, type: TokenType, text: string) => {
      let sexpr: SExpr = new AtomSExpr(new Token(lineno, colno, type, text));
      if (expectingSExprToComment) {
        expectingSExprToComment = false;
      } else {
        if (expectingElementToQuote) {
          sexpr = new ListSExpr([new Token(-1, -1, TokenType.NAME, "quote"), sexpr]);
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
    const addNameToken = (lineno: number, colno: number, text: string): StageOutput | undefined => {
      if (text === ".") {
        return this.error(lineno, colno, text, ILLEGAL_USE_OF_DOT_ERR);
      } else if (text === "...") {
        addToken(lineno, colno, TokenType.PLACEHOLDER, text);
      } else if (text.match(INTEGER_RE)) {
        addToken(lineno, colno, TokenType.INTEGER, text);
      } else if (text.match(RATIONAL_RE)) {
        if (text.match(DIV_BY_ZERO_RE)) {
          return this.error(lineno, colno, text, DIV_BY_ZERO_ERR(text));
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
      parenStack.push(new Token(lineno, colno, TokenType.LEFT_PAREN, paren));
      text = "";
    };
    const addRightParenToken = (lineno: number, colno: number, paren: string): StageOutput | undefined => {
      if (parenStack.length === 0) {
        return this.error(lineno, colno, paren, UNEXPECTED_ERR(paren));
      } else if (!this.matches(opening = parenStack.pop()?.text, paren)) {
        return this.error(lineno, colno, paren, EXPECT_CORRECT_CLOSING_PAREN_ERR(opening, paren));
      } else {
        let sexpr: SExpr = new ListSExpr(sexprStack.pop() || []);
        if (expectingSExprToComment) {
          expectingSExprToComment = false;
        } else {
          if (expectingElementToQuote) {
            sexpr = new ListSExpr([new Token(-1, -1, TokenType.NAME, "quote"), sexpr]);
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
            return this.error(lineno, colno, ch, QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            // skip
          } else if (ch.match(LEFT_PAREN_RE)) {
            addLeftParenToken(lineno, colno, ch);
          } else if (ch.match(RIGHT_PAREN_RE)) {
            const error = addRightParenToken(lineno, colno, ch);
            if (error) { return error; }
          } else if (ch === "\"") {
            state = State.STRING;
          } else if (ch === "#") {
            if (this.match(";")) {
              expectingSExprToComment = true;
              sexprComment = new Token(lineno, colno, TokenType.SEXPR_COMMENT, text + ch);
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
              return this.error(lineno, colno, text, NESTED_QUOTES_UNSUPPORTED_ERR);
            }
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
            return this.error(lineno, colno, ch, QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            const error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            state = State.INIT;
          } else if (ch.match(LEFT_PAREN_RE)) {
            const error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            addLeftParenToken(lineno, colno + 1, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            let error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            error = addRightParenToken(lineno, colno + 1, ch);
            if (error) { return error; }
            state = State.INIT;
          } else if (ch === "\"") {
            const error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            text = ch;
            state = State.STRING;
          } else if (ch === "'") {
            const error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            state = State.QUOTE;
          } else {
            text += ch;
          }
          break;
        }

        case State.POUND: {
          if (ch.match(QUASI_QUOTE_RE)) {
            return this.error(lineno, colno, ch, QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX_ERR(text));
            }
            state = State.INIT;
          } else if (ch.match(LEFT_PAREN_RE)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX_ERR(text));
            }
            addLeftParenToken(lineno, colno + 1, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX_ERR(text));
            }
            const error = addRightParenToken(lineno, colno, ch);
            if (error) { return error; }
            state = State.INIT;
          } else if (ch === "\"") {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX_ERR(text));
            }
            text = ch;
            state = State.STRING;
          } else if (ch === "'") {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX_ERR(text));
            }
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
            return this.error(lineno, colno, ch, QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            // skip
          } else if (ch.match(LEFT_PAREN_RE)) {
            addLeftParenToken(lineno, colno, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            return this.error(lineno, colno, ch, EXPECT_ELEMENT_FOR_QUOTING_ERR(ch));
          } else if (ch === "\"") {
            state = State.STRING;
          } else if (ch === "#") {
            if (this.match(";")) {
              // turn into flag to ignore next sexpr
              addToken(lineno, colno, TokenType.SEXPR_COMMENT, text + ch);
            } else if (this.match("|")) {
              blockCommentDepth = 0;
              state = State.BLOCK_COMMENT;
            } else if (this.peek(2).match(/!\/?/)) {
              state = State.LINE_COMMENT;
            } else {
              state = State.POUND;
            }
          } else if (ch === "'") {
            return this.error(lineno, colno, text, NESTED_QUOTES_UNSUPPORTED_ERR);
          } else if (ch === ";") {
            state = State.LINE_COMMENT;
          } else {
            state = State.NAME;
          }
          break;
        }

        case State.STRING: {
          if (ch === "\"") {
            addToken(lineno, colno, TokenType.STRING, text + ch);
            state = State.INIT;
          } else if (ch === "\n") {
            return this.error(lineno, colno, text, UNCLOSED_STRING_ERR);
          }
          text += ch;
          break;
        }
      }

      if (ch === "\n") { lineno++; colno = 0; } else { colno++; }
    }

    switch (state) {
      case State.NAME: {
        const error = addNameToken(lineno, colno, text);
        if (error) { return error; }
        break;
      }

      case State.POUND: {
        if (text.match(TRUE_LITERAL_RE)) {
          addToken(lineno, colno, TokenType.TRUE, text);
        } else if (text.match(FALSE_LITERAL_RE)) {
          addToken(lineno, colno, TokenType.FALSE, text);
        } else {
          return this.error(lineno, colno, text, BAD_SYNTAX_ERR(text));
        }
        break;
      }

      case State.QUOTE: {
        return this.error(lineno, colno, text, EXPECT_ELEMENT_FOR_QUOTING_ERR("end-of-file"));
      }

      case State.STRING: {
        return this.error(lineno, colno, text, UNCLOSED_STRING_ERR);
      }
    }

    if (expectingElementToQuote) {
      return this.error(lineno, colno, text, EXPECT_ELEMENT_FOR_QUOTING_ERR("end-of-file"));
    }

    if (expectingSExprToComment) {
      return this.error(sexprComment.lineno, sexprComment.colno, "#;", EXPECT_COMMENTED_OUT_ELEMENT_ERR);
    }

    if ((opening = parenStack.pop())) {
      return this.error(lineno, colno, opening.text, EXPECT_CLOSING_PAREN_ERR(opening.text));
    }

    for (const sexpr of sexprs) {
      console.log(JSON.stringify(sexpr, null, 2));
    }

    return new StageOutput(sexprs);
  }

  matches(left: string | undefined, right: string): boolean {
    switch (left) {
      case "(": return right === ")";
      case "[": return right === "]";
      case "{": return right === "}";
      default: return false;
    }
  }

  error(lineno: number, colno: number, text: string, msg: string): StageOutput {
    return new StageOutput(null, [new StageError(lineno, colno, text, msg)]);
  }

  next(): string {
    this.position++;
    this.checkAtEnd();
    return this.input[this.position - 1];
  }

  peek(n = 1): string {
    return this.input.slice(this.position, Math.min(this.position + n, this.input.length));
  }

  match(s: string): boolean {
    if (this.peek(s.length) === s) {
      this.position += s.length;
      return true;
    } else {
      return false;
    }
  }

  checkAtEnd() {
    if (this.position == this.input.length) { this.isAtEnd = true; }
  }
}
