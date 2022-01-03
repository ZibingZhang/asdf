import { ASTNode, AtomNode, FunAppNode } from "./ast.js";
import { prettyPrint } from "./dev-utils.js";
import { Stage, StageError, StageOutput } from "./pipeline.js";
import { Program } from "./program.js";
import { isAtomSExpr, isListSExpr, SExpr } from "./sexpr.js";
import { TokenType } from "./token.js";
import { RBool, RNum, RString } from "./value.js";

export {
  WellFormedSyntax,
  WellFormedProgram
};

class WellFormedError extends Error {
  constructor(readonly stageError: StageError) {
    super(stageError.msg);
  }
}

class WellFormedSyntax implements Stage {
  run(input: StageOutput): StageOutput {
    try {
      return new StageOutput(this.runHelper(input.output));
    } catch (e) {
      if (e instanceof WellFormedError) {
        return new StageOutput(null, [e.stageError]);
      } else {
        throw e;
      }
    }
  }

  private runHelper(sexprs: SExpr[]): Program {
    const asts: ASTNode[] = [];
    for (const sexpr of sexprs) {
      asts.push(this.toNode(sexpr));
    }

    for (const ast of asts) {
      prettyPrint(ast);
    }

    return new Program(asts);
  }

  private toNode(sexpr: SExpr): ASTNode {
    if (isAtomSExpr(sexpr)) {
      switch (sexpr.token.type) {
        case TokenType.TRUE: {
          return new AtomNode(new RBool(true));
        }
        case TokenType.FALSE: {
          return new AtomNode(new RBool(false));
        }
        case TokenType.INTEGER: {
          return new AtomNode(new RNum(BigInt(parseInt(sexpr.token.text)), 1n));
        }
        case TokenType.RATIONAL: {
          const parts = sexpr.token.text.split("/");
          return new AtomNode(new RNum(BigInt(parseInt(parts[0])), BigInt(parseInt(parts[1]))));
        }
        case TokenType.DECIMAL: {
          const parts = sexpr.token.text.split(".");
          const scalar = 10n ** BigInt(parts[1].length);
          return new AtomNode(new RNum(BigInt(parseInt(parts[0])) * scalar + BigInt(parseInt(parts[1])), scalar));
        }
        case TokenType.STRING: {
          return new AtomNode(new RString(sexpr.token.text));
        }
        default:
          throw "something?";
      }
    } else if (isListSExpr(sexpr)) {
      const name = sexpr.tokens.shift();
      if (!name) {
        throw "some other sorta error";
      } else if (isAtomSExpr(name)) {
        return new FunAppNode(name.token.text, sexpr.tokens.map(token => this.toNode(token)));
      } else {
        throw "some sorta error";
      }
    } else {
      throw "Illegal state";
    }
  }
}

class WellFormedProgram implements Stage {
  run(input: StageOutput): StageOutput {
    try {
      return new StageOutput(this.runHelper(input.output));
    } catch (e) {
      if (e instanceof WellFormedError) {
        return new StageOutput(null, [e.stageError]);
      } else {
        throw e;
      }
    }
  }

  private runHelper(program: Program): Program {
    return program;
  }
}
