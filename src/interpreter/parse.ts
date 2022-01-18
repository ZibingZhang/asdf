import {
  ASTNode,
  AndNode,
  AtomNode,
  CheckErrorNode,
  CheckMemberOfNode,
  CheckNode,
  CheckRangeNode,
  CheckSatisfiedNode,
  CheckWithinNode,
  CondNode,
  DefnNode,
  DefnStructNode,
  DefnVarNode,
  EllipsisFunAppNode,
  EllipsisNode,
  FunAppNode,
  IfNode,
  LambdaNode,
  LetNode,
  LocalNode,
  OrNode,
  RequireNode,
  VarNode,
  isDefnNode,
  isLambdaNode,
  isVarNode
} from "./ast";
import {
  AtomSExpr,
  ListSExpr,
  SExpr,
  isAtomSExpr,
  isListSExpr
} from "./sexpr";
import {
  CN_ELSE_NOT_LAST_CLAUSE_ERR,
  CN_EXPECTED_TWO_PART_CLAUSE_ERR,
  DF_DUPLICATE_VARIABLE_ERR,
  DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
  DF_EXPECTED_EXPR_ERR,
  DF_EXPECTED_FUNCTION_BODY_ERR,
  DF_EXPECTED_FUNCTION_NAME_ERR,
  DF_EXPECTED_VARIABLE_ERR,
  DF_EXPECTED_VAR_OR_FUN_NAME_ERR,
  DF_TOO_MANY_EXPRS_ERR,
  DF_TOO_MANY_FUNCTION_BODIES_ERR,
  DS_DUPLICATE_FIELD_NAME,
  DS_EXPECTED_FIELD_NAMES_ERR,
  DS_EXPECTED_FIELD_NAME_ERR,
  DS_EXPECTED_STRUCT_NAME_ERR,
  DS_EXTRA_PARTS_ERR,
  ES_NOT_IN_COND_ERR,
  FA_ARITY_ERR,
  FA_MIN_ARITY_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  IF_EXPECTED_THREE_PARTS_ERR,
  LM_DUPLICATE_VARIABLE_ERR,
  LM_EXPECTED_EXPRESSION_ERR,
  LM_EXPECTED_FORMAT_ERR,
  LM_EXPECTED_VARIABLE_ERR,
  LM_NOT_FUNCTION_DEFINITION_ERR,
  LM_NO_VARIABLES_ERR,
  LO_EXPECTED_DEFINITIONS_ERR,
  LO_EXPECTED_DEFINITION_ERR,
  LO_EXPECTED_EXPRESSION_ERR,
  LO_EXPECTED_ONE_EXPRESSION_ERR,
  LT_BINDING_EXPECTED_EXPRESSION_ERR,
  LT_BINDING_EXPECTED_ONE_EXPRESSION_ERR,
  LT_BINDING_EXPECTED_VARIABLE_ERR,
  LT_EXPECTED_BINDINGS_ERR,
  LT_EXPECTED_EXPRESSION_ERR,
  LT_EXPECTED_ONE_EXPRESSION_ERR,
  LT_EXPECTED_TWO_PART_BINDING_ERR,
  QU_EXPECTED_EXPRESSION_ERR,
  QU_EXPECTED_ONE_EXPRESSION_ERR,
  QU_EXPECTED_POST_QUOTE_ERR,
  RQ_EXPECTED_MODULE_NAME_ERR,
  SX_EXPECTED_OPEN_PAREN_ERR
} from "./error";
import {
  RCharacter,
  RExactReal,
  RPrimTestFunConfig,
  RString,
  RSymbol,
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE
} from "./rvalue";
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
  Global
} from "./global";
import {
  Keyword
} from "./keyword";
import {
  Program
} from "./program";
import {
  SETTINGS
} from "./settings";

export {
  ParseSExpr
};

class ParseSExpr implements Stage<SExpr[], Program> {
  private global = new Global();
  private inFunDef = false;

