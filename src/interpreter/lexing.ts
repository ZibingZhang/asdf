import { Stage, StageError, StageOutput } from "./pipeline.js";
import { Token, TokenType } from "./token.js";

export {
  Lexer
};

let LEFT_PAREN_RE = /^[\(\[\{]$/;
let RIGHT_PAREN_RE = /^[\)\]\}]$/;
let QUASI_QUOTE_RE = /^[`,]$/;
let TRUE_LITERAL_RE = /^#(t|true)$/;
let FALSE_LITERAL_RE = /^#(f|false)$/;
let INTEGER_RE = /^[+-]?\d+\.?$/;
let RATIONAL_RE = /^[+-]?\d+\/\d+$/;
let DECIMAL_RE = /^[+-]?\d*\.\d+$/;
let DIV_BY_ZERO_RE = /^[+-]?\d+\/0+/;

let BAD_SYNTAX = (syntax: string) => `read-syntax: bad syntax \`${syntax}\``;
let DIV_BY_ZERO = (number: string) => `read-syntax: division by zero in \`${number}\``;
let EXPECT_COMMENTED_OUT_ELEMENT = "read-syntax: expected a commented-out element for `#;`, but found end-of-file";
let EXPECT_ELEMENT_FOR_QUOTING = (found: string) => `read-syntax: expected an element for quoting \"'\", but found ${found}`;
let ILLEGAL_USE_OF_PERIOD = "read-syntax: illegal use of `.`";
let QUASI_QUOTE_UNSUPPORTED_ERR = "read-syntax: quasiquotes not supported";
let UNCLOSED_STRING_ERR = "read-syntax: expected a closing `\"`";

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
  position: number = 0;
  input: string = "";
  isAtEnd: boolean = false;

  run(input: StageOutput): StageOutput {
    this.position = 0;
    this.input = input.output;
    this.isAtEnd = this.input.length === 0;

    let tokens: Token[] = [];
    let state = State.INIT;
    let text = "";
    let lineno = 0;
    let colno = 0;

    let blockCommentDepth = 0;
    let expectingElementToQuote = false;

    let addToken = (lineno: number, colno: number, type: TokenType, text: string) => {
      tokens.push(new Token(lineno, colno, type, text));
      text = "";
      expectingElementToQuote = false;
    };
    let addNameToken = (lineno: number, colno: number, text: string): StageOutput | undefined => {
      if (text.match(INTEGER_RE)) {
        addToken(lineno, colno, TokenType.INTEGER, text);
      } else if (text.match(RATIONAL_RE)) {
        if (text.match(DIV_BY_ZERO_RE)) {
          return this.error(lineno, colno, text, DIV_BY_ZERO(text));
        } else {
          addToken(lineno, colno, TokenType.RATIONAL, text);
        }
      } else if (text.match(DECIMAL_RE)) {
        addToken(lineno, colno, TokenType.DECIMAL, text);
      } else {
        addToken(lineno, colno, TokenType.NAME, text);
      }
    }

    while (!this.isAtEnd) {
      let ch = this.next();

      switch (state) {
        case State.INIT: {
          if (ch.match(QUASI_QUOTE_RE)) {
            return this.error(lineno, colno, ch, QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            // skip
          } else if (ch.match(LEFT_PAREN_RE)) {
            addToken(lineno, colno, TokenType.LEFT_PAREN, ch);
          } else if (ch.match(RIGHT_PAREN_RE)) {
            addToken(lineno, colno, TokenType.RIGHT_PAREN, ch);
          } else if (ch === "\"") {
            text = ch;
            state = State.STRING;
          } else if (ch === "#") {
            text = ch;
            state = State.POUND;
          } else if (ch === "'") {
            addToken(lineno, colno, TokenType.QUOTE, ch);
            state = State.QUOTE;
          } else if (ch === ";") {
            state = State.LINE_COMMENT;
          } else {
            text = ch;
            state = State.NAME;
          }
          break;
        }

        case State.BLOCK_COMMENT: {
          if (ch === '#') {
            state = State.BLOCK_COMMENT_POUND;
          } else if (ch === '|') {
            state = State.BLOCK_COMMENT_PIPE;
          }
          break;
        }

        case State.BLOCK_COMMENT_PIPE: {
          if (ch === '#') {
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
          if (ch === '|') {
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
            if (text === ".") { return this.error(lineno, colno, text, ILLEGAL_USE_OF_PERIOD); }
            let error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            state = State.INIT;
          } else if (ch.match(LEFT_PAREN_RE)) {
            if (text === ".") { return this.error(lineno, colno, text, ILLEGAL_USE_OF_PERIOD); }
            let error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            addToken(lineno, colno + 1, TokenType.LEFT_PAREN, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            if (text === ".") { return this.error(lineno, colno, text, ILLEGAL_USE_OF_PERIOD); }
            let error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            addToken(lineno, colno + 1, TokenType.RIGHT_PAREN, ch);
            state = State.INIT;
          } else if (ch === "\"") {
            if (text === ".") { return this.error(lineno, colno, text, ILLEGAL_USE_OF_PERIOD); }
            let error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            text = ch;
            state = State.STRING;
          } else if (ch === "'") {
            if (text === ".") { return this.error(lineno, colno, text, ILLEGAL_USE_OF_PERIOD); }
            let error = addNameToken(lineno, colno, text);
            if (error) { return error; }
            addToken(lineno, colno + 1, TokenType.QUOTE, ch);
            state = State.QUOTE;
          } else {
            text += ch;
          }
          break;
        }

        case State.POUND: {
          // if statements can probably be avoided by peeking
          if (text === "#" && ch === ";") {
            // turn into flag to ignore next sexpr
            addToken(lineno, colno, TokenType.SEXPR_COMMENT, text + ch);
            state = State.INIT;
            continue;
          }
          if (text === "#" && ch === '|') {
            blockCommentDepth = 0;
            state = State.BLOCK_COMMENT;
            continue;
          }

          if (ch.match(QUASI_QUOTE_RE)) {
            return this.error(lineno, colno, ch, QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX(text));
            }
            state = State.INIT;
          } else if (ch.match(LEFT_PAREN_RE)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX(text));
            }
            addToken(lineno, colno + 1, TokenType.LEFT_PAREN, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX(text));
            }
            addToken(lineno, colno + 1, TokenType.RIGHT_PAREN, ch);
            state = State.INIT;
          } else if (ch === "\"") {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX(text));
            }
            text = ch;
            state = State.STRING;
          } else if (ch === "'") {
            if (text.match(TRUE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.TRUE, text);
            } else if (text.match(FALSE_LITERAL_RE)) {
              addToken(lineno, colno, TokenType.FALSE, text);
            } else {
              return this.error(lineno, colno, text, BAD_SYNTAX(text));
            }
            addToken(lineno, colno + 1, TokenType.QUOTE, ch);
            state = State.QUOTE;
          } else {
            text += ch;
          }
          break;
        }

        case State.QUOTE: {
          if (ch.match(QUASI_QUOTE_RE)) {
            return this.error(lineno, colno, ch, QUASI_QUOTE_UNSUPPORTED_ERR);
          } else if (ch.match(/\s/)) {
            // skip
          } else if (ch.match(LEFT_PAREN_RE)) {
            addToken(lineno, colno, TokenType.LEFT_PAREN, ch);
            state = State.INIT;
          } else if (ch.match(RIGHT_PAREN_RE)) {
            return this.error(lineno, colno, ch, EXPECT_ELEMENT_FOR_QUOTING(ch));
          } else if (ch === "\"") {
            text = ch;
            state = State.STRING;
          } else if (ch === "#") {
            text = ch;
            expectingElementToQuote = true;
            state = State.POUND;
          } else if (ch === "'") {
            addToken(lineno, colno, TokenType.QUOTE, ch);
          } else if (ch === ";") {
            expectingElementToQuote = true;
            state = State.LINE_COMMENT;
          } else {
            text = ch;
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
        addToken(lineno, colno, TokenType.NAME, text);
        break;
      }

      case State.POUND: {
        if (text.match(TRUE_LITERAL_RE)) {
          addToken(lineno, colno, TokenType.TRUE, text);
        } else if (text.match(FALSE_LITERAL_RE)) {
          addToken(lineno, colno, TokenType.FALSE, text);
        } else if (text.match(/#;(.*;.*)?/)) {
          return this.error(lineno, colno, text, EXPECT_COMMENTED_OUT_ELEMENT);
        } else {
          return this.error(lineno, colno, text, BAD_SYNTAX(text));
        }
        break;
      }

      case State.QUOTE: {
        return this.error(lineno, colno, text, EXPECT_ELEMENT_FOR_QUOTING('end-of-file'));
      }

      case State.STRING: {
        return this.error(lineno, colno, text, UNCLOSED_STRING_ERR);
      }
    }

    if (expectingElementToQuote) {
      return this.error(lineno, colno, text, EXPECT_ELEMENT_FOR_QUOTING('end-of-file'));
    }

    for (let token of tokens) {
      console.log(token);
    }

    return new StageOutput(tokens);
  }

  // could probably define in the above method and do away with lineno and colno params
  error(lineno: number, colno: number, text: string, msg: string): StageOutput {
    return new StageOutput(null, [new StageError(lineno, colno, text, msg)]);
  }

  next(): string {
    this.position++;
    this.checkAtEnd();
    return this.input[this.position - 1];
  }

  checkAtEnd() {
    if (this.position == this.input.length) { this.isAtEnd = true; }
  }
}
