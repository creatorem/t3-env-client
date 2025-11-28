"use server";

import path from "node:path";
import vm from "node:vm";
import fs from "node:fs";
import { deduceEnvsPath } from "./envs-handler";
import type { EnvConfigData } from "./env-data";

export interface EnvSchemaResult {
  success: boolean;
  schema?: {
    client?: Record<string, any>;
    server?: Record<string, any>;
    shared?: Record<string, any>;
  };
  error?: string;
  zodError?: {
    issues: Array<{
      code: string;
      path: string[];
      message: string;
    }>;
  };
  envs?: any;
}

// Mock createEnv function that captures the schema instead of validating
const mockCreateEnv = (options: any) => {
  return {
    _schema: {
      client: options.client || {},
      server: options.server || {},
      shared: options.shared || {}
    },
    _options: options
  };
};

// Internal modules for VM context
const internalModules = {
  "@t3-oss/env-nextjs": {
    createEnv: mockCreateEnv
  },
  "zod": require("zod")
} as const;

// Validate that the code is running on server side
function validateServerSide(): EnvSchemaResult | null {
  if (typeof window !== 'undefined') {
    return {
      success: false,
      error: "Schema extraction is only available on the server side"
    };
  }
  return null;
}

// Resolve and validate the envs file path
function resolveEnvsFilePath(envConfigData: EnvConfigData): EnvSchemaResult | string {
  const envsFilePath = deduceEnvsPath(envConfigData);
  if (!envsFilePath) {
    return {
      success: false,
      error: "Could not determine envs file path from config data"
    };
  }

  if (!fs.existsSync(envsFilePath)) {
    return {
      success: false,
      error: `Envs file not found: ${envsFilePath}`
    };
  }

  return envsFilePath;
}

// Import esbuild dynamically to avoid bundling issues
async function importEsbuild(): Promise<EnvSchemaResult | any> {
  try {
    const esbuildModule = await import('esbuild');
    return {
      build: esbuildModule.build,
      OutputFile: esbuildModule.OutputFile,
      BuildFailure: esbuildModule.BuildFailure
    };
  } catch (importError) {
    return {
      success: false,
      error: `Failed to import esbuild: ${importError}`
    };
  }
}

// Build TypeScript file using esbuild
async function buildTypeScriptFile(envsFilePath: string, build: any): Promise<EnvSchemaResult | any[]> {
  try {
    const buildData = await build({
      bundle: true,
      entryPoints: [envsFilePath],
      platform: "node",
      write: false,
      format: "cjs",
      logLevel: "silent",
      define: {
        "import.meta.env": "process.env",
      },
      outdir: "stdout",
      sourcemap: "external",
      external: ["@t3-oss/env-nextjs", "zod"]
    });
    
    return buildData.outputFiles;
  } catch (exception) {
    const buildFailure = exception as any;
    return {
      success: false,
      error: `Build failure: ${buildFailure.message}`
    };
  }
}

// Create VM context for safe code execution
function createVMContext(envsFilePath: string): any {
  return {
    ...global,
    console,
    Buffer,
    process,
    module: {
      exports: {},
    },
    __filename: envsFilePath,
    __dirname: path.dirname(envsFilePath),
    require: (specifiedModule: string) => {
      let m = specifiedModule;
      if (specifiedModule.startsWith("node:")) {
        m = m.split(":")[1] ?? "";
      }

      if (m in internalModules) {
        return internalModules[m as keyof typeof internalModules];
      }

      try {
        return require(specifiedModule);
      } catch (error) {
        // If module not found, return empty object to prevent crashes
        return {};
      }
    },
  };
}

// Execute bundled code in VM and handle errors
function executeInVM(builtCode: string, context: any, envsFilePath: string): EnvSchemaResult | any {
  try {
    vm.runInNewContext(builtCode, context, { filename: envsFilePath });
    return context.module.exports;
  } catch (exception: any) {
    // Check if it's a Zod validation error
    if (exception?.issues) {
      return {
        success: false,
        zodError: {
          issues: exception.issues.map((issue: any) => ({
            code: issue.code || 'unknown',
            path: issue.path || [],
            message: issue.message || 'Validation error'
          }))
        },
        error: "Zod validation failed for environment variables"
      };
    }

    return {
      success: false,
      error: `Runtime error: ${exception.message}`
    };
  }
}

// Extract schema from executed module
function extractSchema(moduleExports: any): EnvSchemaResult {
  const envs = moduleExports.envs || moduleExports.default || moduleExports;

  if (!envs) {
    return {
      success: false,
      error: "No envs export found in module"
    };
  }

  // Check if we captured the schema from our mock
  if (envs._schema) {
    return {
      success: true,
      schema: envs._schema,
      envs: envs
    };
  }

  // If no schema was captured, the envs might be the actual T3 env object
  return {
    success: true,
    envs: envs,
    error: "Schema structure not captured - envs object available but schema not extracted"
  };
}

export async function getEnvsSchema(envConfigData: EnvConfigData): Promise<EnvSchemaResult> {
  try {
    // 1. Validate server-side execution
    const serverSideError = validateServerSide();
    if (serverSideError) return serverSideError;

    // 2. Resolve and validate envs file path
    const envsFilePathResult = resolveEnvsFilePath(envConfigData);
    if (typeof envsFilePathResult !== 'string') return envsFilePathResult;
    const envsFilePath = envsFilePathResult;

    // 3. Import esbuild dynamically
    const esbuildResult = await importEsbuild();
    if (esbuildResult.success === false) return esbuildResult;
    const { build } = esbuildResult;

    // 4. Build TypeScript file
    const buildResult = await buildTypeScriptFile(envsFilePath, build);
    if (!Array.isArray(buildResult)) return buildResult;
    const outputFiles = buildResult;

    // 5. Extract bundled JavaScript code
    const bundledFile = outputFiles.find(file => file.path.endsWith('.js'));
    if (!bundledFile) {
      return {
        success: false,
        error: "No JavaScript output file found"
      };
    }
    const builtCode = bundledFile.text;

    // 6. Create VM context and execute code
    const context = createVMContext(envsFilePath);
    const executionResult = executeInVM(builtCode, context, envsFilePath);
    if (executionResult.success === false) return executionResult;
    const moduleExports = executionResult;

    // 7. Extract schema from executed module
    return extractSchema(moduleExports);

  } catch (error: any) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}