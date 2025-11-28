#!/usr/bin/env node
import { program } from "commander";
import fs from "node:fs";
import { consola } from "consola";

import { version } from "../../package.json";
import { startServer } from "../server/start";

interface CliArgs {
  dir: string;
  port: string;
  verbose: boolean;
}

const start = async ({ dir: relativePathDir, port, verbose }: CliArgs) => {
  try {
    if (verbose) {
      consola.debug("Starting t3-env-client start cmd...", {
        cwd: process.cwd(),
        dir: relativePathDir,
        port,
      });
    }

    if (!fs.existsSync(relativePathDir)) {
      consola.error(`No ${relativePathDir} folder found.`);
      process.exit(1);
    }

    await startServer({
      relativePathDir,
      port: Number.parseInt(port),
      verbose,
    });

    if (verbose) {
      consola.success("Server successfully started.");
    }

  } catch (error) {
    consola.error(new Error("An error has occured running start command."), error);
    process.exit(1);
  }
};


program
  .name('t3-env-client')
  .description(
    "A live preview client to set your environment variables and help you setup a devlopment project."
  )
  .version(version);

program
  // .command('start')
  .description("Starts the preview client.")
  .option(
    "-d, --dir <path>",
    "Directory path to your t3 env file.",
    "./",
  )
  .option("-p --port <port>", "Port to run server on", "3010")
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(start);

program.parse();
