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

  stringify(): string {
    return `<${this.startLineno}:${this.startColno}-${this.endLineno}:${this.endColno}>`;
  }

  comesAfter(sourceSpan: SourceSpan): boolean {
    return this.startLineno > sourceSpan.startLineno
      || (this.startLineno === sourceSpan.startLineno && this.startColno > sourceSpan.startColno);
  }
}

const NO_SOURCE_SPAN = new SourceSpan(0, 0, 0, 0);
