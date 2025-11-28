import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/cli/index.ts"],
  outDir: "dist/cli",
  dts: false,
  format: ["esm"],
});
