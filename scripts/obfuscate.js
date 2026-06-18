const JavaScriptObfuscator = require("javascript-obfuscator");
const fs = require("fs");
const path = require("path");

const files = [
  "electron-main.js",
  "electron-preload.js"
];

const opts = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayEncoding: ["rc4"],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

files.forEach(f => {
  const fp = path.resolve(__dirname, "..", f);
  if (!fs.existsSync(fp)) {
    console.log("SKIP (not found):", f);
    return;
  }
  let content = fs.readFileSync(fp, "utf8");
  const ext = path.extname(f);

  if (ext === ".js") {
    console.log("Obfuscating", f);
    const obf = JavaScriptObfuscator.obfuscate(content, opts).getObfuscatedCode();
    content = obf;
  }

  fs.writeFileSync(fp, content, "utf8");
  console.log("OK:", f);
});

console.log("Obfuscation complete.");
