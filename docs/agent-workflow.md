# Agent Workflow

`image-blaster` is being split into a portable pipeline plus thin agent adapters.

## Contract

Agents should treat `pipeline/` as the stable execution layer and `worlds/<slug>/` as the shared artifact envelope. Do not write runtime state into prompts or adapter files. Persist project state, analysis, request metadata, generated assets, and local downloads under the world directory.

## Project Shape

```text
worlds/<slug>/
  project.json
  scene.json
  image.json
  source/
  output/
    world/
    sfx/
    <object-slug>/
```

`project.json` holds identity. `image.json` and `source/*.json` hold image analysis. Object intent lives in `output/<object-slug>/object.json`. Generated files and hidden request JSON live beside the artifact they describe.

## Portable Commands

Run these from the repository root:

```bash
npm run ib:project -- --world "<slug>" --stage-input
npm run ib:world -- --world "<slug>" --prompt "<empty static environment prompt>"
npm run ib:3d -- --world "<slug>" --object-id "<object-slug>"
npm run ib:sfx -- --prompt "<literal sound prompt>" --output-dir "worlds/<slug>/output/sfx"
npm run ib:image-edit -- --image "<path>" --prompt "<edit prompt>" --output-dir "<dir>"
npm run ib:ensure-assets -- --from "<request-json-path>"
```

The aliases call `node pipeline/...` directly. Existing Claude skills remain as backward-compatible adapters while new agents should use these neutral commands.

World splats default to `.ply` for compatibility with Blender, Houdini, Unity, Unreal, Spark, and other Gaussian-splat tooling. `ib:world` and `ib:ensure-assets` accept `--splat-format ply|spz|both`; use `ply` unless a downstream target specifically needs compressed SPZ.

## Agent Responsibilities

- Resolve one world slug before running generation commands.
- Stage input images through `ib:project` so paths are stable.
- Analyze images literally and write JSON before paid generation.
- Ask before paid provider calls when the exact operation is ambiguous.
- Keep provider keys in the local environment; do not write secrets to project files.
- Ensure provider URLs are downloaded into local files before reporting success.

## Provider Boundary

The current first-class remote providers are World Labs, FAL/Hunyuan or Meshy, FAL image edit providers, and ElevenLabs SFX through FAL. The agent adapter decides how to plan and confirm work; the pipeline scripts own provider calls, metadata, polling, and downloads.
