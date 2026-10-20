# Modern artwork pass

The slim HUD and minimap were published first (998cf332). This separate pass adds refined door, key and kneeling sun glyph artwork plus limestone surface texture. Original mode still uses the unmodified Macintosh files. This is a first set of enhanced scene graphics, not a claim that every creature, item and wall glyph has been redrawn.

The renderer uses original sprite dimensions for placement and sizing. Modern artwork uses higher resolution sources and filtered reduction. The door keeps original proportions, left lock plate, separate knob/keyhole and two characteristic wood knots. Its frontal source is projected for side views. The glyph uses multiply compositing so no white rectangle covers the stone underneath. Generated detail is an interpretation of the reference, not recovered original information.

Wall texture is sampled at world-space coordinates per projected screen column. Mirrored repetition makes tile boundaries continuous. It remains clipped to closed wall faces and uses the existing camera and geometry. Texture-coordinate regression covers a wall changing from side view to frontal view after turning; masonry tests cover stable course boundaries across crops. Grain is deliberately restrained so it does not compete with objects and fog.

## Assets and generation provenance

Created with the built-in image generator, all saved in dist/assets:
- unified-hud-slim.png — art-prompts/hud-slim-prompt.txt
- minimap-slim.png — art-prompts/map-slim-prompt.txt
- door-detail-final.png — art-prompts/door-detail.txt and door-lock-correction.txt
- key-detail.png — art-prompts/key-detail.txt
- relief-detail.png — art-prompts/relief-detail.txt
- limestone-texture.png — art-prompts/stone-texture.txt

The heart and bread emblems remain code-native SVG. Oil is a live meter with a numeric percentage, not painted into the artwork.

## Pixel consistency revision

The modern scene now renders on one logical screen-pixel grid and is converted to opaque black/white before display. This aligns the raster treatment of wall lines, artwork and haze, independent of display pixel ratio. The original renderer is unchanged.

The previous gray limestone bitmap is no longer used. Walls use deterministic world-coordinate pixel grain; floor and ceiling use the same approach at much lower density (floor 0.4% of sampled points, ceiling 0.2%, sampled every two screen pixels). Closed wall faces mask the plane grain. No broad gray patches or filtered stone blotches remain.

Updated built-in image-generator assets:
- `dist/assets/door-pixel.png`: simplified grain, thinner outer contour; prompt `art-prompts/door-pixel.txt`.
- `dist/assets/key-pixel.png`: solid shaft and teeth, hollow ring; prompt `art-prompts/key-pixel.txt`.

The modern floor key is displayed at 1.45× its previous dimensions for legibility. Pickup rules and world position are unchanged. Stat groups are vertically centred inside the slim cartouches, including native select controls.

Validation: 77 passing tests, including binary raster output, restrained plane density, world-space continuity and original/modern mode switching. Browser inspection covers front door, corridor, floor key and HUD alignment.

## Expedition shell, spatial occlusion and ambience (16 October 2026)
- Supplied menu logo and desert illustration copied unchanged to `assets/menu-logo.png` and `menu-desert.png`; supplied Watchful Quiet recording to `menu-music.m4a`.
- Centred start navigation, saved-game resume and in-memory return; modern toolbar reserves 54px above the corridor. Settings group view, journal, fullscreen and separate persistent music/footstep levels. Browser gesture gates menu music; it pauses during gameplay and while hidden.
- Soft, short low-pass noise footsteps fire only after successful displacement. No steps for blocked movement or turning.
- Walls, passage backs, narrow returns, contours and decorations now composite by depth. Near opaque surfaces mask distant material/haze. World-anchored partial mortar creates patches of white stone. Original rendering is preserved; contour filtering defaults to its full original output.
- Unlit Modern view has a 1-bit ordered raster covering 70–93% of the scene, densest in the distance; HUD is unaffected.
- Browser checks: menu navigation/settings, audio playback time advancing after interaction and paused in-game, movement, near wall, dark view, 1440px and 390px layouts. Audio playback verified technically, not a subjective listening review.

## Relief and stone refinement (16 October 2026)
- New nine-cell generated atlas `reliefs-engraved-atlas.png`, based on the original relief references. Same subjects, arrangement and silhouettes with finer carved details; original assets remain untouched. Prompt retained in `art-prompts/reliefs-engraved-atlas.txt`.
- Each cell is cropped to ink bounds at runtime, preserving native generated resolution. Modern wall reliefs use multiply compositing and perspective column sampling on side walls, so the underlying masonry remains visible rather than being erased by white rectangles.
- Replaced sinusoidal binary wear masks with smoothly interpolated, multi-scale irregular wear. Mortar strokes taper continuously, and grain density transitions softly. Tests cover continuity and unchanged geometry.
- Menu playback is attempted immediately on opening, with interaction fallback only when autoplay is rejected by the browser. Local browser rejected audible autoplay (paused at time zero); automatic attempt and pause-on-exit are tested. Browser autoplay restrictions cannot be overridden by the page.
- 84 tests passed. Browser-checked front and oblique reliefs, natural stone wear and startup state.

