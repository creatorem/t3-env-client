import next from "next";
import { getEnvConfigData } from "../lib/env-data.js";
import { getEnvVariablesData } from "../lib/env-variables.js";
import chalk from "chalk";
import { consola } from "consola";
import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { parse } from "node:url";
import { fileURLToPath } from "node:url";

// Global variable to store the project directory for Next.js pages
global.__PROJECT_DIR__ = "";

interface StartServerOptions {
  relativePathDir: string;
  port: number;
  verbose: boolean;
}

export async function startServer({
  relativePathDir,
  port,
  verbose,
}: StartServerOptions) {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = "localhost";

  consola.log(chalk.greenBright(`\n  T3-env-client 1.0.0`));
  consola.log(`  Started at:    http://${hostname}:${port}\n`);
  consola.info(`📁 Scanning directory: ${path.resolve(relativePathDir)}`);

  // Store the project directory globally for Next.js pages to access
  global.__PROJECT_DIR__ = path.resolve(relativePathDir);

  // Get current file directory in ESM
  const currentFileUrl = import.meta.url;
  const currentFileDir = path.dirname(fileURLToPath(currentFileUrl));

  // In development, we're running from src/server/start.ts, so go up to project root
  // In production, we're in dist/server/start.js, so also go up to project root
  const nextJsAppDir = path.resolve(currentFileDir, "..", "..");

  if (verbose) {
    consola.info(`Starting Next.js app from: ${nextJsAppDir}`);
    consola.info(
      `Scanning for environment files in: ${path.resolve(relativePathDir)}`
    );
  }

  const app = next({
    dev,
    hostname,
    port,
    dir: nextJsAppDir,
  });

  const handle = app.getRequestHandler();

  try {
    await app.prepare();

    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);

        if (parsedUrl.pathname === "/api/env") {
          // Get both config and variables data
          const envConfigData = await getEnvConfigData(relativePathDir);
          const envVariablesData = await getEnvVariablesData(relativePathDir);

          // Combine for backward compatibility (if needed by any external consumers)
          const combinedData = {
            envConfigData,
            envVariablesData,
            // Legacy format for backward compatibility
            projectPath: envConfigData.projectPath,
            envClientConfig: envConfigData.envClientConfig,
            files: envVariablesData.files,
            variables: envVariablesData.variables,
            processEnv: envVariablesData.processEnv,
          };

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(combinedData));
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

    return server;
  } catch (error) {
    consola.error("Failed to start server:", error);
    throw error;
  }
}
