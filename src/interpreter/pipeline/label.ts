import {
  ASTNodeVisitor,
  AndNode,
  AtomNode,
  CheckErrorNode,
  CheckMemberOfNode,
  CheckNode,
  CheckRangeNode,
  CheckSatisfiedNode,
  CheckWithinNode,
  CondNode,
  DefnStructNode,
  DefnVarNode,
  EllipsisProcAppNode,
  EllipsisNode,
  ProcAppNode,
  IfNode,
  LambdaNode,
  LetNode,
  LocalNode,
  OrNode,
  RequireNode,
  VarNode,
  isCheckNode,
  isDefnNode
} from "../ir/ast";
import {
  Stage,
  StageOutput,
} from "../data/stage";
import {
  Global
} from "../global";
import {
  Program
} from "../ir/program";

export {
  GenerateLabels
};

class VarMapping {
  private mapping: Map<string, string> = new Map();

  constructor(readonly parentMapping: VarMapping | null = null) {}

  set(name: string, label: string): void {
    this.mapping.set(name, label);
  }

  get(name: string): string | null {
    return this.mapping.get(name) || (this.parentMapping && this.parentMapping.get(name));
  }
}

class GenerateLabels extends ASTNodeVisitor<void> implements Stage<Program, void> {
  global = new Global();
  currentInt = 0;
  varMapping = new VarMapping();

  run(input: StageOutput<Program>): StageOutput<void> {
    this.currentInt = 0;
    this.varMapping = new VarMapping();
    input.output.defns.forEach(node => {
      if (isDefnNode(node)) {
        node.nameLabel = `${node.name}_${this.nextInt()}`;
        this.varMapping.set(node.name, node.nameLabel);
      }
    })
    input.output.nodes.forEach(node => node.accept(this));
    return new StageOutput(void null);
  }

  visitAndNode(node: AndNode): void {
    node.label = `and_${this.nextInt()}`;
    node.args.forEach(arg => arg.accept(this));
  }

  visitAtomNode(node: AtomNode): void {
    node.label = `atom_${this.nextInt()}`;
  }

  visitCheckNode(node: CheckNode): void {
    node.label = `check_${this.nextInt()}`;
    node.args.forEach(arg => arg.accept(this));
  }

  visitCondNode(node: CondNode): void {
    node.label = `cond_${this.nextInt()}`;
    node.questionAnswerClauses.forEach(([question, answer]) => {
      question.accept(this);
      answer.accept(this);
    });
  }

  visitDefnStructNode(node: DefnStructNode): void {
    node.label = `defn_struct_${this.nextInt()}`;
    node.nameLabel = node.nameLabel || `${node.name}_${this.nextInt()}`;
    this.varMapping.set(node.name, node.nameLabel);
    node.makeStructLabel = `make-${node.name}_${this.nextInt()}`;
    this.varMapping.set(`make-${node.name}`, node.makeStructLabel);
    node.structHuhLabel = `${node.name}?_${this.nextInt()}`;
    this.varMapping.set(`${node.name}?`, node.structHuhLabel);
    node.fields.forEach(field => node.fieldLabels.push(`${node.name}-${field}_${this.nextInt()}`));
    node.fields.forEach((field, idx) => this.varMapping.set(`${node.name}-${field}`, node.fieldLabels[idx]));
  }

  visitDefnVarNode(node: DefnVarNode): void {
    node.label = `defn_var_${this.nextInt()}`;
    node.value.accept(this);
    node.nameLabel = node.nameLabel || `${node.name}_${this.nextInt()}`;
    this.varMapping.set(node.name, node.nameLabel);
  }

  visitEllipsisProcAppNode(node: EllipsisProcAppNode): void {
    node.label = `ellipsis_proc_app_${this.nextInt()}`;
  }

  visitEllipsisNode(node: EllipsisNode): void {
    node.label = `ellipsis_${this.nextInt()}`;
  }

  visitIfNode(node: IfNode): void {
    node.label = `if_${this.nextInt()}`;
    node.question.accept(this);
    node.trueAnswer.accept(this);
    node.falseAnswer.accept(this);
  }

  visitLambdaNode(node: LambdaNode): void {
    node.label = `lambda_${this.nextInt()}`;
    if (node.name) {
      node.nameLabel = this.varMapping.get(node.name)!;
    }
    const parent = this.varMapping;
    this.varMapping = new VarMapping(parent);
    if (node.paramLabels.length === 0) {
      node.params.forEach(name => {
        const paramLabel = `${name}_${this.nextInt()}`;
        this.varMapping.set(name, paramLabel);
        node.paramLabels.push(paramLabel);
      });
    }
    node.body.accept(this);
    this.varMapping = parent;
  }

  visitLetNode(node: LetNode): void {
    node.label = `let_${this.nextInt()}`;
    const parent = this.varMapping;
    const varMapping = new VarMapping(parent);
    switch (node.name) {
      case "letrec": {
        node.bindings.forEach(([variable, _]) => {
          variable.label = `${variable.name}_${this.nextInt()}`;
          varMapping.set(variable.name, variable.label);
        });
        this.varMapping = varMapping;
        node.bindings.forEach(([_, expr]) => expr.accept(this));
        break;
      }
      case "let*": {
        this.varMapping = varMapping;
        node.bindings.forEach(([variable, expr]) => {
          variable.label = `${variable.name}_${this.nextInt()}`;
          varMapping.set(variable.name, variable.label);
          expr.accept(this);
        });
        break;
      }
      case "let": {
        node.bindings.forEach(([variable, _]) => {
          variable.label = `${variable.name}_${this.nextInt()}`;
          varMapping.set(variable.name, variable.label);
        });
        node.bindings.forEach(([_, expr]) => expr.accept(this));
        this.varMapping = varMapping;
        break;
      }
    }
    node.body.accept(this);
    this.varMapping = parent;
  }

  visitLocalNode(node: LocalNode): void {
    node.label = `local_${this.nextInt()}`;
    const parent = this.varMapping;
    this.varMapping = new VarMapping(this.varMapping);
    // can be optimized
    node.defns.forEach(defn => {
      defn.accept(this);
    });
    node.defns.forEach(defn => {
      defn.accept(this);
    });
    node.body.accept(this);
    this.varMapping = parent;
  }

  visitOrNode(node: OrNode): void {
    node.label = `or_${this.nextInt()}`;
    node.args.forEach(arg => arg.accept(this));
  }

  visitProcAppNode(node: ProcAppNode): void {
    node.label = `proc_app_${this.nextInt()}`;
    node.fn.accept(this);
    node.args.forEach(arg => arg.accept(this));
  }

  visitRequireNode(node: RequireNode): void {
    node.label = `require_${this.nextInt()}`;
  }

  visitVarNode(node: VarNode): void {
    console.log(node)
    node.label = this.varMapping.get(node.name) || node.name;
    console.log(node.label)
  }

  private nextInt(): number {
    return this.currentInt++;
  }
}
