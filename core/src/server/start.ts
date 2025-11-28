import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { consola } from "consola";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

interface StartServerOptions {
  relativePathDir: string;
  port: number;
  verbose: boolean;
}

export async function startServer({ relativePathDir, port, verbose }: StartServerOptions) {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = "localhost";
  
  // Get current file directory in ESM
  const currentFileUrl = import.meta.url;
  const currentFileDir = path.dirname(fileURLToPath(currentFileUrl));
  
  // In development, we're running from src/server/start.ts, so go up to project root
  // In production, we're in dist/server/start.js, so also go up to project root
  const nextJsAppDir = path.resolve(currentFileDir, "..", "..");
  
  if (verbose) {
    consola.info(`Starting Next.js app from: ${nextJsAppDir}`);
    consola.info(`Scanning for environment files in: ${path.resolve(relativePathDir)}`);
  }

  const app = next({ 
    dev, 
    hostname, 
    port,
    dir: nextJsAppDir
  });
  
  const handle = app.getRequestHandler();

  try {
    await app.prepare();
    
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        
        if (parsedUrl.pathname === "/api/env") {
          const envData = await getEnvironmentData(relativePathDir);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(envData));
          return;
        }
        
        await handle(req, res, parsedUrl);
      } catch (err) {
        consola.error("Error occurred handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(port, hostname, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    consola.success(`🚀 Server ready at http://${hostname}:${port}`);
    consola.info(`📁 Scanning directory: ${path.resolve(relativePathDir)}`);
    
    return server;
  } catch (error) {
    consola.error("Failed to start server:", error);
    throw error;
  }
}

async function getEnvironmentData(projectDir: string) {
  const envFiles = [
    ".env",
    ".env.local", 
    ".env.development",
    ".env.production"
  ];
  
  const envData: Record<string, any> = {
    projectPath: path.resolve(projectDir),
    files: {},
    variables: {}
  };

  for (const file of envFiles) {
    const filePath = path.join(projectDir, file);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const variables = parseEnvFile(content);
        
        envData.files[file] = {
          exists: true,
          path: filePath,
          variables: Object.keys(variables),
          content: content
        };
        
        Object.assign(envData.variables, variables);
      } catch (error) {
        envData.files[file] = {
          exists: true,
          path: filePath,
          error: `Failed to read: ${error}`
        };
      }
    } else {
      envData.files[file] = {
        exists: false,
        path: filePath
      };
    }
  }

  envData.processEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => 
      !key.startsWith('_') && 
      !['PATH', 'HOME', 'USER', 'SHELL'].includes(key)
    )
  );

  return envData;
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