import { clearLine, cursorTo, moveCursor } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import type { CommandName } from "./types";

const ANSI_RESET = "\u001B[0m";
const ANSI_DIM = "\u001B[2m";
const ANSI_ERROR = "\u001B[31m";
const ANSI_SELECTED = "\u001B[38;2;22;146;209m";

export class CommandCanceledError extends Error {
  readonly command: CommandName;

  constructor(command: CommandName) {
    super(`${command} canceled.`);
    this.command = command;
    this.name = "CommandCanceledError";
  }
}

export function canPromptInteractively(): boolean {
  return Boolean(input.isTTY && output.isTTY);
}

type TextPromptInput = {
  command: CommandName;
  defaultValue: string;
  description: string;
  errorMessage?: string;
  optionName: string;
  promptLabel: string;
  submitHint: string;
};

type SingleSelectPromptInput = {
  command: CommandName;
  defaultValue: string | null;
  explanation: string;
  label: string;
  options: string[];
};

type MultiSelectPromptInput = {
  allowEmpty: boolean;
  command: CommandName;
  defaultValue: string[];
  explanation: string;
  label: string;
  options: string[];
};

export async function promptTextInput(inputOptions: TextPromptInput): Promise<string> {
  let value = "";

  return runInteractivePrompt(inputOptions.command, {
    handleKey(key) {
      if (key === "\r" || key === "\n") {
        return {
          done: value,
        };
      }

      if (key === "\u007F") {
        value = Array.from(value).slice(0, -1).join("");
        return {};
      }

      if (isPrintableKey(key)) {
        value += key;
      }

      return {};
    },
    render() {
      return [
        `Provide ${inputOptions.promptLabel}.`,
        inputOptions.description,
        `Option: ${inputOptions.optionName}`,
        `Default: ${inputOptions.defaultValue === "" ? "disabled" : inputOptions.defaultValue}`,
        "",
        `> ${value}`,
        inputOptions.errorMessage ? colorize(inputOptions.errorMessage, ANSI_ERROR) : "",
        colorize(inputOptions.submitHint, ANSI_DIM),
      ].filter((line, index, lines) => !(line === "" && lines[index - 1] === ""));
    },
  });
}

export async function promptSingleSelect(inputOptions: SingleSelectPromptInput): Promise<string> {
  if (inputOptions.options.length === 0) {
    throw new Error(`No options available for ${inputOptions.label}`);
  }

  let activeIndex = inputOptions.defaultValue
    ? Math.max(inputOptions.options.indexOf(inputOptions.defaultValue), 0)
    : 0;

  return runInteractivePrompt(inputOptions.command, {
    handleKey(key) {
      if (key === "\u001B[A") {
        activeIndex = activeIndex === 0 ? inputOptions.options.length - 1 : activeIndex - 1;
        return {};
      }

      if (key === "\u001B[B") {
        activeIndex = activeIndex === inputOptions.options.length - 1 ? 0 : activeIndex + 1;
        return {};
      }

      if (key === "\r" || key === "\n") {
        return {
          done: inputOptions.options[activeIndex],
        };
      }

      return {};
    },
    render() {
      return [
        inputOptions.label,
        inputOptions.explanation,
        "",
        ...inputOptions.options.map((option, index) =>
          formatOptionLine({
            active: index === activeIndex,
            label: `${index + 1}) ${option}`,
          })),
        "",
        colorize("Use ↑/↓ to move, Enter to confirm, Esc to cancel.", ANSI_DIM),
      ];
    },
  });
}

