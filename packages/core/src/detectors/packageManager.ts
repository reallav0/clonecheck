import type { PackageJson, PackageManager } from "../types.js";

const LOCKFILE_MANAGERS: Array<{ file: string; manager: PackageManager }> = [
  { file: "pnpm-lock.yaml", manager: "pnpm" },
  { file: "yarn.lock", manager: "yarn" },
  { file: "package-lock.json", manager: "npm" },
  { file: "bun.lockb", manager: "bun" },
  { file: "bun.lock", manager: "bun" }
];

export interface PackageManagerDetection {
  manager?: PackageManager;
  lockfiles: string[];
  managers: PackageManager[];
}

export function detectPackageManager(
  files: string[],
  packageJson?: PackageJson
): PackageManagerDetection {
  const matches = LOCKFILE_MANAGERS.filter(({ file }) => files.includes(file));
  const lockManagers = Array.from(new Set(matches.map((match) => match.manager)));

  if (lockManagers.length > 0) {
    return {
      manager: lockManagers[0],
      lockfiles: matches.map((match) => match.file),
      managers: lockManagers
    };
  }

  const packageManager = packageJson?.packageManager?.split("@")[0];
  if (
    packageManager === "pnpm" ||
    packageManager === "npm" ||
    packageManager === "yarn" ||
    packageManager === "bun"
  ) {
    return {
      manager: packageManager,
      lockfiles: [],
      managers: [packageManager]
    };
  }

  return {
    lockfiles: [],
    managers: []
  };
}

export function isPackageManager(value: string): value is PackageManager {
  return value === "pnpm" || value === "npm" || value === "yarn" || value === "bun";
}