## Aged wall paintings (16 October 2026)
- Removed music-related copy from the start menu; playback behaviour unchanged.
- Added a runtime ink-weathering pass to the existing high-resolution relief atlas, preserving the source artwork. Variable pigment survival follows smooth wall-space wear; ink fades strongly around the actual masonry joints rather than covering them as a decal.
- Cached material tiles retain their wear when approaching the same wall. Bounded cache, unchanged original renderer and game geometry.
- 87 tests passed, including mortar attenuation, deterministic wear and stable coordinates during approach. Front/side reliefs and menu copy checked in browser; no console errors.

## Quiet passage completion and stone edges (16 October 2026)
- Increased surviving relief pigment while retaining strong attenuation at masonry joints.
- Added a low-contrast architectural backdrop traced through actual open maze connections. It fills formerly blank side passages behind the existing depth-composited corridor, without adding actors, items or map knowledge.
- Added sparse world-aligned worn floor joints and fine stippled shading at wall bases and closed end-wall corners. Original mode remains unchanged.
- Long vertical contour strokes now follow five subtly bevelled stone courses, with small interruptions at joints. Inner return faces receive matching course divisions and grain rather than remaining blank white.
- 91 tests passed. Fixed junctions, turning and advancing checked visually in the browser with no console errors. Tests cover real-wall ray hits, centre depth, deterministic sparse floor detail and bounded contour offsets.

## Continuous architectural silhouettes (16 October 2026)
- Restored uninterrupted one-pixel structural edges. Subpixel bevel strokes could vanish during the final monochrome threshold; structural contours now rasterize directly to connected integer pixels. Worn stone detail remains separate.
- Side-passage backdrop now draws continuous ceiling/floor boundaries and vertical corners at changes in visible wall face/depth, after all backdrop columns are filled.
- Fixed erroneous front-plane return strips beside closed end walls when a neighbouring passage continues forward. Texture now stops at the true wall edge.
- Added a dedicated end-wall/both-side-passages QA fixture. 92 tests pass, covering connected contours at fractional coordinates and no texture extension beyond closed wall ends. Browser checked both junction fixtures and approach views without console errors.

## Soft stippled darkness (16 October 2026)
- Removed ordered 4×4 Bayer darkness, whose quantized density formed visible concentric bands.
- Restored irregular, deterministic monochrome stipple with a continuous Gaussian density: stronger than the early sparse effect, with legible near contours and dense distant darkness.
- Removed overlapping unlit depth-circle passes; darkness is applied once to the whole scene. Lit haze is unchanged. Pattern has no time component and does not flicker.
- 93 tests passed, including continuous density, absence of a repeated 4px tile and stronger distant occlusion. Dark corridor visually checked in browser.

## Darkness visibility adjustment (16 October 2026)
Reduced the smooth stipple coverage by approximately 20% (near baseline 32% → 25%, centre 92% → 74%) to reveal more wall and object detail. Same stable grain and continuous falloff; no rings.

## Integrated auxiliary UI (16 October 2026)
Movement and journal now share a slim double rule and fine engraved rail; the top toolbar has a matching quiet frame. The generated HUD edge completion preserves the 2172×724 canvas and interior layout while extending the side pillars flush to the edges. Built-in image generation, prompt in art-prompts/hud-flush-prompt.txt. Verified pickup interaction, journal updates and 1440/650px layouts; 93 tests pass.

## Controls-first generated set (16 October 2026)
Four built-in generated assets: hud-focused.png, map-focused.png, navigation-focused.png, rail-focused.png. Prompts are saved in art-prompts/*-focused.txt. HUD circles expanded from 9.35% to12.5% stage width and inventory height from25.4% to28.5% of illustration. Smaller wings and thinner ornament; matching limestone map frame. Generated arrow sheet is under nine separate accessible live button hit targets; original controls remain in original mode. Top toolbar and journal use generated quiet rail. Desktop and compact layout retain two inventory rows.

## Organic ornament and vessel alignment
Restored darker feather/lotus engraving in hud-vessels.png while keeping the expanded apertures. map-organic.png retains map bounds but replaces plain rails with flowing foliage. Built-in image-generation prompts saved as art-prompts/ornate.txt and organicMap.txt. Live vessel masks now align with full circular interiors (top42.25%, height37.1%), eliminating the false black crescent at100%. Verified100% and82%/64% states visually.

## Stippled liquid and subtle floor visibility
Live vessel canvas renders stable stipple concentrated at sides, base and a shallow curved meniscus, with glass highlights. Centered SVG ankh and wheat replace heart/bread; legends and actions centered vertically. Fills remain tied to health/satiety. Floor joint sampling tolerance .6→.72 and grain cutoff .28→.22 gently increase existing sparse dots without adding solid lines. Browser checked at82/64%;93 tests pass.
