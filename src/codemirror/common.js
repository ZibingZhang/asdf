export {
  evaluate
};

function evaluate(pipeline, text) {
  const stageOutput = pipeline.run(text);
  let output = "";
  if (stageOutput.errors.length > 0) {
    for (const error of stageOutput.errors) {
      output += error.msg + "\n";
    }
  } else {
    for (const text of stageOutput.output) {
      output += text + "\n";
    }
  }
  output += "> ";
  return output
}
