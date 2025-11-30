import type { EnvConfigData } from "./env-data";
import path from "node:path";

export function deduceEnvsPath(envConfigData: EnvConfigData): string | null {
  if (!envConfigData.envClientConfig?.envsPath) {
    return null;
  }

  const envsPath = envConfigData.envClientConfig.envsPath;

  // If already absolute, return as is
  if (path.isAbsolute(envsPath)) {
    return envsPath;
  }

  // Make relative path absolute using project path
  return path.resolve(envConfigData.projectPath, envsPath);
}
