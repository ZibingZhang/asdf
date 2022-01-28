import {
  RModule
} from "../../../rvalue";
import {
  RPFSquare
} from "./primitive";

export {
  RModuleHtdpImage
};

class RModuleHtdpImage extends RModule {
  constructor() {
    super(new Map([
      ["square", new RPFSquare()]
    ]));
  }
}
