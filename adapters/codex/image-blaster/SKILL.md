---
name: image-blaster
description: Use Image Blaster from Codex as an environment-art and generation-pipeline skill. Use for source-image analysis, art direction, image-to-world projects, World Labs environments, Gaussian splats, FAL-backed 3D props, image edits, SFX, and local viewer/project operations.
---

# Image Blaster

Use this skill from the repository root. Treat `pipeline/` as the execution layer and `worlds/<slug>/` as the durable artifact envelope.

Act as a senior environment artist plus technical pipeline operator. Preserve the source image's core read, build coherent navigable space, separate static environment from movable props, keep scale believable, and avoid paid provider calls until intent and credentials are clear.

## Codex Workflow

1. Inspect project readiness:

```bash
npm run ib:preflight
```

Use `--strict` before automation or any paid generation that should hard-block on missing keys.

2. Create or inspect a world project:

```bash
npm run ib:project -- --world "<slug>" --stage-input
```

3. Analyze source images before generation. Write literal, structured context to:
   - `worlds/<slug>/source/<image-name>.json`
   - `worlds/<slug>/image.json`

Include an `art_direction` section when useful:

```json
{
  "mood": "",
  "lighting": "",
  "palette": [],
  "materials": [],
  "static_environment_prompt": "",
  "negative_prompt": "",
  "hero_object_candidates": []
}
```

4. Separate static world from generated props:
   - Static world: floors, walls, terrain, built-ins, skyline, atmosphere, major lighting, large fixed architecture.
   - Movable props: atomic, inspectable objects that should become separate `.glb` assets.

5. Generate an empty static environment only after the prompt is specific:

```bash
npm run ib:world -- --world "<slug>" --prompt "<empty static environment prompt>"
```

World splats default to `.ply`. Use `--splat-format spz` or `--splat-format both` only when needed.

6. Generate one object at a time:

```bash
npm run ib:3d -- --world "<slug>" --object-id "<object-slug>"
```

Each `object.json` should include visual role, approximate scale, material/finish, silhouette, and reference image/edit path.

7. Generate edits and SFX only when they support the scene:

```bash
npm run ib:image-edit -- --image "<input image>" --prompt "<edit prompt>" --output-dir "<output dir>"
npm run ib:sfx -- --prompt "<sound prompt>" --output-dir "<target output dir>" --prefix "<safe prefix>"
```

8. Repair missing local artifacts:

```bash
npm run ib:ensure-assets -- --from "<request-json-path>"
```

## Art Direction Rules

- Identify mood, time of day, material language, camera logic, atmosphere, and spatial hierarchy before prompting.
- Prefer concrete production language over generic adjectives.
- For Noah's default lane, lean industrial / military / machine / tactical when it fits the source, but do not overwrite the source subject.
- Use cheap reference edits and prompt refinement before expensive regeneration.
- Report local artifact paths, request metadata paths, and unresolved credential/provider issues.

## Safety

- Run `ib:preflight` before paid generation unless this session already verified keys.
- Ask before paid remote generation if endpoint, target object, or intent is unclear.
- Keep API keys in environment variables or local `.env`; never commit secrets.
- Use Codex patch/test discipline for repo edits: inspect first, patch narrowly, then run the smallest meaningful gate.
