import {
  RList,
  RPrimFun,
  RValue,
  R_EMPTY_LIST
} from "../rvalue.js";

export {
  RPFCons,
  RPFList,
  R_NULL
};

const R_NULL = R_EMPTY_LIST;

class RPFCons extends RPrimFun {
  constructor() {
    super("cons", { arity: 2, argsTypeNames: ["any", "list"] });
  }

  call(args: RValue[]): RValue {
    return new RList([args[0], ...(<RList>args[1]).vals]);
  }
}

class RPFList extends RPrimFun {
  constructor() {
    super("list", {});
  }

  call(args: RValue[]): RValue {
    return new RList(args);
  }
}
