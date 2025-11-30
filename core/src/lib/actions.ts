"use server";

import { revalidatePath } from "next/cache";
import { getEnvConfigData } from "./env-data";
import { getEnvVariablesData } from "./env-variables";
import { getEnvsSchema } from "./envs-schema";
import type { Variables } from "./types";

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
