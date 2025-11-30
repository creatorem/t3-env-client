import type {
  StandardSchemaDictionary,
  StandardSchemaV1,
} from "@t3-oss/env-core";
import fs from "node:fs";
import path from "node:path";

export interface EnvFile {
  exists: boolean;
  path: string;
  variables?: string[];
  content?: string;
  error?: string;
}

export interface EnvClientConfig {
  exists: boolean;
  path: string;
  content?: string;
  parsed?: any;
  error?: string;
  parseError?: string;
  suggestion?: string;
  envsPath?: string;
  envsValidation?: T3ValidationResult;
}

export interface T3ValidationResult {
  success: boolean;
  error?: any;
  issues?: StandardSchemaV1.Issue[];
  data?: any;
}

export interface T3EnvData {
  client?: StandardSchemaDictionary;
  server?: StandardSchemaDictionary;
  shared?: StandardSchemaDictionary;
  errors?: string[];
  hasValidation?: boolean;
  type?: string;
  detected?: boolean;
  error?: string;
}

export interface EnvConfigData {
  projectPath: string;
  envClientConfig: EnvClientConfig | null;
}

export async function getEnvConfigData(
  projectDir: string
): Promise<EnvConfigData> {
  const envConfigData: EnvConfigData = {
    projectPath: path.resolve(projectDir),
    envClientConfig: null,
  };

  // Try to read env-client.config.ts
  const configPath = path.join(projectDir, "env-client.config.ts");
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, "utf-8");
      envConfigData.envClientConfig = {
        exists: true,
        path: configPath,
        content: configContent,
        parsed: null,
      };

      // Parse the config file as text to extract envsPath
      try {
        const tsContent = envConfigData.envClientConfig.content;
        if (tsContent) {
          const envsPathMatch = tsContent.match(/envsPath:\s*['"](.*?)['"]/);
          if (envsPathMatch) {
            const envsPath = envsPathMatch[1];
            envConfigData.envClientConfig.envsPath = envsPath;
            envConfigData.envClientConfig.parsed = { envsPath };
          } else {
            envConfigData.envClientConfig.parseError =
              "Could not find envsPath in configuration";
          }
        }
      } catch (parseError) {
        envConfigData.envClientConfig.parseError = `Failed to parse config content: ${parseError}`;
      }
    } catch (error) {
      envConfigData.envClientConfig = {
        exists: true,
        path: configPath,
        error: `Failed to read config: ${error}`,
      };
    }
  } else {
    envConfigData.envClientConfig = {
      exists: false,
      path: configPath,
      suggestion:
        "Create env-client.config.ts to get detailed environment variable analysis",
    };
  }

  return envConfigData;
}

function parseEnvFile(content: string): Record<string, string> {
  const variables: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        variables[key.trim()] = value;
      }
    }
  }

  return variables;
}
