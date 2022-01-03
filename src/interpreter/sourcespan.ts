export {
  NO_SOURCE_SPAN,
  SourceSpan
};


class SourceSpan {
  constructor(
    readonly startLineno: number,
    readonly startColno: number,
    readonly endLineno: number,
    readonly endColno: number
  ) {}
}

const NO_SOURCE_SPAN = new SourceSpan(-1, -1, -1, -1);
