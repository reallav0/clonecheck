import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { build } from "tsup";

const packageDir = path.resolve(process.argv[2] ?? process.cwd());
const entry = path.join(packageDir, "src", "index.ts");
const packageJsonPath = path.join(packageDir, "package.json");

if (!existsSync(entry)) {
  throw new Error(`Cannot find package entry: ${entry}`);
}

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const dependencies = Object.keys(packageJson.dependencies ?? {});
const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});

process.chdir(packageDir);

await build({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  platform: "node",
  external: [...dependencies, ...peerDependencies]
});
