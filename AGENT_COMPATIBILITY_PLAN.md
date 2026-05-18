# Agent Compatibility Plan

## Goal

Refactor \`image-blaster\` so the pipeline works with multiple agent shells instead of assuming Claude Code as the primary orchestrator.

## Current Coupling

- \`.claude/skills/\` contains the main workflow entrypoints and step ordering.
- \`.claude/agents/\` and \`Agent(...)\` handoff patterns assume Claude-native agent routing.
- \`.claude/hooks/\` and \`.claude/settings.json\` assume Claude session boot hooks and tool allowlists.
- \`app/\` includes a small Claude-specific UI action for opening a Claude terminal.
- The actual generation logic already lives in reusable Node scripts under \`.claude/scripts/\`.

## Port Strategy

1. Preserve the pipeline scripts as the stable core.
2. Move agent-facing workflow docs out of \`.claude/skills/\` into provider-neutral docs or wrappers.
3. Add adapter layers for:
   - OpenClaw skills
   - Gemini CLI prompts/commands
   - plain shell usage
4. Remove Claude-only assumptions from the viewer and replace them with generic actions.
5. Keep project artifacts and world/object output formats stable so different agents can share the same workspace.

## Proposed Structure

- \`pipeline/\`
  - provider-neutral orchestration scripts and helpers
- \`adapters/openclaw/\`
  - OpenClaw skills and workflow entrypoints
- \`adapters/gemini/\`
  - Gemini CLI task prompts and shell wrappers
- \`adapters/claude/\`
  - backward-compatibility wrappers for the existing Claude flow
- \`docs/\`
  - shell-independent workflow docs

## First Pass Tasks

- Audit all \`.claude/skills/*\` files and map each one to a neutral workflow contract.
- Rename or mirror \`.claude/scripts/\` into a neutral location without breaking imports.
- Remove \`open Claude terminal\` behavior from the viewer or make it adapter-driven.
- Add one provider-neutral CLI entrypoint for:
  - project init
  - object discovery
  - world generation
  - single-object 3D generation
  - SFX generation
- Add OpenClaw skill wrappers around those entrypoints.

## Non-Goals

- Replacing World Labs or FAL in the first pass.
- Making heavy generation local-first.
- Rewriting the viewer before the pipeline is agent-neutral.

## Recommendation

OpenClaw should be the first-class adapter.

Reason:
- local tool control is stronger
- skill packaging is close to the existing repo model
- it can still call Gemini or other providers inside the pipeline
