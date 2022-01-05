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

  comesAfter(sourceSpan: SourceSpan): boolean {
    return this.startLineno > sourceSpan.startLineno
      || (this.startLineno === sourceSpan.startLineno && this.startColno > sourceSpan.startColno);
  }
}

const NO_SOURCE_SPAN = new SourceSpan(-1, -1, -1, -1);
