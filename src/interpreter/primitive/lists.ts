import {
  AnyType,
  BooleanType,
  ExactNonNegativeIntegerType,
  ListType,
  PairType,
  ProcedureType
} from "../values/types";
import {
  RList,
  RNumber,
  RPrimProc,
  RValue,
  R_EMPTY_LIST,
  isRData,
  isREmptyList,
  isRList,
  toRBoolean
} from "../values/rvalue";
import { RMath } from "../values/rmath";

export {
  RPPAppend,
  RPPCar,
  RPPCdr,
  RPPCons,
  RPPEighth,
  RPPEmptyHuh,
  RPPFifth,
  RPPFirst,
  RPPFourth,
  RPPLength,
  RPPList,
  RPPListStar,
  RPPListHuh,
  RPPMakeList,
  RPPMember,
  R_NULL,
  RPPRemove,
  RPPRemoveAll,
  RPPRest,
  RPPReverse,
  RPPSecond,
  RPPSeventh,
  RPPSixth,
  RPPThird
};

const R_NULL = R_EMPTY_LIST;

class RPPAppend extends RPrimProc {
  constructor() {
    super("append", { minArity: 2 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new ListType()), new ListType());
  }

  call(args: RValue[]): RValue {
    return new RList(args.flatMap(arg => (<RList>arg).vals));
  }
}

class RPPCar extends RPrimProc {
  constructor() {
    super("car");
  }

  getType(): ProcedureType {
    return new ProcedureType([new PairType()], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[0];
  }
}

class RPPCdr extends RPrimProc {
  constructor() {
    super("cdr");
  }

  getType(): ProcedureType {
    return new ProcedureType([new PairType()], new AnyType());
  }

  call(args: RValue[]): RValue {
    return new RList((<RList>args[0]).vals.slice(1));
  }
}

class RPPCons extends RPrimProc {
  constructor() {
    super("cons");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType(), new ListType()], new ListType());
  }

  call(args: RValue[]): RValue {
    return new RList([args[0], ...(<RList>args[1]).vals]);
  }
}

class RPPEighth extends RPrimProc {
  constructor() {
    super("eighth");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(8)], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[7];
  }
}

class RPPEmptyHuh extends RPrimProc {
  constructor(alias?: string) {
    super(alias || "empty?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isREmptyList(args[0]));
  }
}

class RPPFifth extends RPrimProc {
  constructor() {
    super("fifth");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(5)], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[4];
  }
}

class RPPFirst extends RPrimProc {
  constructor() {
    super("first");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(1)], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[0];
  }
}

class RPPFourth extends RPrimProc {
  constructor() {
    super("fourth");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(4)], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[3];
  }
}

class RPPLength extends RPrimProc {
  constructor() {
    super("length");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType()], new ExactNonNegativeIntegerType());
  }

  call(args: RValue[]): RValue {
    return RMath.make(true, BigInt((<RList>args[0]).vals.length));
  }
}

class RPPList extends RPrimProc {
  constructor() {
    super("list", {});
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args).fill(new AnyType()), new ListType(args));
  }

  call(args: RValue[]): RValue {
    return new RList(args);
  }
}

class RPPListStar extends RPrimProc {
  constructor() {
    super("list*", { minArity: 1 });
  }

  getType(args: number): ProcedureType {
    return new ProcedureType(new Array(args - 1).fill(new AnyType()).concat([new ListType()]), new ListType(args - 1));
  }

  call(args: RValue[]): RValue {
    return new RList(args.slice(0, -1).concat((<RList>args[args.length - 1]).vals));
  }
}

class RPPListHuh extends RPrimProc {
  constructor(alias?: string) {
    super(alias || "list?");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRList(args[0]));
  }
}

class RPPMakeList extends RPrimProc {
  constructor() {
    super("make-list");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ExactNonNegativeIntegerType(), new AnyType()], new ListType());
  }

  call(args: RValue[]): RValue {
    return new RList(new Array(Number((<RNumber>args[0]).numerator)).fill(args[1]));
  }
}

class RPPMember extends RPrimProc {
  constructor(alias?: string) {
    super(alias || "member");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType(), new ListType()], new BooleanType());
  }

  call(args: RValue[]): RValue {
    const testVal = args[0];
    return toRBoolean(isRData(testVal) && (<RList>args[1]).vals.some((val) => testVal.equal(val)));
  }
}

class RPPRemove extends RPrimProc {
  constructor() {
    super("remove");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType(), new ListType()], new ListType());
  }

  call(args: RValue[]): RValue {
    const testVal = args[0];
    const listVals = (<RList>args[1]).vals;
    if (isRData(testVal)) {
      for (const [idx, val] of listVals.entries()) {
        if (testVal.equal(val)) {
          return new RList(listVals.slice(0, idx).concat(listVals.slice(idx + 1)));
        }
      }
      return args[1];
    } else {
      return args[1];
    }
  }
}

class RPPRemoveAll extends RPrimProc {
  constructor() {
    super("remove-all");
  }

  getType(): ProcedureType {
    return new ProcedureType([new AnyType(), new ListType()], new ListType());
  }

  call(args: RValue[]): RValue {
    const testVal = args[0];
    if (isRData(testVal)) {
      return new RList((<RList>args[1]).vals.filter((val) => !testVal.equal(val)));
    } else {
      return args[1];
    }
  }
}

class RPPRest extends RPrimProc {
  constructor() {
    super("rest");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(1)], new ListType());
  }

  call(args: RValue[]): RValue {
    return new RList((<RList>args[0]).vals.slice(1));
  }
}

class RPPReverse extends RPrimProc {
  constructor() {
    super("reverse");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType()], new ListType());
  }

  call(args: RValue[]): RValue {
    return new RList((<RList>args[0]).vals.reverse());
  }
}

class RPPSecond extends RPrimProc {
  constructor() {
    super("second");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(2)], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[1];
  }
}

class RPPSeventh extends RPrimProc {
  constructor() {
    super("seventh");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(7)], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[6];
  }
}

class RPPSixth extends RPrimProc {
  constructor() {
    super("sixth");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(6)], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[5];
  }
}

class RPPThird extends RPrimProc {
  constructor() {
    super("third");
  }

  getType(): ProcedureType {
    return new ProcedureType([new ListType(3)], new AnyType());
  }

  call(args: RValue[]): RValue {
    return (<RList>args[0]).vals[2];
  }
}
