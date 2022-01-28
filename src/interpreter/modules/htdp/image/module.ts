import {
  RModule
} from "../../../rvalue";
import {
  RPFRectangle
} from "./primitive";

export {
  RModuleHtdpImage
};

class RModuleHtdpImage extends RModule {
  constructor() {
    super(new Map([
      ["rectangle", new RPFRectangle()]
    ]));
  }
}
