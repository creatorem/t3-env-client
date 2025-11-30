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
import { version } from "../../package.json";

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
  // Get current file directory in ESM
  const currentFileUrl = import.meta.url;
  const currentFileDir = path.dirname(fileURLToPath(currentFileUrl));
  
  // Check if running from node_modules (production) or source directory (development)
  const isInstalledPackage = currentFileDir.includes('node_modules');
  const dev = !isInstalledPackage && process.env.NODE_ENV !== "production";
  const hostname = "localhost";

  consola.log(chalk.greenBright(`\n  T3-env-client ${version}`));
  consola.log(`  Started at:    http://${hostname}:${port}\n`);

  // Store the project directory globally for Next.js pages to access
  global.__PROJECT_DIR__ = path.resolve(relativePathDir);
  
  
  consola.log('dev : ' + dev)
  consola.log('currentFileUrl : ' + currentFileUrl)
  consola.log('currentFileDir : ' + currentFileDir)

  // Find the package root (directory containing package.json)
  let packageRoot = currentFileDir;
  while (packageRoot !== path.dirname(packageRoot)) {
    if (fs.existsSync(path.join(packageRoot, "package.json"))) {
      break;
    }
    packageRoot = path.dirname(packageRoot);
  }

  // The Next.js app should be in the package root (where .next directory is built)
  const nextJsAppDir = packageRoot;

  if (verbose) {
    consola.info(`Starting Next.js app from: ${nextJsAppDir}`);
    consola.info(
      `Scanning for environment files in: ${path.resolve(relativePathDir)}`
    );
  }

  consola.log('nextJsAppDir : ' + nextJsAppDir)
  consola.log('dev : ' + dev)
  consola.log('hostname : ' + hostname)

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

        // if (parsedUrl.pathname === "/api/env") {
        //   // Get both config and variables data
        //   const envConfigData = await getEnvConfigData(relativePathDir);
        //   const envVariablesData = await getEnvVariablesData(relativePathDir);

        //   // Combine for backward compatibility (if needed by any external consumers)
        //   const combinedData = {
        //     envConfigData,
        //     envVariablesData,
        //     // Legacy format for backward compatibility
        //     projectPath: envConfigData.projectPath,
        //     envClientConfig: envConfigData.envClientConfig,
        //     files: envVariablesData.files,
        //     variables: envVariablesData.variables,
        //     processEnv: envVariablesData.processEnv,
        //   };

        //   res.writeHead(200, { "Content-Type": "application/json" });
        //   res.end(JSON.stringify(combinedData));
        //   return;
        // }

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
