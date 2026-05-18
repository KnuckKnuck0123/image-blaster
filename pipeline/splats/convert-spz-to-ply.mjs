#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadSpz, serializePly } from "spz-js";
import { one, parseArgs, pathExists } from "../asset-pipeline/fal-queue.mjs";

export async function convertSpzToPly(inputPath, outputPath) {
  if (!inputPath || !outputPath) throw new Error("inputPath and outputPath are required.");
  if (path.extname(inputPath).toLowerCase() !== ".spz") {
    throw new Error(`SPZ input expected, received: ${inputPath}`);
  }
  if (path.extname(outputPath).toLowerCase() !== ".ply") {
    throw new Error(`PLY output expected, received: ${outputPath}`);
  }

  if (await pathExists(outputPath)) return outputPath;

  const splat = await loadSpz(await readFile(inputPath));
  await writeFile(outputPath, Buffer.from(serializePly(splat)));
  return outputPath;
}

async function main() {
  const { flags } = parseArgs();
  if (flags.help) {
    console.log("Usage: node pipeline/splats/convert-spz-to-ply.mjs --input <file.spz> --output <file.ply>");
    return;
  }
  const inputPath = one(flags, "input");
  const outputPath = one(flags, "output");
  if (!inputPath || !outputPath) {
    throw new Error("Usage: node pipeline/splats/convert-spz-to-ply.mjs --input <file.spz> --output <file.ply>");
  }
  const result = await convertSpzToPly(inputPath, outputPath);
  console.log(JSON.stringify({ output: result }, null, 2));
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
