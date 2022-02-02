/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DF_PREVIOUSLY_DEFINED_NAME_ERR,
  RQ_MODULE_NOT_FOUND_ERR
} from "../error";
import {
  Scope,
  VariableType
} from "../data/scope";
import {
  AtomSExpr
} from "./sexpr";
import {
  Global
} from "../global";
import {
  Keyword
} from "../data/keyword";
import {
  RValue
} from "../values/rvalue";
import {
  SourceSpan
} from "../data/sourcespan";
import {
  StageError
} from "../data/stage";

export {
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
  EllipsisProcAppNode,
  EllipsisNode,
  ExprNode,
  ProcAppNode,
  IfNode,
  LambdaNode,
  LetNode,
  LocalNode,
  OrNode,
  RequireNode,
  VarNode,
  isCheckNode,
  isDefnNode,
  isLambdaNode,
  isRequireNode,
  isVarNode,
  ASTNodeVisitor,
  ASTNodeExtendedVisitor
};

abstract class ASTNode {
  used = false;
  label = "";

  constructor(
    readonly sourceSpan: SourceSpan
  ) {}

  abstract accept<T>(visitor: ASTNodeVisitor<T>): T;

  isTemplate(): boolean {
    return false;
  }

  use() {
    this.used = true;
  }
}

class CheckNode extends ASTNode {
  constructor(
    readonly name: string,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitCheckNode(this);
  }
}


class CheckErrorNode extends CheckNode {
  constructor(
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckError, args, sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    if (isExtendedVisitor(visitor)) {
      return visitor.visitCheckErrorNode(this);
    } else {
      return visitor.visitCheckNode(this);
    }
  }
}

class CheckMemberOfNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly testAgainstValNodes: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckMemberOf, [testValNode, ...testAgainstValNodes], sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    if (isExtendedVisitor(visitor)) {
      return visitor.visitCheckMemberOfNode(this);
    } else {
      return visitor.visitCheckNode(this);
    }
  }
}

class CheckRangeNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly lowerBoundValNode: ASTNode,
    readonly upperBoundValNode: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckRange, [testValNode, lowerBoundValNode, upperBoundValNode], sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    if (isExtendedVisitor(visitor)) {
      return visitor.visitCheckRangeNode(this);
    } else {
      return visitor.visitCheckNode(this);
    }
  }
}

class CheckSatisfiedNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly testFnNode: ASTNode,
    readonly testFnName: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckSatisfied, [testValNode, testFnNode], sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    if (isExtendedVisitor(visitor)) {
      return visitor.visitCheckSatisfiedNode(this);
    } else {
      return visitor.visitCheckNode(this);
    }
  }
}

class CheckWithinNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly actualNode: ASTNode,
    readonly expectedNode: ASTNode,
    readonly withinNode: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckWithin, [actualNode, expectedNode, withinNode], sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    if (isExtendedVisitor(visitor)) {
      return visitor.visitCheckWithinNode(this);
    } else {
      return visitor.visitCheckNode(this);
    }
  }
}

abstract class DefnNode extends ASTNode {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  addToScope(scope: Scope, _allowShadow = false): void {
    if (scope.has(this.name)) {
      throw new StageError(
        DF_PREVIOUSLY_DEFINED_NAME_ERR(this.name),
        this.nameSourceSpan
      );
    }
  }
}

class DefnStructNode extends DefnNode {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly fields: string[],
    readonly sourceSpan: SourceSpan
  ) {
    super(
      name,
      nameSourceSpan,
      sourceSpan
    );
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitDefnStructNode(this);
  }

  addToScope(scope: Scope, allowShadow = false): void {
    if (!allowShadow) {
      super.addToScope(scope);
      if (scope.has(`make-${this.name}`)) {
        throw new StageError(
          DF_PREVIOUSLY_DEFINED_NAME_ERR(`make-${this.name}`),
          this.sourceSpan
        );
      }
      if (scope.has(`${this.name}?`)) {
        throw new StageError(
          DF_PREVIOUSLY_DEFINED_NAME_ERR(`${this.name}?`),
          this.sourceSpan
        );
      }
      this.fields.forEach(field => {
        if (scope.has(`${this.name}-${field}`)) {
          throw new StageError(
            DF_PREVIOUSLY_DEFINED_NAME_ERR(`${this.name}-${field}`),
            this.sourceSpan
          );
        }
      });
    }
    scope.set(this.name, VariableType.StructureType);
    scope.set(
      `make-${this.name}`,
      VariableType.UserDefinedFunction
    );
    scope.set(
      `${this.name}?`,
      VariableType.UserDefinedFunction
    );
    this.fields.forEach(field => {
      scope.set(
        `${this.name}-${field}`,
        VariableType.UserDefinedFunction
      );
    });
  }
}

class DefnVarNode extends DefnNode {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly value: ExprNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(
      name,
      nameSourceSpan,
      sourceSpan
    );
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitDefnVarNode(this);
  }

  isTemplate(): boolean {
    return this.value.isTemplate();
  }

  addToScope(scope: Scope, allowShadow = false): void {
    if (!allowShadow) {
      super.addToScope(scope);
    }
    if (this.value instanceof LambdaNode) {
      scope.set(
        this.name,
        VariableType.UserDefinedFunction
      );
    } else {
      scope.set(this.name, VariableType.Data);
    }
  }
}

