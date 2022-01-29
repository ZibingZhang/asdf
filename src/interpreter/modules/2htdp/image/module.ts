import {
  RModule,
  RStructType
} from "../../../rvalue";
import {
  RPPCircle,
  RPPRectangle
} from "./primitive";

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
