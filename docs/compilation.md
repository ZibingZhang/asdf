# Current Issues

Our interpreter runs synchronously, which blocks execution of the event loop.  We would like to avoid this since it means for expensive computation or infinite loops, it may cause the browser to become unresponsive.

Fortunately, there's a tool that we can use to allow expensive computation to run without blocking the event loop, [Stopify](https://github.com/ocelot-ide/Stopify).  In order to make use of Stopify, we need to partially compile Racket to JavaScript.

We can allow all phases of the pipeline before evaluation to run as is, then into JavaScript before running Stopify on our output.

# Example Compilations

## Example 1

**Before**

```scheme
(define x 4)
x
```

**After**

```javascript
global globalEnv;
const topLevel = [
  "define_0",
  "variable_0"
];
const stateStack = [];
let rax = {};
let output = [];
while (true) {
  switch (state) {
    case undefined: {
      // no more top level expression
      return;
    }
    case define_0: {
      globalEnv.set("x_0", 4);
      rax = { type: RType.Void };
      break;
    }
    case variable_0: {
      rax = {
        type: RType.Output,
        value: globalEnv.get("x_0");
      }
      break;
    }
  }
  state = stateStack.unshift();
  if (state === undefined) {
    output.push(rax);
    state = topLevel.unshift();
  }
}
```
