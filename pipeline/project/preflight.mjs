#!/usr/bin/env node
import { loadDotEnv, one, parseArgs } from "../asset-pipeline/fal-queue.mjs";

const PROVIDERS = [
  {
    name: "World Labs",
    key: "WORLD_LABS_API_KEY",
    stages: ["world generation", "Gaussian splat environment", "collider mesh", "panorama"],
    costs: [
      "marble-1.1 from normal image: about $1.26 per world",
      "marble-1.0-draft from normal image: about $0.18 per world"
    ]
  },
  {
    name: "FAL",
    key: "FAL_KEY",
    stages: ["Hunyuan/Meshy object meshes", "image edits", "SFX"],
    costs: [
      "Hunyuan3D v3: $0.375 base, plus optional add-ons",
      "Meshy v6: about $0.80 per object",
      "Nano Banana 2 edit: about $0.08 per 1K image",
      "ElevenLabs SFX: about $0.002 per second"
    ]
  }
];

function masked(value) {
  if (!value) return undefined;
  if (value.length <= 8) return "set";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function providerStatus(provider) {
  const value = process.env[provider.key];
  return {
    provider: provider.name,
    key: provider.key,
    ready: Boolean(value),
    ...(value ? { masked_value: masked(value) } : {}),
    stages: provider.stages,
    cost_notes: provider.costs
  };
}

function summarize(statuses) {
  return {
    ready: statuses.every((status) => status.ready),
    world_generation_ready: statuses.find((status) => status.key === "WORLD_LABS_API_KEY")?.ready ?? false,
    fal_generation_ready: statuses.find((status) => status.key === "FAL_KEY")?.ready ?? false,
    free_local_work: [
      "project setup",
      "local viewer",
      "adapter docs",
      "metadata inspection",
      "download repair for already available URLs",
      "SPZ to PLY conversion"
    ],
    providers: statuses
  };
}

async function main() {
  const { flags } = parseArgs();
  const envPath = one(flags, "env", ".env");
  await loadDotEnv(envPath);

  const statuses = PROVIDERS.map(providerStatus);
  const result = summarize(statuses);

  if (flags.strict && !result.ready) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
