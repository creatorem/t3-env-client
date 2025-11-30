"use server";

import { getEnvConfigData } from "@/lib/env-data";
import { getEnvsSchema } from "./envs-schema";

type Issue = {
  message: string;
  path: readonly (string | number)[];
};

export const validate = async (variables: Record<string, unknown>) => {
  try {
    // Get the project directory from global variable set by the server
    const projectDir = global.__PROJECT_DIR__;
    if (!projectDir) {
      throw new Error("Project directory not available");
    }

    const envConfigData = await getEnvConfigData(projectDir);
    const envsSchemaResult = await getEnvsSchema(envConfigData);

    if (!envsSchemaResult.schema) {
      return {
        issues: [],
      };
    }

    const issues: Issue[] = [];

    // Validate each variable group
    const validateGroup = (groupSchema: any, groupName: string) => {
      if (!groupSchema) return;

      Object.entries(groupSchema).forEach(([key, schema]: [string, any]) => {
        const value = variables[key];

        try {
          // Try to parse with the schema
          if (schema && typeof schema.parse === "function") {
            schema.parse(value);
          } else if (schema && typeof schema.safeParse === "function") {
            const result = schema.safeParse(value);
            if (!result.success) {
              result.error.issues.forEach((issue: any) => {
                issues.push({
                  message: issue.message || `Invalid value for ${key}`,
                  path: [key],
                });
              });
            }
          }
        } catch (error: any) {
          // Handle Zod validation errors
          if (error.issues) {
            error.issues.forEach((issue: any) => {
              issues.push({
                message: issue.message || `Invalid value for ${key}`,
                path: [key],
              });
            });
          } else {
            issues.push({
              message: error.message || `Invalid value for ${key}`,
              path: [key],
            });
          }
        }
      });
    };

    // Validate each group
    validateGroup(envsSchemaResult.schema.client, "client");
    validateGroup(envsSchemaResult.schema.server, "server");
    validateGroup(envsSchemaResult.schema.shared, "shared");

    console.log({ issues });

    return {
      issues,
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      issues: [],
    };
  }
};
