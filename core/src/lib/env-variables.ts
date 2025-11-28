import path from "node:path";
import fs from "node:fs";

export interface EnvFile {
  exists: boolean;
  path: string;
  variables?: string[];
  content?: string;
  error?: string;
}

export interface EnvVariablesData {
  projectPath: string;
  files: Record<string, EnvFile>;
  variables: Record<string, string>;
  processEnv: Record<string, string>;
}

export async function getEnvVariables(projectDir: string): Promise<Record<string, string>> {
  const envVariablesData = await getEnvVariablesData(projectDir);
  return envVariablesData.variables;
}

export async function getEnvVariablesData(projectDir: string): Promise<EnvVariablesData> {
  const envFiles = [
    ".env",
    ".env.local", 
    ".env.development",
    ".env.production"
  ];
  
  const envVariablesData: EnvVariablesData = {
    projectPath: path.resolve(projectDir),
    files: {},
    variables: {},
    processEnv: {}
  };

  // Scan environment files
  for (const file of envFiles) {
    const filePath = path.join(projectDir, file);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const variables = parseEnvFile(content);
        
        envVariablesData.files[file] = {
          exists: true,
          path: filePath,
          variables: Object.keys(variables),
          content: content
        };
        
        Object.assign(envVariablesData.variables, variables);
      } catch (error) {
        envVariablesData.files[file] = {
          exists: true,
          path: filePath,
          error: `Failed to read: ${error}`
        };
      }
    } else {
      envVariablesData.files[file] = {
        exists: false,
        path: filePath
      };
    }
  }

  // Get filtered process environment
  envVariablesData.processEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => 
      !key.startsWith('_') && 
      !['PATH', 'HOME', 'USER', 'SHELL'].includes(key)
    )
  );

  return envVariablesData;
}

function parseEnvFile(content: string): Record<string, string> {
  const variables: Record<string, string> = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        variables[key.trim()] = value;
      }
    }
  }
  
  return variables;
}