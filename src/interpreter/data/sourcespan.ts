export {
  NO_SOURCE_SPAN,
  SourceSpan,
  makeSourceSpan
};

const NO_SOURCE_SPAN = makeSourceSpan(0, 0, 0, 0);

type SourceSpan = {
  readonly startLineno: number;
  readonly startColno: number;
  readonly endLineno: number;
  readonly endColno: number;
}

function makeSourceSpan(
  startLineno: number,
  startColno: number,
  endLineno: number,
  endColno: number
): SourceSpan {
  return {
    startLineno,
    startColno,
    endLineno,
    endColno
  };
}
