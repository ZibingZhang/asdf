/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
type CodeMirror = any;
declare let CodeMirror: CodeMirror;

type SExpr = {
  ch: string,
  col: number,
  parent: SExpr | null,
  exprCounter: number,
  firstChildCol: number | null,
  secondChildCol: number | null
}

type State = {
  tokenize: (stream: any, state: State) => string | null,
  sexpr: SExpr | null
}

(function(mod) {
  // Plain browser env
  {mod(CodeMirror);}
})(function(CodeMirror: CodeMirror) {
  "use strict";

  CodeMirror.defineMode("racket", function(_config: any) {
    const untilDelimiter = /^[^\s"'([{)\]};`,]*/;
    const openBrackets = "([{";
    const closeBrackets = ")]}";
    const booleanLiteral = /^(T|t|true|F|f|false)$/;
    const specialForm = /^(and|check-error|check-expect|check-member-of|check-random|check-range|check-satisfied|check-within|cond|define|define-struct|else|if|lambda|letrec|let\*|let|local|or|quasiquote|quote|require|unquote)$/;
    const numLiteral = /^[+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const exactnessNumLiteral = /^[ei][+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const specialCharacter = /^(nul|null|backspace|tab|newline|linefeed|vtab|page|return|space|rubout)$/;
    const placeholder = /^\.{2,6}$/;

    const bracketMap = new Map([
      ["(", ")"],
      ["[", "]"],
      ["{", "}"]
    ]);

    function setChildCol(state: State, col: number) {
      if (state.sexpr === null) return;
      if (state.sexpr.firstChildCol === null) {
        state.sexpr.firstChildCol = col;
      } else if (state.sexpr.secondChildCol === null) {
        state.sexpr.secondChildCol = col;
      }
    }

    function tokenBase(stream: any, state: State) {
      if (stream.eatSpace()) {
        return null;
      }

      if (state.sexpr !== null) {
        state.sexpr.exprCounter++;
      }
      let ch = stream.next();
      let col = stream.column();

      if (openBrackets.includes(ch)) {
        setChildCol(state, col);
        state.sexpr = {
          ch,
          col,
          parent: state.sexpr,
          exprCounter: 0,
          firstChildCol: null,
          secondChildCol: null
        }
        return "bracket";
      } else if (closeBrackets.includes(ch)) {
        if (state.sexpr === null) {
          return "error";
        } else {
          let openingBracket = state.sexpr.ch;
          state.sexpr = state.sexpr.parent;
          if (ch === bracketMap.get(openingBracket)) {
            return "bracket";
          } else {
            return "error";
          }
        }
      } else if (ch === ";") {
        stream.skipToEnd();
        return "comment";
      } else if (ch.match(/^['`,]/)) {
        setChildCol(state, col);
        return "keyword";
      } else if (ch === "\"") {
        state.tokenize = tokenString;
        setChildCol(state, col);
        return "string";
      } else if (ch === "#") {
        if (stream.eol() || stream.peek().match(/^\s/)) {
          setChildCol(state, col);
          return "error";
        } else if (stream.match(/^![/ ]/)) {
          stream.skipToEnd();
          return "comment";
        }

        ch = stream.next();
        if (ch === ";") {
          return "comment";
        } else if (ch === "|") {
          state.tokenize = tokenBlockComment(0);
          return state.tokenize(stream, state);
        } else if (ch === "\\") {
          if (stream.eol()) {
            if (stream.lookAhead(1) === undefined) {
              return "error";
            } else {
              setChildCol(state, col);
              return "character";
            }
          }
          ch = stream.next();
          if (!ch.match(/[a-z]/i)) {
            setChildCol(state, col);
            return "character";
          }
          const characterName = ch + stream.match(/[a-z]*/)[0];
          if (characterName.length === 1 || characterName.match(specialCharacter)) {
            setChildCol(state, col);
            return "character";
          } else {
            setChildCol(state, col);
            return "error";
          }
        }

        const poundName = ch + stream.match(untilDelimiter)[0];
        if (poundName.match(booleanLiteral)) {
          setChildCol(state, col);
          return "boolean";
        } else if (poundName.match(exactnessNumLiteral)) {
          setChildCol(state, col);
          return "number";
        } else {
          setChildCol(state, col);
          return "error";
        }
      }

      const name = ch + stream.match(untilDelimiter);
      if (name.match(specialForm)) {
        setChildCol(state, col);
        return "keyword";
      } else if (name.match(numLiteral)) {
        setChildCol(state, col);
        return "number";
      } else if (name.match(placeholder)) {
        setChildCol(state, col);
        return "placeholder";
      } else {
        setChildCol(state, col);
        return null;
      }
    }

    function tokenBlockComment(depth: number): ((stream: any, state: State) => string | null) {
      return function(stream: any, state: State) {
        const m = stream.match(/^.*?(#\||\|#)/);
        if (!m) {
          stream.skipToEnd();
        } else if (m[1] == "#|") {
          state.tokenize = tokenBlockComment(depth + 1);
        } else if (depth > 0) {
          state.tokenize = tokenBlockComment(depth - 1);
        } else {
          state.tokenize = tokenBase;
        }
        return "comment";
      };
    }

    function tokenString(stream: any, state: State): string | null {
      if (stream.eatSpace()) {
        return null;
      }
      while (!stream.eol()) {
        if (stream.peek() === "\\") {
          state.tokenize = tokenEscapedCharacter;
          return "string";
        }
        const ch = stream.next();
        if (ch === "\"") {
          state.tokenize = tokenBase;
          return "string";
        }
      }
      return "string";
    }

    function tokenEscapedCharacter(stream: any, state: State) {
      stream.next();
      if (stream.eol()) {
        state.tokenize = tokenString;
        return "string";
      }
      const ch = stream.next();
      state.tokenize = tokenString;
      if (ch.match(/[abtnvfre"'\\]/)) {
        return "string";
      } else {
        return "error";
      }
    }

    return {
      startState: function (): State {
        return {
          tokenize: tokenBase,
          sexpr: null
        };
      },

      token: function (stream: any, state: State): string | null {
        const style = state.tokenize(stream, state);
        return style;
      },

      indent: function (state: State, _textAfter: any): number {
        if (state.sexpr === null) {
          return 0;
        } else {
          return (
            state.sexpr.secondChildCol
            || state.sexpr.firstChildCol
            || state.sexpr.col + 1
          );
          // if (state.sexpr.secondChildCol) {

          //   return state.sexpr.secondChildCol
          // }
          // return state.sexpr.col + 1;
        }
      },

      closeBrackets: { pairs: "()[]{}\"\"" },
      lineComment: ";",
      blockCommentStart: "#|",
      blockCommentEnd: "|#"
    };
  });
});
