# Agent Workflow

`image-blaster` is being split into a portable pipeline plus thin agent adapters.

## Contract

Agents should treat `pipeline/` as the stable execution layer and `worlds/<slug>/` as the shared artifact envelope. Do not write runtime state into prompts or adapter files. Persist project state, analysis, request metadata, generated assets, and local downloads under the world directory.

The same pipeline must work with or without an agent. Direct users run `npm run ib:*` commands by hand. Agents run those same commands after adding planning, source-image analysis, prompt writing, and confirmation around paid provider calls.

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
npm run ib:preflight
npm run ib:project -- --world "<slug>" --stage-input
npm run ib:world -- --world "<slug>" --prompt "<empty static environment prompt>"
npm run ib:3d -- --world "<slug>" --object-id "<object-slug>"
npm run ib:sfx -- --prompt "<literal sound prompt>" --output-dir "worlds/<slug>/output/sfx"
npm run ib:image-edit -- --image "<path>" --prompt "<edit prompt>" --output-dir "<dir>"
npm run ib:ensure-assets -- --from "<request-json-path>"
npm run ib:rhino-ply -- --input "worlds/<slug>/output/world/0-world-500k.ply"
npm run ib:rhino-handoff -- --world "<slug>"
```

The aliases call `node pipeline/...` directly. Existing Claude skills remain as backward-compatible adapters while new agents should use these neutral commands. Current first-class adapters live in `adapters/openclaw/`, `adapters/codex/`, and `adapters/gemini/`.

World splats default to `.ply` for compatibility with Blender, Houdini, Unity, Unreal, Spark, and other Gaussian-splat tooling. `ib:world` and `ib:ensure-assets` accept `--splat-format ply|spz|both`; use `ply` unless a downstream target specifically needs compressed SPZ.

For Rhino, convert Gaussian-splat PLY files to ordinary RGB point-cloud PLY files before import. `ib:rhino-ply` converts one file. `ib:rhino-handoff` creates `worlds/<slug>/handoff/rhino/` with the collider GLB, original Gaussian splat PLY for SuperSplat, RGB point cloud for Rhino, panorama, manifest, and import notes. The default handoff prefers the `500k` point cloud for visual fidelity; pass `--density 150k` or `--density 100k` for lighter files.

Run `ib:preflight` before paid work. It loads `.env`, reports which provider keys are present, shows which stages are ready, and prints rough per-operation cost notes. Use `--strict` in automation to fail when required generation keys are missing.

## Direct CLI Workflow

Use this path when a human is driving the pipeline from a terminal:

1. Copy `.env.example` to `.env` and fill `WORLD_LABS_API_KEY` and `FAL_KEY`.
2. Put source images in `input/`.
3. Run `npm run ib:preflight`.
4. Run `npm run ib:project -- --world "<slug>" --stage-input`.
5. Run `npm run ib:world -- --world "<slug>" --prompt "<empty static environment prompt>"`.
6. Optionally run `npm run ib:3d`, `npm run ib:sfx`, or `npm run ib:image-edit`.
7. Run `npm run dev` and open `http://127.0.0.1:5173/<slug>`.
8. For Rhino, run `npm run ib:rhino-handoff -- --world "<slug>"`.

The user owns all judgment calls: what image to use, what to generate, when to spend provider credits, and which artifacts to import downstream.

## Agent-Assisted Workflow

Use this path when an agent is driving the pipeline:

1. Inspect readiness with `ib:preflight`; do not expose secret values.
2. Choose one slug and keep all state under `worlds/<slug>/`.
3. Stage or copy source images into `worlds/<slug>/source/`.
4. Analyze the source image before paid generation and write `worlds/<slug>/image.json`.
5. Split the prompt into static environment versus movable objects.
6. Ask for confirmation before ambiguous paid operations.
7. Generate the static environment with `ib:world`.
8. Generate each movable object separately with `ib:3d`.
9. Run handoff commands for the user's target tool, such as `ib:rhino-handoff`.
10. Report local files, route, request metadata, and unresolved risks.

The agent should not invent a separate artifact layout. It should add decisions and documentation around the same portable commands a human can run manually.

## Rhino Handoff

`ib:rhino-handoff` is for Rhino-centered design review, not game-runtime delivery. It packages:

- `<slug>-mesh.glb`: rough spatial mesh / scale scaffold.
- `<slug>-splat-500k.ply`: original Gaussian splat for SuperSplat and compatible splat tooling.
- `<slug>-point-cloud-500k-rgb.ply`: Rhino RGB visual/detail point cloud.
- `<slug>-panorama.png`: panorama reference or environment plate.
- `manifest.json`: machine-readable source and file record.
- `README.md`: import order and notes.

World Labs GLB exports may have vertex colors but no image textures, materials, or UVs. Treat the GLB as geometry context. Treat the RGB point cloud as the primary Rhino visual read. Treat the original Gaussian splat PLY as the SuperSplat asset; the RGB point-cloud PLY is no longer a valid Gaussian splat.

## Agent Responsibilities

- Resolve one world slug before running generation commands.
- Stage input images through `ib:project` so paths are stable.
- Analyze images literally and write JSON before paid generation.
- Ask before paid provider calls when the exact operation is ambiguous.
- Run `ib:preflight` before paid provider calls unless the current session already verified keys.
- Keep provider keys in the local environment; do not write secrets to project files.
- Ensure provider URLs are downloaded into local files before reporting success.

## Provider Boundary

The current first-class remote providers are World Labs, FAL/Hunyuan or Meshy, FAL image edit providers, and ElevenLabs SFX through FAL. The agent adapter decides how to plan and confirm work; the pipeline scripts own provider calls, metadata, polling, and downloads.
