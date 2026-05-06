import { stdin as input, stdout as output } from "process";
import { createInterface } from "readline/promises";

export const promptText = async (question) => {
  const rl = createInterface({ input, output });

  try {
    return String(await rl.question(question)).trim();
  } finally {
    rl.close();
  }
};

export const promptPassword = async (question) => {
  const rl = createInterface({ input, output, terminal: true });
  let muted = false;

  rl._writeToOutput = (text) => {
    output.write(muted ? "*".repeat(text.replace(/\r?\n/g, "").length) : text);
  };

  try {
    output.write(question);
    muted = true;
    return String(await rl.question(""));
  } finally {
    muted = false;
    output.write("\n");
    rl.close();
  }
};