  run(input: StageOutput<SExpr[]>): StageOutput<Program> {
    this.inFunDef = false;
    try {
      return new StageOutput(this.processSExprs(input.output));
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(<Program><unknown>null, [e]);
      } else {
        throw e;
      }
    }
  }

  private processSExprs(sexprs: SExpr[]): Program {
    const defns: DefnNode[] = [];
    const nodes: ASTNode[] = [];
    for (const sexpr of sexprs) {
      const node = this.toNode(sexpr);
      if (isDefnNode(node)) { defns.push(node); }
      nodes.push(node);
    }
    return new Program(defns, nodes);
  }

  private toNode(sexpr: SExpr): ASTNode {
    if (isAtomSExpr(sexpr)) {
      switch (sexpr.token.type) {
        case TokenType.True: {
          return new AtomNode(
            R_TRUE,
            sexpr.sourceSpan
          );
        }
        case TokenType.False: {
          return new AtomNode(
            R_FALSE,
            sexpr.sourceSpan
          );
        }
        case TokenType.Integer: {
          return new AtomNode(
            new RExactReal(BigInt(sexpr.token.text.replace(".", ""))),
            sexpr.sourceSpan
          );
        }
        case TokenType.Rational: {
          const parts = sexpr.token.text.split("/");
          return new AtomNode(
            new RExactReal(BigInt(parts[0]), BigInt(parts[1])),
            sexpr.sourceSpan
          );
        }
        case TokenType.Decimal: {
          const [whole, decimal] = sexpr.token.text.split(".");
          const scalar = 10n ** BigInt(decimal.length);
          const wholeBigInt = BigInt(whole);
          if (wholeBigInt < 0) {
            return new AtomNode(
              new RExactReal(wholeBigInt * scalar - BigInt(decimal), scalar),
              sexpr.sourceSpan
            );
          } else {
            return new AtomNode(
              new RExactReal(wholeBigInt * scalar + BigInt(decimal), scalar),
              sexpr.sourceSpan
            );
          }
        }
        case TokenType.Character: {
          return new AtomNode(
            new RCharacter(sexpr.token.text.slice(2)),
            sexpr.sourceSpan
          );
        }
        case TokenType.String: {
          return new AtomNode(
            new RString(sexpr.token.text.slice(1, -1)),
            sexpr.sourceSpan
          );
        }
        case TokenType.Name: {
          return new VarNode(sexpr.token.text, sexpr.sourceSpan);
        }
        case TokenType.Keyword: {
          switch (sexpr.token.text) {
            case Keyword.Else:
              throw new StageError(
                ES_NOT_IN_COND_ERR,
                sexpr.sourceSpan
              );
            default:
              throw new StageError(
                SX_EXPECTED_OPEN_PAREN_ERR(sexpr.token.text),
                sexpr.sourceSpan
              );
          }
        }
        case TokenType.Placeholder: {
          return new EllipsisNode(sexpr, sexpr.sourceSpan);
        }
        default:
          throw "illegal state: unhandled token type";
      }
    } else {
      const leadingSExpr = sexpr.subSExprs[0];
      if (!leadingSExpr) {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR(),
          sexpr.sourceSpan
        );
      }
      if (isListSExpr(leadingSExpr)) {
        if (SETTINGS.higherOrderFunctions) {
          return new FunAppNode(
            this.toNode(leadingSExpr),
            sexpr.subSExprs.slice(1).map(sexpr => this.toNode(sexpr)),
            sexpr.sourceSpan
          );
        } else {
          throw new StageError(
            FC_EXPECTED_FUNCTION_ERR(leadingSExpr),
            leadingSExpr.sourceSpan
          );
        }
      }
      switch (leadingSExpr.token.type) {
        case TokenType.Name: {
          return new FunAppNode(
            this.toNode(leadingSExpr),
            sexpr.subSExprs.slice(1).map(sexpr => this.toNode(sexpr)),
            sexpr.sourceSpan
          );
        }
        case TokenType.Placeholder: {
          return new EllipsisFunAppNode(
            leadingSExpr,
            sexpr.sourceSpan
          );
        }
        case TokenType.Keyword: {
          switch (leadingSExpr.token.text) {
            case Keyword.And: {
              return this.toAndNode(sexpr);
            }
            case Keyword.CheckError:
            case Keyword.CheckExpect:
            case Keyword.CheckMemberOf:
            case Keyword.CheckRandom:
            case Keyword.CheckRange:
            case Keyword.CheckSatisfied:
            case Keyword.CheckWithin: {
              return this.toCheckNode(leadingSExpr.token.text, sexpr);
            }
            case Keyword.Cond: {
              return this.toCondNode(sexpr);
            }
            case Keyword.Define: {
              return this.toDefnNode(sexpr);
            }
            case Keyword.DefineStruct: {
              return this.toDefnStructNode(sexpr);
            }
            case Keyword.Else: {
              throw new StageError(
                ES_NOT_IN_COND_ERR,
                leadingSExpr.sourceSpan
              );
            }
            case Keyword.If: {
              return this.toIfNode(sexpr);
            }
            case Keyword.Lambda: {
              return this.toLambdaNode(sexpr);
            }
            case Keyword.Letrec:
            case Keyword.Letstar:
            case Keyword.Let: {
              return this.toLetNode(leadingSExpr.token.text, sexpr);
            }
            case Keyword.Local: {
              return this.toLocalNode(sexpr);
            }
            case Keyword.Or: {
              return this.toOrNode(sexpr);
            }
            case Keyword.Quote: {
              return this.toQuoteNode(sexpr, sexpr.subSExprs[1]);
            }
            case Keyword.Require: {
              return this.toRequireNode(sexpr);
            }
            default: {
              throw "illegal state: unhandled keyword";
            }
          }
        }
        default: {
          throw new StageError(
            FC_EXPECTED_FUNCTION_ERR(leadingSExpr),
            leadingSExpr.sourceSpan
          );
        }
      }
    }
  }

  private toAndNode(sexpr: ListSExpr): AndNode {
    // (and ...)
    if (sexpr.subSExprs.length - 1 < 2) {
      throw new StageError(
        FA_MIN_ARITY_ERR(Keyword.And, 2, sexpr.subSExprs.length - 1),
        sexpr.subSExprs[0].sourceSpan
      );
    }
    return new AndNode(
      sexpr.subSExprs.slice(1).map(sexpr => this.toNode(sexpr)),
      sexpr.sourceSpan
    );
  }

  private toCheckNode(checkName: string, sexpr: ListSExpr): CheckNode {
    // (check-... ...)
    const config = <RPrimTestFunConfig>this.global.primitiveTestFunctions.get(checkName);
    if (config.arity && sexpr.subSExprs.length - 1 !== config.arity) {
      throw new StageError(
        FA_ARITY_ERR(checkName, config.arity, sexpr.subSExprs.length - 1),
        sexpr.sourceSpan
      );
    }
    if (config.minArity && sexpr.subSExprs.length - 1 < config.minArity) {
      throw new StageError(
        FA_MIN_ARITY_ERR(checkName, config.minArity, sexpr.subSExprs.length - 1),
        sexpr.sourceSpan
      );
    }
    if (config.maxArity && sexpr.subSExprs.length - 1 > config.maxArity) {
      throw new StageError(
        FA_ARITY_ERR(checkName, config.maxArity, sexpr.subSExprs.length - 1),
        sexpr.sourceSpan
      );
    }
    switch (checkName) {
      case Keyword.CheckError: {
        return new CheckErrorNode(
          sexpr.subSExprs.slice(1).map(sexpr => this.toNode(sexpr)),
          sexpr.sourceSpan
        );
      }
      case Keyword.CheckMemberOf: {
        return new CheckMemberOfNode(
          this.toNode(
            new ListSExpr(
              [
                new AtomSExpr(
                  new Token(TokenType.Name, "member", sexpr.sourceSpan),
                  sexpr.sourceSpan
                ),
                sexpr.subSExprs[1],
                new ListSExpr(
                  [
                    new AtomSExpr(
                      new Token(TokenType.Name, "list", sexpr.sourceSpan),
                      sexpr.sourceSpan
                    ),
                    ...sexpr.subSExprs.slice(2)
                  ],
                  sexpr.sourceSpan
                )
              ],
              sexpr.sourceSpan
            )
          ),
          this.toNode(sexpr.subSExprs[1]),
          sexpr.subSExprs.slice(2).map(sexpr => this.toNode(sexpr)),
          sexpr.sourceSpan
        );
      }
      case Keyword.CheckRange: {
        const testValSExpr = sexpr.subSExprs[1];
        const lowerBoundValSExpr = sexpr.subSExprs[2];
        const upperBoundValSExpr = sexpr.subSExprs[3];
        return new CheckRangeNode(
          this.toNode(
            new ListSExpr(
              [
                new AtomSExpr(
                  new Token(TokenType.Keyword, Keyword.And, sexpr.sourceSpan),
                  sexpr.sourceSpan
                ),
                new ListSExpr(
                  [
                    new AtomSExpr(
                      new Token(TokenType.Name, "<=", sexpr.sourceSpan),
                      sexpr.sourceSpan
                    ),
                    lowerBoundValSExpr,
                    testValSExpr
                  ],
                  sexpr.sourceSpan
                ),
                new ListSExpr(
                  [
                    new AtomSExpr(
                      new Token(TokenType.Name, "<=", sexpr.sourceSpan),
                      sexpr.sourceSpan
                    ),
                    testValSExpr,
                    upperBoundValSExpr
                  ],
                  sexpr.sourceSpan
                )
              ],
              sexpr.sourceSpan
            )
          ),
          this.toNode(testValSExpr),
          this.toNode(lowerBoundValSExpr),
          this.toNode(upperBoundValSExpr),
          sexpr.sourceSpan
        );
      }
      case Keyword.CheckSatisfied: {
        return new CheckSatisfiedNode(
          this.toNode(
            new ListSExpr(
              [
                sexpr.subSExprs[2],
                sexpr.subSExprs[1]
              ],
              sexpr.sourceSpan
            )
          ),
          this.toNode(sexpr.subSExprs[1]),
          this.toNode(sexpr.subSExprs[2]),
          sexpr.subSExprs[2].stringify(),
          sexpr.sourceSpan
        );
      }
      case Keyword.CheckWithin: {
        return new CheckWithinNode(
          this.toNode(
            new ListSExpr(
              [
                new AtomSExpr(
                  new Token(TokenType.Name, "equal~?", sexpr.sourceSpan),
                  sexpr.sourceSpan
                ),
                sexpr.subSExprs[1],
                sexpr.subSExprs[2],
                sexpr.subSExprs[3]
              ],
              sexpr.sourceSpan
            )
          ),
          this.toNode(sexpr.subSExprs[1]),
          this.toNode(sexpr.subSExprs[2]),
          this.toNode(sexpr.subSExprs[3]),
          sexpr.sourceSpan
        );
      }
      default: {
        return new CheckNode(
          checkName,
          sexpr.subSExprs.slice(1).map(sexpr => this.toNode(sexpr)),
          sexpr.sourceSpan
        );
      }
    }
  }

  private toCondNode(sexpr: ListSExpr): CondNode {
    // (cond ...)
    if (sexpr.subSExprs.length - 1 === 0) {
      throw new StageError(
        CN_EXPECTED_TWO_PART_CLAUSE_ERR(),
        sexpr.sourceSpan
      );
    }
    const questionAnswerClauses: [ASTNode, ASTNode][] = [];
    for (const [idx, token] of sexpr.subSExprs.slice(1).entries()) {
      if (!isListSExpr(token) || token.subSExprs.length !== 2) {
        throw new StageError(
          CN_EXPECTED_TWO_PART_CLAUSE_ERR(token),
          token.sourceSpan
        );
      }
      const questionSExpr = token.subSExprs[0];
      if (isAtomSExpr(questionSExpr)
        && questionSExpr.token.type === TokenType.Keyword
        && questionSExpr.token.text === Keyword.Else
      ) {
        if (idx < sexpr.subSExprs.length - 2) {
          throw new StageError(
            CN_ELSE_NOT_LAST_CLAUSE_ERR,
            token.sourceSpan
          );
        }
        questionAnswerClauses.push([new AtomNode(R_TRUE, questionSExpr.sourceSpan), this.toNode(token.subSExprs[1])]);
      } else {
        questionAnswerClauses.push([this.toNode(questionSExpr), this.toNode(token.subSExprs[1])]);
      }
    }
    return new CondNode(questionAnswerClauses, sexpr.sourceSpan);
  }

  private toDefnNode(sexpr: ListSExpr): DefnNode {
    // (define ...)
    if (sexpr.subSExprs.length - 1 === 0) {
      throw new StageError(
        DF_EXPECTED_VAR_OR_FUN_NAME_ERR(),
        sexpr.sourceSpan
      );
    }
    let name = sexpr.subSExprs[1];
    if (isAtomSExpr(name)) {
      // (define variable-name ...)
      if (name.token.type !== TokenType.Name) {
        throw new StageError(
          DF_EXPECTED_VAR_OR_FUN_NAME_ERR(name),
          name.sourceSpan
        );
      }
      if (sexpr.subSExprs.length - 1 === 1) {
        throw new StageError(
          DF_EXPECTED_EXPR_ERR(name.token.text),
          sexpr.sourceSpan
        );
      }
      if (sexpr.subSExprs.length - 1 > 2) {
        throw new StageError(
          DF_TOO_MANY_EXPRS_ERR(name.token.text, sexpr.subSExprs.length - 3),
          sexpr.subSExprs[3].sourceSpan
        );
      }
      this.inFunDef = true;
      const expr = this.toNode(sexpr.subSExprs[2]);
      if (isLambdaNode(expr)) {
        expr.name = name.token.text;
      }
      const node = new DefnVarNode(
        name.token.text,
        name.sourceSpan,
        expr,
        sexpr.sourceSpan
      );
      this.inFunDef = false;
      return node;
    } else {
      // (define (function-name ...) ...)
      const nameAndArgs = name;
      if (nameAndArgs.subSExprs.length === 0) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_NAME_ERR(),
          sexpr.sourceSpan
        );
      }
      name = nameAndArgs.subSExprs[0];
      if (!isAtomSExpr(name) || name.token.type !== TokenType.Name) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_NAME_ERR(name),
          sexpr.sourceSpan
        );
      }
      if (nameAndArgs.subSExprs.length - 1 === 0) {
        throw new StageError(
          DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
          nameAndArgs.sourceSpan
        );
      }
      const params: string[] = [];
      for (const arg of nameAndArgs.subSExprs.slice(1)) {
        if (!isAtomSExpr(arg) || arg.token.type !== TokenType.Name) {
          throw new StageError(
            DF_EXPECTED_VARIABLE_ERR(arg),
            arg.sourceSpan
          );
        }
        if (params.includes(arg.token.text)) {
          throw new StageError(
            DF_DUPLICATE_VARIABLE_ERR(arg.token.text),
            arg.sourceSpan
          );
        }
        params.push(arg.token.text);
      }
      if (sexpr.subSExprs.length - 1 === 1) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_BODY_ERR,
          sexpr.sourceSpan
        );
      }
      if (sexpr.subSExprs.length - 1 > 2) {
        throw new StageError(
          DF_TOO_MANY_FUNCTION_BODIES_ERR(sexpr.subSExprs.length - 3),
          sexpr.subSExprs[3].sourceSpan
        );
      }
      return new DefnVarNode(
        name.token.text,
        name.sourceSpan,
        new LambdaNode(
          name.token.text,
          params,
          this.toNode(sexpr.subSExprs[2]),
          sexpr.subSExprs[2].sourceSpan
        ),
        sexpr.sourceSpan
      );
    }
  }

  private toDefnStructNode(sexpr: ListSExpr): DefnStructNode {
    // (define-struct ...)
    if (sexpr.subSExprs.length - 1 === 0) {
      throw new StageError(
        DS_EXPECTED_STRUCT_NAME_ERR(),
        sexpr.sourceSpan
      );
    }
    const name = sexpr.subSExprs[1];
    if (!isAtomSExpr(name) || name.token.type !== TokenType.Name) {
      throw new StageError(
        DS_EXPECTED_STRUCT_NAME_ERR(name),
        name.sourceSpan
      );
    }
    if (sexpr.subSExprs.length - 1 === 1) {
      throw new StageError(
        DS_EXPECTED_FIELD_NAMES_ERR(),
        sexpr.sourceSpan
      );
    }
    const fieldNamesSExpr = sexpr.subSExprs[2];
    if (!isListSExpr(fieldNamesSExpr)) {
      throw new StageError(
        DS_EXPECTED_FIELD_NAMES_ERR(fieldNamesSExpr),
        fieldNamesSExpr.sourceSpan
      );
    }
    const fieldNames: string[] = [];
    for (const fieldNameSExpr of fieldNamesSExpr.subSExprs) {
      if (
        !isAtomSExpr(fieldNameSExpr)
        || (fieldNameSExpr.token.type !== TokenType.Name && fieldNameSExpr.token.type !== TokenType.Keyword)
      ) {
        throw new StageError(
          DS_EXPECTED_FIELD_NAME_ERR(fieldNameSExpr),
          fieldNameSExpr.sourceSpan
        );
      }
      if (fieldNames.includes(fieldNameSExpr.token.text)) {
        throw new StageError(
          DS_DUPLICATE_FIELD_NAME(fieldNameSExpr.token.text),
          fieldNameSExpr.sourceSpan
        );
      }
      fieldNames.push(fieldNameSExpr.token.text);
    }
    if (sexpr.subSExprs.length - 1 > 2) {
      throw new StageError(
        DS_EXTRA_PARTS_ERR(sexpr.subSExprs.length - 3),
        sexpr.subSExprs[3].sourceSpan
      );
    }
    return new DefnStructNode(
      name.token.text,
      name.sourceSpan,
      fieldNames,
      sexpr.sourceSpan
    );
  }

  private toIfNode(sexpr: ListSExpr): IfNode {
    // (if ...)
    if (sexpr.subSExprs.length - 1 !== 3) {
      throw new StageError(
        IF_EXPECTED_THREE_PARTS_ERR(sexpr.subSExprs.length - 1),
        sexpr.sourceSpan
      );
    }
    return new IfNode(
      this.toNode(sexpr.subSExprs[1]),
      this.toNode(sexpr.subSExprs[2]),
      this.toNode(sexpr.subSExprs[3]),
      sexpr.sourceSpan
    );
  }

  private toLambdaNode(sexpr: ListSExpr): LambdaNode {
    // (lambda ...)
    if (!SETTINGS.syntax.lambdaExpression && !this.inFunDef) {
      throw new StageError(
        LM_NOT_FUNCTION_DEFINITION_ERR,
        sexpr.sourceSpan
      );
    }
    if (sexpr.subSExprs.length - 1 === 0) {
      throw new StageError(
        LM_EXPECTED_FORMAT_ERR(),
        sexpr.sourceSpan
      );
    }
    const variables = sexpr.subSExprs[1];
    if (isAtomSExpr(variables)) {
      throw new StageError(
        LM_EXPECTED_FORMAT_ERR(variables),
        variables.sourceSpan
      );
    }
    if (variables.subSExprs.length === 0) {
      throw new StageError(
        LM_NO_VARIABLES_ERR,
        variables.sourceSpan
      );
    }
    const variableNames: string[] = [];
    for (const variable of variables.subSExprs) {
      if (isListSExpr(variable) || variable.token.type !== TokenType.Name) {
        throw new StageError(
          LM_EXPECTED_VARIABLE_ERR(variable),
          variable.sourceSpan
        );
      }
      if (variableNames.includes(variable.token.text)) {
        throw new StageError(
          LM_DUPLICATE_VARIABLE_ERR(variable.token.text),
          variable.sourceSpan
        );
      }
      variableNames.push(variable.token.text);
    }
    if (sexpr.subSExprs.length - 1 !== 2) {
      throw new StageError(
        LM_EXPECTED_EXPRESSION_ERR(sexpr.subSExprs.length - 1),
        sexpr.sourceSpan
      );
    }
    return new LambdaNode(
      null,
      variableNames,
      this.toNode(sexpr.subSExprs[2]),
      sexpr.sourceSpan
    );
  }

  private toLetNode(letName: string, sexpr: ListSExpr): LetNode {
    // (let... ...)
    if (sexpr.subSExprs.length - 1 === 0) {
      throw new StageError(
        LT_EXPECTED_BINDINGS_ERR(letName),
        sexpr.sourceSpan
      );
    }
    const bindingsSExpr = sexpr.subSExprs[1];
    if (isAtomSExpr(bindingsSExpr)) {
      throw new StageError(
        LT_EXPECTED_BINDINGS_ERR(letName, bindingsSExpr),
        bindingsSExpr.sourceSpan
      );
    }
    const bindings: [VarNode, ASTNode][] = [];
    for (const binding of bindingsSExpr.subSExprs) {
      if (isAtomSExpr(binding) || binding.subSExprs.length === 0) {
        throw new StageError(
          LT_EXPECTED_TWO_PART_BINDING_ERR(letName, binding),
          binding.sourceSpan
        );
      }
      const variable = this.toNode(binding.subSExprs[0]);
      if (!isVarNode(variable)) {
        throw new StageError(
          LT_BINDING_EXPECTED_VARIABLE_ERR(letName, binding.subSExprs[0]),
          variable.sourceSpan
        );
      }
      if (binding.subSExprs.length === 1) {
        throw new StageError(
          LT_BINDING_EXPECTED_EXPRESSION_ERR(letName, variable.name),
          binding.sourceSpan
        );
      }
      if (binding.subSExprs.length > 2) {
        throw new StageError(
          LT_BINDING_EXPECTED_ONE_EXPRESSION_ERR(letName, variable.name, binding.subSExprs.length - 2),
          binding.subSExprs[2].sourceSpan
        );
      }
      bindings.push([variable, this.toNode(binding.subSExprs[1])]);
    }
    if (sexpr.subSExprs.length - 1 === 1) {
      throw new StageError(
        LT_EXPECTED_EXPRESSION_ERR(letName),
        sexpr.sourceSpan
      );
    }
    if (sexpr.subSExprs.length - 1 > 2) {
      throw new StageError(
        LT_EXPECTED_ONE_EXPRESSION_ERR(letName, sexpr.subSExprs.length - 3),
        sexpr.subSExprs[3].sourceSpan
      );
    }
    return new LetNode(letName, bindings, this.toNode(sexpr.subSExprs[2]), sexpr.sourceSpan);
  }

  private toLocalNode(sexpr: ListSExpr): LocalNode {
    // (local ...)
    if (sexpr.subSExprs.length - 1 === 0) {
      throw new StageError(
        LO_EXPECTED_DEFINITIONS_ERR(),
        sexpr.sourceSpan
      );
    }
    const definitions = sexpr.subSExprs[1];
    if (isAtomSExpr(definitions)) {
      throw new StageError(
        LO_EXPECTED_DEFINITIONS_ERR(definitions),
        definitions.sourceSpan
      );
    }
    const defns: DefnNode[] = [];
    for (const sexpr of definitions.subSExprs) {
      const node = this.toNode(sexpr);
      if (!isDefnNode(node)) {
        throw new StageError(
          LO_EXPECTED_DEFINITION_ERR(sexpr),
          node.sourceSpan
        );
      }
      defns.push(node);
    }
    if (sexpr.subSExprs.length - 1 === 1) {
      throw new StageError(
        LO_EXPECTED_EXPRESSION_ERR,
        sexpr.sourceSpan
      );
    }
    if (sexpr.subSExprs.length - 1 > 2) {
      throw new StageError(
        LO_EXPECTED_ONE_EXPRESSION_ERR(sexpr.subSExprs.length - 3),
        sexpr.subSExprs[3].sourceSpan
      );
    }
    return new LocalNode(
      defns,
      this.toNode(sexpr.subSExprs[2]),
      sexpr.sourceSpan
    );
  }

  private toOrNode(sexpr: ListSExpr): OrNode {
    // (or ...)
    if (sexpr.subSExprs.length - 1 < 2) {
      throw new StageError(
        FA_MIN_ARITY_ERR(Keyword.Or, 2, sexpr.subSExprs.length - 1),
        sexpr.subSExprs[0].sourceSpan
      );
    }
    return new OrNode(
      sexpr.subSExprs.slice(1).map(sexpr => this.toNode(sexpr)),
      sexpr.sourceSpan
    );
  }

  private toQuoteNode(sexpr: ListSExpr, quotedSExpr: SExpr): ASTNode {
    // (quote quotedSExpr)
    if (sexpr.subSExprs.length - 1 === 0) {
      throw new StageError(
        QU_EXPECTED_EXPRESSION_ERR,
        sexpr.sourceSpan
      );
    }
    if (sexpr.subSExprs.length - 1 > 1) {
      throw new StageError(
        QU_EXPECTED_ONE_EXPRESSION_ERR(sexpr.subSExprs.length - 2),
        sexpr.subSExprs[2].sourceSpan
      );
    }
    if (isAtomSExpr(quotedSExpr)) {
      if (
        quotedSExpr.token.type === TokenType.Name
        || quotedSExpr.token.type === TokenType.Keyword
        || quotedSExpr.token.type === TokenType.Placeholder
      ) {
        return new AtomNode(
          new RSymbol(quotedSExpr.token.text),
          quotedSExpr.sourceSpan
        );
      } else if (!SETTINGS.syntax.listAbbreviation) {
        throw new StageError(
          QU_EXPECTED_POST_QUOTE_ERR(quotedSExpr),
          sexpr.sourceSpan
        );
      } else {
        return this.toNode(quotedSExpr);
      }
    } else {
      if (quotedSExpr.subSExprs.length === 0) {
        return new AtomNode(
          R_EMPTY_LIST,
          sexpr.sourceSpan
        );
      } else {
        if (!SETTINGS.syntax.listAbbreviation) {
          throw new StageError(
            QU_EXPECTED_POST_QUOTE_ERR(quotedSExpr),
            sexpr.sourceSpan
          );
        }
        return new FunAppNode(
          new VarNode("list", sexpr.sourceSpan),
          quotedSExpr.subSExprs.map(subSExpr => this.toQuoteNode(sexpr, subSExpr)),
          sexpr.sourceSpan
        );
      }
    }
  }

  private toRequireNode(sexpr: ListSExpr): RequireNode {
    if (
      sexpr.subSExprs.length - 1 !== 1
      || !isAtomSExpr(sexpr.subSExprs[1])
      || sexpr.subSExprs[1].token.type !== TokenType.Name
    ) {
      throw new StageError(
        RQ_EXPECTED_MODULE_NAME_ERR(sexpr.subSExprs.length - 1, sexpr.subSExprs[1]),
        sexpr.subSExprs.length - 1 === 1 ? sexpr.subSExprs[1].sourceSpan : sexpr.sourceSpan
      );
    }
    return new RequireNode(
      sexpr.subSExprs[1].token.text,
      sexpr.subSExprs[1].sourceSpan,
      sexpr.sourceSpan
    );

  }
}
