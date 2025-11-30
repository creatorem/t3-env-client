"use server";

import { revalidatePath } from "next/cache";
import { writeFileSync } from "fs";
import { join } from "path";
import { Variables } from "@/lib/types";
import { getEnvConfigData } from "@/lib/env-data";
import { getEnvVariablesData } from "@/lib/env-variables";
import { getEnvsSchema } from "./envs-schema";

export type Environment = "development" | "production";

export async function reloadEnvironmentVariables(
  environment: Environment = "development"
): Promise<Variables> {
  try {
    // Get the project directory from global variable set by the server
    const projectDir = global.__PROJECT_DIR__;
    if (!projectDir) {
      throw new Error("Project directory not available");
    }

    const envConfigData = await getEnvConfigData(projectDir);
    const envVariablesData = await getEnvVariablesData(projectDir, environment);
    const envsSchemaResult = await getEnvsSchema(envConfigData);

    // Use the environment-specific variables
    const environmentVariables = envVariablesData.variables;

    const variables: Variables = {};

    // First, add all schema-defined variables
    if (envsSchemaResult.schema) {
      // Add client variables
      if (envsSchemaResult.schema.client) {
        Object.keys(envsSchemaResult.schema.client).forEach((key) => {
          variables[key] = {
            key,
            value: environmentVariables?.[key] || "",
            group: "client",
            description: "",
            required: true,
          };
        });
      }

      // Add server variables
      if (envsSchemaResult.schema.server) {
        Object.keys(envsSchemaResult.schema.server).forEach((key) => {
          variables[key] = {
            key,
            value: environmentVariables?.[key] || "",
            group: "server",
            description: "",
            required: true,
          };
        });
      }

      // Add shared variables
      if (envsSchemaResult.schema.shared) {
        Object.keys(envsSchemaResult.schema.shared).forEach((key) => {
          variables[key] = {
            key,
            value: environmentVariables?.[key] || "",
            group: "shared",
            description: "",
            required: true,
          };
        });
      }
    }

    // Then, add any environment variables that aren't in the schema
    if (environmentVariables) {
      Object.entries(environmentVariables).forEach(([key, value]) => {
        if (!variables[key]) {
          variables[key] = {
            key,
            value: value || "",
            group: "server", // Default group for unschematized variables
            description: "",
            required: false,
          };
        }
      });
    }

    // Revalidate the path to refresh the page
    revalidatePath("/");

    return variables;
  } catch (error) {
    console.error("Failed to reload environment data:", error);
    throw error;
  }
}

export async function getServerSideDataWithEnvironment(
  environment: Environment = "development"
): Promise<Variables> {
  return reloadEnvironmentVariables(environment);
}

export async function writeEnvFile(content: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the project directory from global variable set by the server
    const projectDir = global.__PROJECT_DIR__;
    if (!projectDir) {
      throw new Error("Project directory not available");
    }

    // Get the env client config to check write permissions and file path
    const envConfigData = await getEnvConfigData(projectDir);
    
    const writePermission = envConfigData.envClientConfig?.parsed?.writePermission;
    
    if (!writePermission) {
      throw new Error("Write permission is disabled in env-client.config.ts");
    }

    const envFilePath = envConfigData.envClientConfig?.parsed?.envFilePath || '.env.local';
    const fullPath = join(projectDir, envFilePath);

    // Write the content to the specified env file
    writeFileSync(fullPath, content, 'utf8');

    // Revalidate the path to refresh the page with updated data
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to write env file:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}
