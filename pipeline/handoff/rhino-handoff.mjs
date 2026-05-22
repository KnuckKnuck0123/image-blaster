#!/usr/bin/env node
import { copyFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureDir, one, parseArgs, pathExists, readJson, writeJson } from "../asset-pipeline/fal-queue.mjs";
import { parseIndexedName } from "../asset-pipeline/request-metadata.mjs";
import { exportRhinoPly } from "../splats/export-rhino-ply.mjs";

const DENSITY_ORDER = ["500k", "150k", "100k", "full_res"];

function usage() {
  return "Usage: node pipeline/handoff/rhino-handoff.mjs --world <world-slug> [--density 150k|500k|100k|full_res]";
}

async function copyIfExists(from, to) {
  if (!(await pathExists(from))) return undefined;
  await ensureDir(path.dirname(to));
  await copyFile(from, to);
  return to;
}

async function latestWorldIndex(worldOutputDir) {
  const entries = await readdir(worldOutputDir, { withFileTypes: true }).catch(() => []);
  const worlds = entries
    .filter((entry) => entry.isFile())
    .map((entry) => parseIndexedName(entry.name))
    .filter((entry) => entry?.slug === "world" && entry.extension === ".json" && !entry.hidden);
  return worlds.sort((a, b) => b.index - a.index)[0]?.index;
}

async function chooseSplat(worldOutputDir, index, density) {
  const requested = density ? [density] : DENSITY_ORDER;
  for (const candidate of requested) {
    const filePath = path.join(worldOutputDir, `${index}-world-${candidate}.ply`);
    if (await pathExists(filePath)) return { density: candidate, filePath };
  }
  throw new Error(`No PLY splat found for world index ${index}.`);
}

async function readWorldSummary(worldDir, worldOutputDir, index) {
  const project = await readJson(path.join(worldDir, "project.json")).catch(() => undefined);
  const image = await readJson(path.join(worldDir, "image.json")).catch(() => undefined);
  const request = await readJson(path.join(worldOutputDir, `.${index}-world-request.json`)).catch(() => undefined);
  return {
    project,
    prompt: image?.art_direction?.static_environment_prompt || request?.prompt || image?.literal_description,
    request_metadata: request ? path.join(worldOutputDir, `.${index}-world-request.json`) : undefined
  };
}

function rhinoNotes({ world, density, files, prompt }) {
  return [
    `# DCC Handoff: ${world}`,
    "",
    "## Rhino Import",
    "",
    "1. Import the GLB as the rough spatial mesh / scale reference.",
    "2. Import the RGB PLY as the colored point-cloud visual layer.",
    "3. Use the panorama PNG as an environment/reference image if needed.",
    "",
    "## SuperSplat Import",
    "",
    "1. Open the Gaussian splat PLY directly in SuperSplat.",
    "2. Do not use the RGB point-cloud PLY in SuperSplat; it is converted for Rhino and no longer contains Gaussian splat attributes.",
    "",
    "## Files",
    "",
    `- Mesh: ${path.basename(files.mesh)}`,
    `- Gaussian splat: ${path.basename(files.gaussian_splat)}`,
    `- RGB point cloud: ${path.basename(files.point_cloud)}`,
    `- Panorama: ${path.basename(files.panorama)}`,
    files.source_image ? `- Source image: ${path.basename(files.source_image)}` : undefined,
    "",
    "## Notes",
    "",
    `- The Gaussian splat PLY is the original ${density} splat for SuperSplat and compatible splat tooling.`,
    `- The RGB PLY was converted from the ${density} Gaussian-splat PLY.`,
    "- The GLB from World Labs is collider / preview quality. It has vertex colors, not high-resolution image textures.",
    "- For Rhino, treat the GLB as geometry context and the RGB PLY as the color/detail reference.",
    "- For SuperSplat, use the Gaussian splat PLY and ignore the RGB point-cloud PLY.",
    prompt ? `- Prompt: ${prompt}` : undefined,
    ""
  ].filter((line) => line !== undefined).join("\n");
}

export async function createRhinoHandoff({ world, density }) {
  if (!world) throw new Error(usage());

  const worldDir = path.join("worlds", world);
  const worldOutputDir = path.join(worldDir, "output", "world");
  const index = await latestWorldIndex(worldOutputDir);
  if (index === undefined) throw new Error(`No generated world found for ${world}.`);

  const handoffDir = path.join(worldDir, "handoff", "rhino");
  await ensureDir(handoffDir);

  const selectedSplat = await chooseSplat(worldOutputDir, index, density);
  const rgbSource = selectedSplat.filePath.replace(/\.ply$/i, "-rhino-rgb.ply");
  const rgbPly = await pathExists(rgbSource)
    ? rgbSource
    : (await exportRhinoPly(selectedSplat.filePath, rgbSource)).output;

  const files = {
    mesh: await copyIfExists(path.join(worldOutputDir, `${index}-world.glb`), path.join(handoffDir, `${world}-mesh.glb`)),
    gaussian_splat: await copyIfExists(selectedSplat.filePath, path.join(handoffDir, `${world}-splat-${selectedSplat.density}.ply`)),
    point_cloud: await copyIfExists(rgbPly, path.join(handoffDir, `${world}-point-cloud-${selectedSplat.density}-rgb.ply`)),
    panorama: await copyIfExists(path.join(worldOutputDir, `${index}-world-pano.png`), path.join(handoffDir, `${world}-panorama.png`)),
    source_image: await copyIfExists(path.join(worldOutputDir, `${index}-world-plate.jpg`), path.join(handoffDir, `${world}-source-plate.jpg`))
  };

  if (!files.mesh) throw new Error("World GLB is missing; run ib:world first.");
  if (!files.gaussian_splat) throw new Error("Gaussian splat PLY is missing; run ib:world first.");
  if (!files.point_cloud) throw new Error("Rhino RGB PLY export failed.");
  if (!files.panorama) throw new Error("World panorama is missing; run ib:world first.");

  const summary = await readWorldSummary(worldDir, worldOutputDir, index);
  const manifest = {
    schema_version: 1,
    kind: "rhino_handoff",
    world,
    world_index: index,
    density: selectedSplat.density,
    created_at: new Date().toISOString(),
    files,
    source: {
      gaussian_ply: selectedSplat.filePath,
      rhino_rgb_ply: rgbPly,
      request_metadata: summary.request_metadata
    },
    notes: [
      "GLB is collider / preview quality with vertex colors, not high-resolution image textures.",
      "Gaussian splat PLY is preserved for SuperSplat and compatible splat tooling.",
      "RGB PLY is a Rhino-friendly point cloud converted from Gaussian-splat color coefficients."
    ]
  };

  const manifestPath = path.join(handoffDir, "manifest.json");
  const readmePath = path.join(handoffDir, "README.md");
  await writeJson(manifestPath, manifest);
  await writeFile(readmePath, rhinoNotes({ world, density: selectedSplat.density, files, prompt: summary.prompt }));

  return {
    world,
    handoff_dir: handoffDir,
    manifest: manifestPath,
    readme: readmePath,
    files
  };
}

async function main() {
  const { flags } = parseArgs();
  const world = one(flags, "world");
  const density = one(flags, "density");
  if (density && !["100k", "150k", "500k", "full_res"].includes(density)) {
    throw new Error("--density must be one of: 100k, 150k, 500k, full_res.");
  }
  console.log(JSON.stringify(await createRhinoHandoff({ world, density }), null, 2));
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], `file://${process.cwd()}/`).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
