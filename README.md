<img width="960" height="540" alt="image-blaster-1" src="https://github.com/user-attachments/assets/d294e420-eb48-4f00-b6a8-13005442d1a8" />

## `image-blaster`
Creates 3D environments, SFX, and meshes from a single image using portable pipeline scripts, World Labs, FAL, and thin adapters for agent shells.

Can take you from an image to a fully meshed 3D environment in < 5 minutes, great for jumpstarting 3D work. Go full blast.


## Quickstart

1. Open a Terminal, enter `git clone https://github.com/neilsonnn/image-blaster`
2. Enter the directory with `cd image-blaster`
3. Configure provider keys in your shell, including [World Labs](https://platform.worldlabs.ai/) and [FAL](https://fal.ai/).
4. Put an image into the `input/` directory.
5. Use an adapter in `adapters/`, or run the portable commands directly with `npm run ib:* --`.

Available agent adapters:

- `adapters/openclaw/image-blaster/SKILL.md`
- `adapters/codex/image-blaster/SKILL.md`
- `adapters/gemini/image-blaster.md`

Portable setup command:

```bash
npm run ib:preflight
npm run ib:project -- --world "my-world" --stage-input
```

`ib:preflight` reads `.env`, reports whether `WORLD_LABS_API_KEY` and `FAL_KEY` are present, and prints the rough cost envelope for each paid provider before generation.

## Use Without An Agent

Run the portable pipeline commands directly from the repository root. This is the best path when you already know the source image, world slug, and prompt.

1. Add provider keys to a local `.env` file:

```bash
cp .env.example .env
```

```env
WORLD_LABS_API_KEY=...
FAL_KEY=...
```

2. Check readiness:

```bash
npm run ib:preflight
```

Use `--strict` when automation should fail on missing keys.

3. Create a world project and stage an input image:

```bash
mkdir -p input
cp /path/to/source-image.jpg input/
npm run ib:project -- --world "my-world" --stage-input
```

4. Generate the static world:

```bash
npm run ib:world -- --world "my-world" --prompt "Empty static environment prompt"
```

World splats default to PLY. Use `--splat-format both` only when you need both PLY and SPZ.

5. Launch the viewer:

```bash
npm run dev
```

Open `http://127.0.0.1:5173/my-world`.

6. Package a Rhino handoff:

```bash
npm run ib:rhino-handoff -- --world "my-world"
```

This writes `worlds/my-world/handoff/rhino/` with a GLB mesh, original Gaussian splat PLY, Rhino RGB point-cloud PLY, panorama, manifest, and import notes.

## Use With An Agent

Agents should use the same `npm run ib:*` commands. The agent's job is planning, image analysis, prompt writing, confirmation before paid calls, and reporting artifact paths. The pipeline owns provider calls and file layout.

Recommended agent flow:

1. Run `npm run ib:preflight` before paid generation.
2. Choose a stable slug for `worlds/<slug>/`.
3. Stage the source image through `npm run ib:project -- --world "<slug>" --stage-input`, or place it directly in `worlds/<slug>/source/`.
4. Analyze the source image and write `worlds/<slug>/image.json`.
5. Generate an empty static environment with `npm run ib:world -- --world "<slug>" --prompt "..."`.
6. Generate dynamic props one at a time with `npm run ib:3d -- --world "<slug>" --object-id "<object-slug>"`.
7. Use `npm run ib:rhino-handoff -- --world "<slug>"` when the target is Rhino.
8. Report local artifact paths and any provider/request metadata needed for audit.

Available agent adapters:

- `adapters/openclaw/image-blaster/SKILL.md`
- `adapters/codex/image-blaster/SKILL.md`
- `adapters/gemini/image-blaster.md`

### Description

By default `image-blaster` will use your input image to create:

1. 3D models (`.glb`, `.obj`) of all *dynamic* objects
2. Gaussian splat (`.ply`) of the *static* environment,
3. Ambient looping sound and object specific physics SFX (`.mp3`)

### Extensions

You can embed `image-blaster` under the assets of *any game engine, DCC software, or web app*.

1. Unity, Unreal, or Godot game engine
2. Blender, 3DS Max, or Maya or other DCC software
3. Three.js web app or Electron app

## Advanced

IMAGE-BLASTER uses a few generation models:

- `marble-1.1` - World Labs Marble model creates the explorable environment.
- `nano-banana` - default image edit preference for source cleanup, clean plates, and object reference images.
- `gpt-image-2` - alternate image edit provider when the edit skill is asked to prefer it.
- `hunyuan-3d` - Hunyuan 3D model creates 3D object models through FAL.
- `elevenlabs-sfx` - ElevenLabs sound effects model creates ambient and object-specific sounds.

World generation defaults to `.ply` splat exports for broader DCC and engine compatibility. If World Labs returns native PLY URLs, the pipeline downloads those directly; otherwise it converts the returned SPZ splats to PLY locally. Use `--splat-format spz` or `--splat-format both` when you explicitly need compressed SPZ artifacts.

Rhino and some DCC tools do not understand Gaussian-splat PLY color fields such as `f_dc_0`, `f_dc_1`, and `f_dc_2`. Use `ib:rhino-ply` to convert a splat PLY into a standard RGB point-cloud PLY, or `ib:rhino-handoff` to package the collider GLB, original Gaussian splat PLY for SuperSplat, RGB point cloud for Rhino, panorama, manifest, and import notes:

```bash
npm run ib:rhino-ply -- --input worlds/my-world/output/world/0-world-500k.ply
npm run ib:rhino-handoff -- --world my-world
```

3D model creation supports these Hunyuan parameters:

- `--face-count <40000-1500000>`: target face count. IMAGE-BLASTER defaults to `50000`; Hunyuan's API default is `500000`.
- `--enable-pbr true|false`: enable PBR material generation. Defaults to `true`.
- `--generate-type Normal|LowPoly|Geometry`: `Normal` creates a textured model, `LowPoly` applies polygon reduction, and `Geometry` creates a white geometry-only model. Defaults to `Normal`.
- `--polygon-type triangle|quadrilateral`: polygon type for `LowPoly`. Defaults to `triangle`.

### Examples

- Video game level concepts? `IMAGE-BLAST` it.
- Your childhood bedroom? `IMAGE-BLAST` it.
- Need an environment for a robot? `IMAGE-BLAST` it.
- A film location scout? `IMAGE-BLAST` it.
- An architectural rendering? `IMAGE-BLAST` it.

### Development

The core scripts live in `pipeline/`. Existing `.claude/` skills remain for backward compatibility, but new agent support should use `docs/agent-workflow.md` and `adapters/`.
