import type { PackageJson, ProjectType } from "../types.js";

export function parsePackageJson(text: string | undefined): PackageJson | undefined {
  if (!text) {
    return undefined;
  }

  try {
    const value = JSON.parse(text) as unknown;
    if (typeof value === "object" && value !== null) {
      return value as PackageJson;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function detectProjectTypes(files: string[]): ProjectType[] {
  const types = new Set<ProjectType>();

  if (files.includes("package.json")) {
    types.add("node");
  }
  if (files.some((file) => file === "pyproject.toml" || file === "requirements.txt" || file.endsWith(".py"))) {
    types.add("python");
  }
  if (files.includes("go.mod") || files.some((file) => file.endsWith(".go"))) {
    types.add("go");
  }
  if (files.includes("Cargo.toml") || files.some((file) => file.endsWith(".rs"))) {
    types.add("rust");
  }
  if (
    files.some(
      (file) =>
        file === "Dockerfile" ||
        file.endsWith("/Dockerfile") ||
        file === "docker-compose.yml" ||
        file === "docker-compose.yaml" ||
        file === "compose.yml" ||
        file === "compose.yaml"
    )
  ) {
    types.add("docker");
  }

  return Array.from(types);
}
