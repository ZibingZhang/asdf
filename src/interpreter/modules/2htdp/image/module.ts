import {
  ColorType,
  Exact8BitNumberType
} from "./types";
import {
  RMakeStructFun,
  RModule,
  RStructGetProc,
  RStructHuhProc
} from "../../../rvalue";
import {
  RPC_EMPTY_IMAGE,
  RPPCircle,
  RPPEllipse
} from "./primitive/basicImages";
import {
  RPPAbove,
  RPPBeside
} from "./primitive/overlayingImages";
import {
  RPPImageHeight,
  RPPImageWidth
} from "./primitive/imageProperties";
import {
  RPPRectangle,
  RPPSquare
} from "./primitive/polygons";
import {
  ProcedureType
} from "../../../types";
import {
  RPPImageHuh
} from "./primitive/imagePredicates";
import {
  RPPMakeColor
} from "./primitive/color";

export {
  R2HtdpImageModule
};

class R2HtdpImageModule extends RModule {
  constructor() {
    const makeColor = new RMakeStructFun("color", 3);
    makeColor.getType = () => new ProcedureType(new Array(3).fill(new Exact8BitNumberType()), new ColorType());
    super(
      "2htdp/image",
      [
        // color structure
        new RPPMakeColor("color"),
        new RPPMakeColor(),
        new RStructHuhProc("color"),
        new RStructGetProc("color", "red", 0),
        new RStructGetProc("color", "green", 1),
        new RStructGetProc("color", "blue", 2),
        new RStructGetProc("color", "alpha", 3),

        // basic images
        new RPPCircle(),
        new RPPEllipse(),

        // polygons
        new RPPSquare(),
        new RPPRectangle(),

        // overlaying images
        new RPPBeside(),
        new RPPAbove(),

        // image properties
        new RPPImageWidth(),
        new RPPImageHeight(),

        // image predicates
        new RPPImageHuh()
      ],
      new Map([
        ["empty-image", RPC_EMPTY_IMAGE]
      ])
    );
  }
}
