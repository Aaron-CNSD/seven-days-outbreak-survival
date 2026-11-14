# Game Feedback

Record confirmed Engine, SDK, template, build, asset, runtime, or browser issues
encountered while developing this game. This file and the root `README.md` are
shipped unchanged in the Web ZIP. Keep credentials and private URLs out of it.

```markdown
### YYYY-MM-DD — Short issue title

- Scope: Engine | SDK | template | build | asset | runtime | browser
- Reproduction: exact command or smallest user-visible sequence
- Expected: what should happen
- Actual: what happened
- Evidence: log, screenshot, URL, or commit path
- Status: open | workaround | fixed | blocked
```

## 2026-11-04
Generated AGENTS links game-project-guide.md and game-delivery.md to GitHub URLs that return 404. Those files are absent from installed skills. Following generated AGENTS local playable acceptance and installed CLI quick contract.

造化 Preview 在运行中重载新的 production build 后，已打开的宿主页曾出现 ScriptResourceError: startup resource failed to load；刷新外层宿主页后已恢复，入口与 FPS 60 已确认；仅点击内层 Reload 未恢复。游戏 DevKit 完整键鼠/触屏 playthrough 通过。

## Detailed voxel iteration
Headed pointer-lock requests sometimes fail with WrongDocumentError in project play. An independent real-input mobile sequence completed three weapon inspections, firing, reload, scope and page reload, but the third automatic viewport capture (1280x720 after mobile portrait) timed out waiting for a canvas witness without console/page errors. Preserve the failed report; rerun the final gameplay gate in a single viewport and retain independent desktop look evidence.

材质优化：将逐像素材质色差改为网格顶点颜色，材质合并为四类。优化后连续两次最终 playthrough 通过（约24s、26s），无 console/page errors；保留此前失败记录用于对比。


2026-11-05: Importing DirectionalShadowFilterValue and using .pcssMedium in scene.pack.ts passes TypeScript and Pack unit build, but project play live isolation rejects the scene with pack-source-mutation-unsupported (live generation isolation: use supported named factories). Removed the enum override to retain the supported default filter. No SDK changes.

2026-11-05: `project check` reports project-pnpm-workspace-state-stale / installed workspace patterns do not match pnpm-workspace.yaml. A successful exact-lock pnpm 12.15.0 reinstall (190 packages, cache) does not resolve it. Typecheck and real-input project play succeed. No manual edits to pnpm internal state were made.

2026-11-05: Adding the public ShadowParticipation component to sceneComponents passes TypeScript but the 0.4.19 live Pack generator rejects scene.pack.ts with pack-source-mutation-unsupported (live generation isolation: use supported named factories). Removed this optional viewmodel shadow opt-out; retained the supported light cascade/map settings. Evidence: work/performance-play.json from the second performance attempt.

## 2026-11-08 — imported AWM specular-color sampler layout mismatch

Reproduction: ForgeAX 0.4.19, `project play scripts/realism-play.mjs`, native GLB imports with `KHR_materials_specular.specularColorTexture`, skylight and a skinned viewmodel. Renderer reports `shader-compile-failed` / `rhi-descriptor-invalid`: WGSL group 1 binding 44 (`specularColorTextureSampler`) is absent from `pbr-material-skylight-bgl`. Browser rejected the startup frame. Evidence: `../work/imported-realism-play.json`, `artifacts/play/scripts/realism-play/play.json`; RHI capture attempted via official owner (`../work/imported-rhi.json`). Source AWM also declares IOR 1000 from its legacy material conversion. Project adaptation will reauthor its surface into core glTF metallic/roughness PBR, preserving geometry, skins and diffuse/occlusion textures; no Engine/SDK patch.
