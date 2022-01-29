import {
  RModule
} from "../../../rvalue";
import {
  RPPCircle
} from "./primitive/basicImages";
import {
  RPPRectangle
} from "./primitive/polygons";

export {
  R2HtdpImageModule
};

class R2HtdpImageModule extends RModule {
  constructor() {
    super(
      "2htdp/image",
      [
        ["color", ["red", "green", "blue"]]
      ],
      [
        new RPPCircle(),
        new RPPRectangle()
      ]
    );
  }
}
