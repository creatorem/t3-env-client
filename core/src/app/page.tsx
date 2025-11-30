import { EnvClient } from "../components/env-client";
import { EnvironmentProvider } from "../components/environment/context";
import type { Environment } from "../lib/actions";
import { getEnvConfigData } from "../lib/env-data";
import { getEnvVariables } from "../lib/env-variables";
import { getEnvsSchema } from "../lib/envs-schema";
import type { Variables } from "../lib/types";

async function getServerSideData(): Promise<Variables> {
  try {
    // Get the project directory from global variable set by the server
    const projectDir = global.__PROJECT_DIR__;
    if (!projectDir) {
      throw new Error("Project directory not available");
    }

    const envConfigData = await getEnvConfigData(projectDir);
    const envVariables = await getEnvVariables(projectDir);
    const envsSchemaResult = await getEnvsSchema(envConfigData);

    const variables: Variables = {};

    // First, add all schema-defined variables
    if (envsSchemaResult.schema) {
      // Add client variables
      if (envsSchemaResult.schema.client) {
        Object.keys(envsSchemaResult.schema.client).forEach((key) => {
          variables[key] = {
            key,
            value: envVariables?.[key] || "",
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
            value: envVariables?.[key] || "",
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
            value: envVariables?.[key] || "",
            group: "shared",
            description: "",
            required: true,
          };
        });
      }
    }

    // Then, add any environment variables that aren't in the schema
    if (envVariables) {
      Object.entries(envVariables).forEach(([key, value]) => {
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
    console.log( {envConfigData} )

    return variables;
  } catch (error) {
    console.error("Failed to load environment data:", error);
    return {};
  }
}

export default async function Home() {
  const variables = await getServerSideData();
  const initialEnvironment: Environment = "development"; // Default to development

  return (
    <EnvironmentProvider
      initialEnvironment={initialEnvironment}
      initialVariables={variables}
    >
      <EnvClient variables={variables} />
    </EnvironmentProvider>
  );
}
