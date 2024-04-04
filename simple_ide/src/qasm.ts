// Define a simple QASM mode
import {StreamLanguage} from "@codemirror/language";

export const qasm = StreamLanguage.define({
  token: stream => {
    if (stream.eatSpace()) return null;
    if (stream.match(/(OPENQASM|include|qreg|creg|gate|measure|reset|barrier|if|U|CX)\b/)) return 'keyword';
    if (stream.match(/pi\b/)) return 'atom';
    if (stream.match(/->|=>/)) return 'operator';
    if (stream.match(/[{}]/)) return 'bracket';
    if (stream.match(/\/\/.*/)) return 'comment';
    if (stream.match(/"[^"]*"/)) return 'string';
    if (stream.match(/[0-9]+(\.[0-9]+)?/)) return 'number';
    stream.next();
    return null;
  }
});


export default qasm;