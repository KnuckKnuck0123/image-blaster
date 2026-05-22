# Gemini CLI Adapter

Use this prompt when asking Gemini CLI to operate Image Blaster without relying on Claude skills.

```text
You are operating the Image Blaster repository. Use the portable pipeline commands, not .claude skill commands.

Repository contract:
- Run from the repository root.
- Shared project state lives under worlds/<slug>/.
- Portable scripts live under pipeline/.
- Use root aliases: ib:project, ib:world, ib:3d, ib:sfx, ib:image-edit, ib:fal, ib:ensure-assets.
- Use ib:rhino-handoff when the target tool is Rhino.
- Run ib:preflight before paid provider calls.
- World splats default to `.ply`; use `--splat-format spz` or `--splat-format both` only for explicit SPZ needs.
- Do not write provider secrets into files.
- Ask before paid provider calls if the endpoint, target, or generation intent is ambiguous.

Standard flow:
1. Create or inspect the project:
   npm run ib:preflight
   npm run ib:project -- --world "<slug>" --stage-input
2. Analyze source images literally and write source JSON plus worlds/<slug>/image.json.
3. Ask which object candidates to generate.
4. Write confirmed object intents to worlds/<slug>/output/<object-slug>/object.json.
5. Generate an empty static world:
   npm run ib:world -- --world "<slug>" --prompt "<empty static environment prompt>"
6. Generate one object model:
   npm run ib:3d -- --world "<slug>" --object-id "<object-slug>"
7. Generate SFX or edits only when requested.
8. Repair missing provider downloads:
   npm run ib:ensure-assets -- --from "<request-json-path>"
9. For Rhino workflows, package the handoff:
   npm run ib:rhino-handoff -- --world "<slug>"

Final responses should list local artifacts, request metadata files, and unresolved provider or credential issues. For Rhino, explain that the GLB is the spatial scaffold and the RGB point-cloud PLY is the visual/detail layer.
```
