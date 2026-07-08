import path from "node:path";
import { readTextFile } from "../utils/files.js";

export interface PortDetection {
  port: number;
  file: string;
}

const CODE_PORT_PATTERNS = [
  /\b(?:app|server)?\.?listen\(\s*(\d{2,5})\b/g,
  /\blisten\(\s*(\d{2,5})\b/g,
  /\bport\s*[:=]\s*["']?(\d{2,5})\b/gi,
  /\b(?:PORT|VITE_PORT)\s*=\s*(\d{2,5})\b/g,
  /\bPORT\s*\|\|\s*(\d{2,5})\b/g,
  /--port\s+(\d{2,5})\b/g,
  /["']\d{2,5}:(\d{2,5})["']/g
];

const README_PORT_PATTERNS = [
  /\blocalhost:(\d{2,5})\b/gi,
  /\b127\.0\.0\.1:(\d{2,5})\b/gi,
  /\b0\.0\.0\.0:(\d{2,5})\b/gi
];

const PORT_FILES = new Set([
  "package.json",
  ".env.example",
  ".env.sample",
  ".env.template",
  "example.env",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.yml",
  "compose.yaml"
]);

const PORT_EXTENSIONS = new Set([".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx", ".py", ".go", ".rs"]);

function collectPorts(text: string, file: string, patterns: RegExp[]): PortDetection[] {
  const ports: PortDetection[] = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1];
      if (!raw) {
        continue;
      }
      const port = Number.parseInt(raw, 10);
      if (Number.isInteger(port) && port > 0 && port <= 65535) {
        ports.push({ port, file });
      }
    }
  }

  return ports;
}

function isPortSourceFile(file: string): boolean {
  return PORT_FILES.has(file) || PORT_EXTENSIONS.has(path.extname(file));
}

export async function detectRepoPorts(
  repoPath: string,
  files: string[],
  readmeText?: string
): Promise<{ codePorts: PortDetection[]; readmePorts: number[] }> {
  const codePorts: PortDetection[] = [];

  for (const file of files) {
    if (!isPortSourceFile(file)) {
      continue;
    }

    const text = await readTextFile(repoPath, file);
    if (!text) {
      continue;
    }

    codePorts.push(...collectPorts(text, file, CODE_PORT_PATTERNS));
  }

  const readmePorts = readmeText
    ? Array.from(new Set(collectPorts(readmeText, "README.md", README_PORT_PATTERNS).map((entry) => entry.port)))
    : [];

  const uniqueCodePorts = new Map<string, PortDetection>();
  for (const detection of codePorts) {
    uniqueCodePorts.set(`${detection.file}:${detection.port}`, detection);
  }

  return {
    codePorts: Array.from(uniqueCodePorts.values()),
    readmePorts
  };
}