abstract class ExprNode extends ASTNode {}

class AndNode extends ExprNode {
  constructor(
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitAndNode(this);
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
  }
}

class AtomNode extends ExprNode {
  constructor(
    readonly rval: RValue,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitAtomNode(this);
  }
}

class CondNode extends ExprNode {
  constructor(
    readonly questionAnswerClauses: [ASTNode, ASTNode][],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitCondNode(this);
  }

  isTemplate(): boolean {
    return this.questionAnswerClauses.some(clause => clause[0].isTemplate() || clause[1].isTemplate());
  }
}

class EllipsisProcAppNode extends ExprNode {
  constructor(
    readonly placeholder: AtomSExpr,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitEllipsisProcAppNode(this);
  }

  isTemplate(): boolean {
    return true;
  }
}

class EllipsisNode extends ExprNode {
  constructor(
    readonly placeholder: AtomSExpr,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitEllipsisNode(this);
  }

  isTemplate(): boolean {
    return true;
  }
}

class IfNode extends ExprNode {
  constructor(
    readonly question: ASTNode,
    readonly trueAnswer: ASTNode,
    readonly falseAnswer: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitIfNode(this);
  }

  isTemplate(): boolean {
    return this.question.isTemplate() || this.trueAnswer.isTemplate() || this.falseAnswer.isTemplate();
  }
}

class LambdaNode extends ExprNode {
  name: string | null;

  constructor(
    name: string | null,
    readonly params: string[],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
    this.name = name;
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitLambdaNode(this);
  }

  isTemplate(): boolean {
    return this.body.isTemplate();
  }
}

class LetNode extends ExprNode {
  constructor(
    readonly name: string,
    readonly bindings: [VarNode, ASTNode][],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitLetNode(this);
  }
}

class LocalNode extends ExprNode {
  constructor(
    readonly defns: DefnNode[],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitLocalNode(this);
  }

  isTemplate(): boolean {
    return this.defns.some(defn => defn.isTemplate()) || this.body.isTemplate();
  }
}

class OrNode extends ExprNode {
  constructor(
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitOrNode(this);
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
  }
}

class ProcAppNode extends ExprNode {
  constructor(
    readonly fn: ASTNode,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitProcAppNode(this);
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
  }
}

class RequireNode extends ExprNode {
  global = new Global();

  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitRequireNode(this);
  }

  addToScope(scope: Scope): void {
    const module = this.global.modules.get(this.name);
    if (!module) {
      throw new StageError(
        RQ_MODULE_NOT_FOUND_ERR(this.name),
        this.nameSourceSpan
      );
    }
    for (const procedure of module.procedures) {
      if (!scope.has(procedure.getName())) {
        scope.set(procedure.getName(), VariableType.PrimitiveFunction);
      }
    }
    for (const name of module.data.keys()) {
      if (!scope.has(name)) {
        scope.set(name, VariableType.Data);
      }
    }
  }
}

class VarNode extends ExprNode {
  constructor(
    readonly name: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>): T {
    return visitor.visitVarNode(this);
  }
}

function isCheckNode(node: ASTNode): node is CheckNode {
  return node instanceof CheckNode;
}

function isDefnNode(node: ASTNode): node is DefnNode {
  return node instanceof DefnNode;
}

function isLambdaNode(node: ASTNode): node is LambdaNode {
  return node instanceof LambdaNode;
}

function isRequireNode(node: ASTNode): node is RequireNode {
  return node instanceof RequireNode;
}

function isVarNode(node: ASTNode): node is VarNode {
  return node instanceof VarNode;
}

type ASTNodeVisitor<T> = {
  visitAndNode(node: AndNode): T;
  visitAtomNode(node: AtomNode): T;
  visitCheckNode(node: CheckNode): T;
  visitCondNode(node: CondNode): T;
  visitDefnVarNode(node: DefnVarNode): T;
  visitDefnStructNode(node: DefnStructNode): T;
  visitEllipsisProcAppNode(node: EllipsisProcAppNode): T;
  visitEllipsisNode(node: EllipsisNode): T;
  visitIfNode(node: IfNode): T;
  visitLambdaNode(node: LambdaNode): T;
  visitLetNode(node: LetNode): T;
  visitLocalNode(node: LocalNode): T;
  visitOrNode(node: OrNode): T;
  visitProcAppNode(node: ProcAppNode): T;
  visitRequireNode(node: RequireNode): T;
  visitVarNode(node: VarNode): T;
}

type ASTNodeExtendedVisitor<T> = {
  visitCheckErrorNode(node: CheckErrorNode): T;
  visitCheckMemberOfNode(node: CheckMemberOfNode): T;
  visitCheckRangeNode(node: CheckRangeNode): T;
  visitCheckSatisfiedNode(node: CheckSatisfiedNode): T;
  visitCheckWithinNode(node: CheckWithinNode): T;
} & ASTNodeVisitor<T>;

function isExtendedVisitor<T>(visitor: ASTNodeVisitor<T>): visitor is ASTNodeExtendedVisitor<T> {
  return "visitCheckErrorNode" in visitor;
}
