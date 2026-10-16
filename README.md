# Aether — Personal Universe / Demo 0.1

A runnable, original, procedural 3D web prototype built with Vite, TypeScript, and Three.js. **Aether is a working title.** World layouts, avatar styling, and world names are editable prototype choices, not final approved designs.

## Download and try on your computer

[Download Aether-Demo.zip](https://github.com/mimimisalami/My-uniuni/raw/refs/heads/codex/aether-demo-download/downloads/Aether-Demo.zip), extract it, and open `Aether-Demo.html` in a current desktop Chrome or Edge. No Node.js installation is needed for this standalone edition. Choose **Enter My Universe** to begin. `Preview.png` is a screenshot; the HTML file contains the interactive demo.

The ZIP contains all the JavaScript and CSS in one HTML file, plus Vietnamese instructions. It needs WebGL and does not load external assets. Its interactions were tested after loading from an internal server and disconnecting the network; direct local file navigation is blocked by the cloud browser policy and should be verified on your own computer. A managed desktop browser may similarly restrict local HTML or its storage. The full source below can also be run with Vite.

## Run locally

Use Node.js 22.12+ (tested with 24.19.0) and npm.

```bash
cd /workspace/My-uniuni
npm install
npm run dev
```

On your own computer, open the local address printed by Vite. In the onboarding cloud machine, the server is used for internal validation; the onboarding UI does not provide a web preview.

For a reproducible dependency installation, use `npm ci`. If the default npm cache is not writable in the cloud sandbox:

```bash
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
```

Production build and local production preview:

```bash
npm run build
npm run preview
```

No API keys, accounts, database, downloaded models, external images, fonts, paid assets, or paid services are required. This project has not been deployed publicly.

## What works

- A real-time WebGL sky city made from geometry: a marble plaza, celestial fountain, golden portals, colonnade, gardens, and floating islands.
- Three distinct environments: the Hub, the Observatory with an open dome, telescope and bookshelves, and the Atelier with workstations and pinboards.
- Third-person movement using WASD / arrow keys, a following camera, simple collision boundaries, and nearby E interaction. Mobile has held directional touch controls and a tap interaction button.
- Portal transitions, Back to Hub, floating direct-access labels, and an Atlas available in every world. The Atlas also opens the wardrobe, so it remains accessible on narrow screens.
- Three visible outfit silhouettes: Modern Tailored, Techwear (backpack, strap, pockets), and Mythic Minimal (draped form, cape, circlet). Full-body live preview, Apply, and persistent world appearance.
- Observatory: editable notes (10,000 characters), a working 25-minute start/pause/resume/reset focus timer, and explicit sending to a shared Idea Inbox. Duplicate pending notes are not sent twice.
- Atelier: add, delete, and move tasks between To do / In progress / Done; convert inbox ideas into real tasks or discard them. Board and inbox each support up to 100 entries.
- Outfit, notes, board, inbox, and timer persist in localStorage across reloads. A running timer uses a saved deadline, so time passes while a panel is closed or the browser reloads.
- Confirmation before resetting local demo data; cancel leaves the data intact. Keyboard focus containment and restoration for dialogs, Escape to close, readable responsive panels, and reduced transition motion when requested.

## A quick walkthrough

1. Choose **Enter My Universe**. Move with WASD / arrows or the on-screen direction pad. Approach a portal and use **E**, or tap a floating label or **Atlas**.
2. Open **Wardrobe Atelier**, select a silhouette, and **Apply look**. Reload to check that it persists.
3. Visit **The Observatory**. Approach the desk and use E, or choose **Focus + Notes** in the top navigation. Write a note, start or pause focus, and **Send to Idea Inbox**.
4. Visit **The Atelier** and open **Workflow Board**. Choose **Make it a task**, then use its column selector to move it. Add your own task and reload to check persistence.
5. The **?** button explains controls and contains the explicit **Reset local demo data…** confirmation.

## Architecture

```text
src/config.ts   World metadata, palette accents, outfit presets, performance limits
src/world.ts    Procedural scenes, avatar meshes, following camera, controls, hotspots
src/state.ts    Validated local persistence, timer deadline and reset operations
src/main.ts     DOM overlays, travel, wardrobe, notes, board, inbox, focus management
src/style.css   Responsive editorial UI and touch controls
tests/          Playwright functional desktop and mobile browser tests
```

## Tests

```bash
npm run build
npm test
```

Tests use system Chromium at `/usr/bin/chromium` when available. You can set `CHROMIUM_PATH` to another Chromium executable. If no system browser is available, run `npx playwright install chromium` once. The Linux cloud configuration uses SwiftShader for headless WebGL, so it is slower than a desktop GPU. Tests run one worker to avoid competing for software rendering resources. The browser flags are for automated testing only.

The tests exercise actual WebGL initialization, portal travel, keyboard and touch movement, nearby interaction, all three wardrobe presets, reload persistence, timer controls, note-to-inbox-to-task conversion, board moves, duplicate idea handling, reset cancellation/confirmation, mobile overflow, and dialog keyboard focus. A passing build alone is not treated as functional validation.

## Capture screenshots

Run the dev server, enter the Hub, stop moving, and use your browser or operating system screenshot tool. Open Atlas to switch worlds; close tool panels for a clean scene, or capture the open wardrobe and productivity tools to show their functionality. Use browser device emulation at 390 × 844 for a mobile layout. Screenshots can contain locally entered notes, so use sample text.

## Intentional limitations

- This is a small visual and interaction prototype, not a full game. Architecture, foliage, water, and avatar are stylized geometry. Water has a reflective material and animated surface roughness, not real-time scene reflections. Contact shadows and collisions are simplified.
- The approved `HUB_APPROVED_REFERENCE.png` mentioned in the brief was not supplied in this session. The scene follows the written ivory/gold/blue sky-city direction without claiming an exact visual match.
- No authentication, secure internet access, server, cloud storage, device sync, AI inference, professional data, integrations, or IELTS course is implemented. The focus timer has no background notifications or sound. There are no decorative controls pretending those features exist.
- Storage is specific to the browser and site origin. Private browsing, storage quotas, clearing site data, or changing host/port can prevent or remove persistence. Storage failures show a message and leave the current session usable.
- The page needs WebGL 2 and a modern browser. The scene lowers pixel ratio, shadow resolution, and column detail for touch devices; actual phone and Safari/Firefox performance still require testing on those devices. The camera is fixed in angle and follows the avatar; it does not offer free look or zoom.
- Automated mobile checks emulate touch Chromium, not real iOS/Android hardware. Small-screen panels scroll vertically. Data does not sync across tabs in real time.

Next iterations: (1) compare the Hub against the supplied approved reference and refine architecture, lighting, and avatar proportions; (2) test on real mobile devices, add an adjustable camera and adaptive rendering quality; (3) add local data export/import and refine the knowledge-to-action workflow before separately designing any private sync or authentication.
