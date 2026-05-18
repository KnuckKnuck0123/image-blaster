---
name: image-blaster
description: Run the portable Image Blaster pipeline from OpenClaw. Use for creating or managing image-to-world projects, source analysis, World Labs environments, 3D objects, image edits, and SFX.
---

# Image Blaster

Use this skill from the repository root. Treat `pipeline/` as the execution layer and `worlds/<slug>/` as the shared artifact envelope.

## Instructions

1. Resolve or create a project:

```bash
npm run ib:project -- --world "<slug>" --stage-input
```

2. If source images exist and `image.json` is missing, analyze the source image with vision and write:
   - `worlds/<slug>/source/<image-name>.json`
   - `worlds/<slug>/image.json`

Use literal observational language. Extract only movable, atomic object candidates. Do not group sets, surfaces, walls, floors, or built-in architectural features as objects.

3. After the user confirms objects, write one durable object intent per object:

```text
worlds/<slug>/output/<object-slug>/object.json
```

Keep generated request state out of `object.json`.

4. Generate an empty static environment when requested:

```bash
npm run ib:world -- --world "<slug>" --prompt "<empty static environment prompt>"
```

Use `image.json` as scene context and subtract confirmed/removed objects from the prompt.

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
- Keep API keys in environment variables only.
- Report local output paths and request metadata paths.
- Prefer local artifacts over provider URLs in final project state.