export async function promptMultiSelect(inputOptions: MultiSelectPromptInput): Promise<string[]> {
  if (inputOptions.options.length === 0) {
    return [];
  }

  let activeIndex = 0;
  let errorMessage = "";
  const selected = new Set(inputOptions.defaultValue);

  return runInteractivePrompt(inputOptions.command, {
    handleKey(key) {
      if (key === "\u001B[A") {
        activeIndex = activeIndex === 0 ? inputOptions.options.length - 1 : activeIndex - 1;
        return {};
      }

      if (key === "\u001B[B") {
        activeIndex = activeIndex === inputOptions.options.length - 1 ? 0 : activeIndex + 1;
        return {};
      }

      if (key === " ") {
        const option = inputOptions.options[activeIndex];
        if (selected.has(option)) {
          selected.delete(option);
        } else {
          selected.add(option);
        }
        errorMessage = "";
        return {};
      }

      if (key === "\r" || key === "\n") {
        if (!inputOptions.allowEmpty && selected.size === 0) {
          errorMessage = "Select at least one option.";
          return {};
        }

        return {
          done: inputOptions.options.filter((option) => selected.has(option)),
        };
      }

      return {};
    },
    render() {
      return [
        inputOptions.label,
        inputOptions.explanation,
        "",
        ...inputOptions.options.map((option, index) =>
          formatOptionLine({
            active: index === activeIndex,
            label: `${index + 1}) [${selected.has(option) ? "x" : " "}] ${option}`,
          })),
        "",
        errorMessage ? colorize(errorMessage, ANSI_ERROR) : "",
        colorize("Use ↑/↓ to move, Space to toggle, Enter to confirm, Esc to cancel.", ANSI_DIM),
      ].filter((line, index, lines) => !(line === "" && lines[index - 1] === ""));
    },
  });
}

async function runInteractivePrompt<T>(
  command: CommandName,
  inputOptions: {
    handleKey: (key: string) => { done?: T };
    render: () => string[];
  },
): Promise<T> {
  if (!canPromptInteractively()) {
    throw new Error("Interactive prompting requires a TTY.");
  }

  return new Promise<T>((resolve, reject) => {
    let renderedLineCount = 0;
    let rawModeEnabled = false;

    const cleanup = () => {
      input.off("data", onData);
      if (rawModeEnabled && input.isTTY) {
        input.setRawMode(false);
      }
      input.pause();
      output.write("\n");
    };

    const render = () => {
      clearRenderedBlock(renderedLineCount);
      const lines = inputOptions.render();
      output.write(lines.join("\n"));
      renderedLineCount = lines.length;
    };

    const finish = (callback: () => void) => {
      cleanup();
      callback();
    };

    const onData = (chunk: Buffer | string) => {
      const key = chunk.toString();

      if (key === "\u0003" || key === "\u001B") {
        finish(() => reject(new CommandCanceledError(command)));
        return;
      }

      const result = inputOptions.handleKey(key);
      if (Object.prototype.hasOwnProperty.call(result, "done")) {
        finish(() => resolve(result.done as T));
        return;
      }

      render();
    };

    if (input.isTTY) {
      input.setRawMode(true);
      rawModeEnabled = true;
    }

    input.resume();
    input.on("data", onData);
    render();
  });
}

function clearRenderedBlock(lineCount: number): void {
  if (lineCount === 0) {
    return;
  }

  for (let index = 0; index < lineCount; index += 1) {
    clearLine(output, 0);
    cursorTo(output, 0);

    if (index < lineCount - 1) {
      moveCursor(output, 0, -1);
    }
  }
}

function formatOptionLine(inputOptions: { active: boolean; label: string }): string {
  const prefix = inputOptions.active ? ">" : " ";
  const line = `${prefix} ${inputOptions.label}`;

  return inputOptions.active ? colorize(line, ANSI_SELECTED) : line;
}

function colorize(value: string, ansiCode: string): string {
  if (!canUseColor()) {
    return value;
  }

  return `${ansiCode}${value}${ANSI_RESET}`;
}

function canUseColor(): boolean {
  return canPromptInteractively() && !("NO_COLOR" in process.env);
}

function isPrintableKey(key: string): boolean {
  return key >= " " && key !== "\u007F" && !key.startsWith("\u001B");
}
