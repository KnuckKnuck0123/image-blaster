---
name: image-blaster
description: Run the portable Image Blaster pipeline from OpenClaw as an environment-art workflow. Use for creating or managing image-to-world projects, source analysis, cinematic/environment art direction, World Labs environments, 3D objects, image edits, Gaussian splats, and SFX.
---

# Image Blaster

Use this skill from the repository root. Treat `pipeline/` as the execution layer and `worlds/<slug>/` as the shared artifact envelope.

Operate like a senior environment artist plus technical pipeline operator: preserve the image's core read, build a coherent spatial world, separate static environment from movable props, keep scale believable, and avoid burning provider credits on vague prompts.

## Art Direction

- Identify the dominant mood, time of day, material language, camera logic, and spatial hierarchy before generation.
- Convert the source into a production brief: environment, removable objects, hero props, background props, lighting, palette, surface wear, atmosphere, and negative constraints.
- Static world prompts should describe an empty, navigable environment after confirmed movable props are removed. Keep floors, walls, terrain, built-ins, skyline, and major lighting in the world.
- Object prompts should be atomic and inspectable. One prop per generated model unless the user explicitly wants a set.
- Prefer authored specificity over generic adjectives: name materials, condition, silhouette, scale, orientation, and visual role.
- For Noah's default lane, lean industrial / military / machine / tactical when it fits the source, but do not overwrite the source image's actual subject.
- Use cheap previews and reference edits before expensive regenerations. Escalate quality only after the composition and object list are right.

## Instructions

1. Resolve or create a project:

```bash
npm run ib:preflight
```

Use `--strict` before paid generation when missing keys should block the run.

```bash
npm run ib:project -- --world "<slug>" --stage-input
```

2. If source images exist and `image.json` is missing, analyze the source image with vision and write:
   - `worlds/<slug>/source/<image-name>.json`
   - `worlds/<slug>/image.json`

Use literal observational language. Extract only movable, atomic object candidates. Do not group sets, surfaces, walls, floors, or built-in architectural features as objects.

Include an `art_direction` section in `image.json` when useful:

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

3. After the user confirms objects, write one durable object intent per object:

```text
worlds/<slug>/output/<object-slug>/object.json
```

Keep generated request state out of `object.json`.
Each object intent should include the object's visual role, approximate scale, material/finish, key silhouette details, and any reference image/edit path.

4. Generate an empty static environment when requested:

```bash
npm run ib:world -- --world "<slug>" --prompt "<empty static environment prompt>"
```

Use `image.json` as scene context and subtract confirmed/removed objects from the prompt.
World splats default to `.ply`; pass `--splat-format spz` or `--splat-format both` only when the user needs compressed SPZ output.

5. Generate one 3D object at a time:

```bash
npm run ib:3d -- --world "<slug>" --object-id "<object-slug>"
```

Optional flags include `--provider meshy|hunyuan`, `--image-edit-prompt`, `--regenerate`, `--regenerate-reference`, `--reference-only`, and Hunyuan mesh quality flags.

6. Generate image edits:

```bash
npm run ib:image-edit -- --image "<input image>" --prompt "<edit prompt>" --output-dir "<output dir>" --role "<role>" --output-slug "<slug>"
```

7. Generate SFX:

```bash
npm run ib:sfx -- --prompt "<sound prompt>" --output-dir "<target output dir>" --prefix "<safe prefix>" --kind "<world-ambience|object-impact|arbitrary>"
```

8. If request metadata references provider URLs and local files are missing, repair downloads:

```bash
npm run ib:ensure-assets -- --from "<request-json-path>"
```

## Rules

- Ask before paid remote generation if the operation, endpoint, or target object is unclear.
- Run `npm run ib:preflight` before paid generation unless this session already verified keys.
- Keep API keys in environment variables only.
- Report local output paths and request metadata paths.
- Prefer local artifacts over provider URLs in final project state.
- Default to `.ply` splats. Use SPZ only when the downstream tool explicitly needs compressed splats.
