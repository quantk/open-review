import type { ReactNode } from "react";
import type { DiffLine } from "./types.ts";

type Language = "go" | "kotlin" | "javascript" | "python";

const COMMON_KEYWORDS = ["return", "if", "else", "for", "while", "switch", "case", "break", "continue", "try", "catch", "throw", "null", "true", "false"];

const KEYWORDS_BY_LANGUAGE: Record<Language, string[]> = {
  go: ["package", "import", "func", "defer", "go", "chan", "select", "range", "map", "struct", "interface", "type", "const", "var", "nil", "fallthrough", "default"],
  kotlin: ["package", "import", "fun", "val", "var", "class", "object", "interface", "data", "sealed", "enum", "when", "is", "in", "as", "by", "constructor", "init", "companion", "override", "private", "protected", "public", "internal", "suspend", "inline", "reified", "null", "true", "false"],
  javascript: ["const", "let", "var", "function", "class", "new", "async", "await", "import", "from", "export", "default", "extends", "implements", "typeof", "instanceof", "this", "super", "undefined", "null", "true", "false", "interface", "type", "readonly", "private", "protected", "public", "static"],
  python: ["def", "class", "import", "from", "as", "with", "lambda", "yield", "async", "await", "pass", "raise", "except", "finally", "elif", "in", "is", "not", "and", "or", "None", "True", "False", "self", "global", "nonlocal"],
};

const BUILTINS_BY_LANGUAGE: Record<Language, string[]> = {
  go: ["append", "cap", "close", "complex", "copy", "delete", "imag", "len", "make", "new", "panic", "print", "println", "real", "recover", "any", "comparable", "error"],
  kotlin: ["println", "print", "listOf", "mutableListOf", "mapOf", "setOf", "arrayOf", "run", "let", "also", "apply", "with", "use"],
  javascript: ["console", "Promise", "Array", "Object", "String", "Number", "Boolean", "Map", "Set", "JSON", "Math", "Date", "Error"],
  python: ["print", "len", "range", "str", "int", "float", "bool", "list", "dict", "set", "tuple", "enumerate", "zip", "open", "Exception", "ValueError"],
};

const TYPES_BY_LANGUAGE: Record<Language, string[]> = {
  go: ["string", "bool", "byte", "rune", "int", "int8", "int16", "int32", "int64", "uint", "uint8", "uint16", "uint32", "uint64", "uintptr", "float32", "float64", "complex64", "complex128"],
  kotlin: ["String", "Boolean", "Byte", "Short", "Int", "Long", "Float", "Double", "Char", "Unit", "Any", "Nothing", "List", "MutableList", "Map", "MutableMap", "Set"],
  javascript: ["string", "number", "boolean", "unknown", "never", "void", "Record", "Partial", "Required", "Readonly", "Pick", "Omit"],
  python: ["str", "int", "float", "bool", "list", "dict", "set", "tuple", "None"],
};

export function highlightCode(value: string, filePath: string): ReactNode[] {
  const source = String(value ?? "");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const lang = languageFromPath(filePath);
  const keywords = new Set([...COMMON_KEYWORDS, ...KEYWORDS_BY_LANGUAGE[lang]]);
  const builtins = new Set(BUILTINS_BY_LANGUAGE[lang]);
  const types = new Set(TYPES_BY_LANGUAGE[lang]);

  while (i < source.length) {
    const rest = source.slice(i);
    if (rest.startsWith("//") || rest.startsWith("#")) {
      nodes.push(<span key={key++} className="tok-comment">{rest}</span>);
      return nodes;
    }
    const quote = source[i];
    if (quote === '"' || quote === "'" || quote.charCodeAt(0) === 96) {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === "\\") j += 2;
        else if (source[j] === quote) { j += 1; break; }
        else j += 1;
      }
      nodes.push(<span key={key++} className="tok-string">{source.slice(i, j)}</span>);
      i = j;
      continue;
    }
    const number = /^\d+(?:\.\d+)?/.exec(rest);
    if (number) {
      nodes.push(<span key={key++} className="tok-number">{number[0]}</span>);
      i += number[0].length;
      continue;
    }
    const ident = /^[A-Za-z_$][\w$]*/.exec(rest);
    if (ident) {
      const word = ident[0];
      if (keywords.has(word)) nodes.push(<span key={key++} className="tok-keyword">{word}</span>);
      else if (types.has(word)) nodes.push(<span key={key++} className="tok-type">{word}</span>);
      else if (builtins.has(word)) nodes.push(<span key={key++} className="tok-builtin">{word}</span>);
      else nodes.push(word);
      i += ident[0].length;
      continue;
    }
    nodes.push(source[i]);
    i += 1;
  }
  return nodes;
}

export function linePrefix(type: DiffLine["type"]) {
  return type === "add" ? "+" : type === "del" ? "-" : " ";
}

function languageFromPath(filePath: string): Language {
  const lower = String(filePath || "").toLowerCase();
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".kt") || lower.endsWith(".kts")) return "kotlin";
  if (lower.endsWith(".py") || lower.endsWith(".pyw")) return "python";
  return "javascript";
}
