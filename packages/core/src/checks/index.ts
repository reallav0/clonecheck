import type { ClonecheckCheck } from "../types.js";
import { ciPresenceCheck } from "./ciPresence.js";
import { dockerComposeEnvCheck } from "./dockerComposeEnv.js";
import { envExampleCheck } from "./envExample.js";
import { packageManagerConsistencyCheck } from "./packageManagerConsistency.js";
import { portDocumentationCheck } from "./portDocumentation.js";
import { projectFilesCheck } from "./projectFiles.js";
import { readmeCommandsCheck } from "./readmeCommands.js";
import { scriptsAvailabilityCheck } from "./scriptsAvailability.js";

export const checks: ClonecheckCheck[] = [
  packageManagerConsistencyCheck,
  scriptsAvailabilityCheck,
  envExampleCheck,
  readmeCommandsCheck,
  portDocumentationCheck,
  dockerComposeEnvCheck,
  projectFilesCheck,
  ciPresenceCheck
];

export function getChecks(): ClonecheckCheck[] {
  return checks;
}
