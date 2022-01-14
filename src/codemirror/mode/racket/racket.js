(function(mod) {
  // Plain browser env
  {mod(CodeMirror);}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("racket", function(_config) {
    const untilDelimiter = /^[^\s"'([{)\]};`,]*/;
    const openBrackets = "([{";
    const closeBrackets = ")]}";
    const booleanLiteral = /^(T|t|true|F|f|false)$/;
    const specialForm = /^(and|check-error|check-expect|check-member-of|check-random|check-range|check-satisfied|check-within|cond|define|define-struct|else|if|lambda|or|quote|require)$/;
    const numLiteral = /^[+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const exactnessNumLiteral = /^[ei]?[+-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;
    const placeholder = /^\.{2,6}$/;

    function tokenBase(stream, state) {
      if (stream.eatSpace()) {
        return null;
      }

      let ch = stream.next();

      if (openBrackets.includes(ch) || closeBrackets.includes(ch)) {
        return "bracket";
      } else if (ch === ";") {
        stream.skipToEnd();
        return "comment";
      } else if (ch.match(/^['`]/) && stream.match(specialForm, false)) {
        state.ignoreNextKeyword = true;
        return "keyword";
      } else if (ch.match(/^['`,]/)) {
        return "keyword";
      } else if (ch === "\"") {
        state.tokenize = tokenString;
        return "string";
      } else if (ch === "#") {
        if (stream.match(exactnessNumLiteral)) {
          return "number";
        } else if (stream.eol() || stream.peek().match(/^\s/)) {
          return "error";
        } else if (stream.match(/^![/ ]/)) {
          stream.skipToEnd();
          return "comment";
        }

        ch = stream.next();
        if (ch === ";") {
          return "comment";
        } else if (ch === "|") {
          state.tokenize = tokenComment(0);
          return state.tokenize(stream, state);
        } else if (ch === "\\") {
          const characterName = stream.match(untilDelimiter)[0];
          if (characterName.match(/^(.|nul|null|backspace|tab|newline|linefeed|vtab|page|return|space|rubout)$/)) {
            return "character";
          } else {
            return "error";
          }
        }

        const poundName = ch + stream.match(untilDelimiter)[0];
        if (poundName.match(booleanLiteral)) {
          return "boolean";
        } else {
          return "error";
        }
      }

      const name = ch + stream.match(untilDelimiter);
      if (name.match(specialForm)) {
        if (state.ignoreNextKeyword) {
          state.ignoreNextKeyword = false;
          return null;
        } else {
          return "keyword";
        }
      } else if (name.match(numLiteral)) {
        return "number";
      } else if (name.match(placeholder)) {
        return "placeholder";
      } else {
        return null;
      }
    }

    function tokenComment(depth) {
      return function(stream, state) {
        const m = stream.match(/^.*?(#\||\|#)/);
        if (!m) {
          stream.skipToEnd();
        } else if (m[1] == "#|") {
          state.tokenize = tokenComment(depth + 1);
        } else if (depth > 0) {
          state.tokenize = tokenComment(depth - 1);
        } else {
          state.tokenize = tokenBase;
        }
        return "comment";
      };
    }

    function tokenString(stream, state) {
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

    function tokenEscapedCharacter(stream, state) {
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
      startState: function () {
        return { tokenize: tokenBase };
      },

      token: function (stream, state) {
        const style = state.tokenize(stream, state);
        return style;
      },

      indent: function (_state, _textAfter) {
        return 0;
      },

      closeBrackets: { pairs: "()[]{}\"\"" },
      lineComment: ";",
      blockCommentStart: "#|",
      blockCommentEnd: "|#"
    };
  });
});
