export const CLONECHECK_VERSION = "0.1.0";

export type Severity = "info" | "warning" | "error";
export type CheckStatus = "pass" | "warning" | "fail" | "skip";
export type ProjectType = "node" | "python" | "go" | "rust" | "docker";
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface ClonecheckIssue {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface ClonecheckCheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  issues: ClonecheckIssue[];
  scoreImpact: number;
}

export interface ClonecheckReport {
  repoPath: string;
  projectName: string;
  score: number;
  status: "excellent" | "good" | "needs-work" | "poor";
  checks: ClonecheckCheckResult[];
  suggestions: string[];
  metadata: {
    detectedProjectTypes: string[];
    detectedPackageManager?: string;
    generatedAt: string;
    clonecheckVersion: string;
  };
}

export interface RunClonecheckOptions {
  repoPath: string;
  configPath?: string;
  strict?: boolean;
}

export interface ClonecheckConfig {
  ignore: string[];
  ignoreEnvVars: string[];
  checks: Record<string, boolean>;
}

export interface PackageJson {
  name?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface ClonecheckContext {
  repoPath: string;
  files: string[];
  config: ClonecheckConfig;
  packageJson?: unknown;
  readmeText?: string;
  envExampleText?: string;
  envExampleVars: Set<string>;
  detectedProjectTypes: ProjectType[];
  detectedPackageManager?: PackageManager;
  strict: boolean;
}

export interface ClonecheckCheck {
  id: string;
  title: string;
  description: string;
  run(context: ClonecheckContext): Promise<ClonecheckCheckResult>;
}

export const DEFAULT_CONFIG: ClonecheckConfig = {
  ignore: [],
  ignoreEnvVars: [],
  checks: {}
};
