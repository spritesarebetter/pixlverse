# Pixieverse

A browser-based sprite editor for MSX2 / MSX2+ hardware using the Yamaha V9938 and V9958 VDPs.

## 🚀 Launch Pixieverse

**[Open Pixieverse in your browser](https://spritesarebetter.github.io/pixieverse/)**

## Current focus

Pixieverse targets Sprite Mode 2 and keeps the hardware representation as the source of truth:

- 16×16 or 8×8 Sprite Size selected directly in the Composite sprite editor
- fixed editor viewport with independent 10% sprite-editor zoom steps
- Aseprite-inspired separation of frames and layers
- each layer maps to one real VDP hardware sprite / SAT entry
- overlapping hardware-sprite layers for multicolor/composite characters
- per-layer X/Y offsets
- independent scene X/Y placement in the VDP preview
- layer visibility, duplication, deletion and SAT priority ordering
- V9938/V9958 1-bit sprite pattern masks
- rectangular selection tool with copy/paste and keyboard movement
- selection-aware move, flip, invert and clear operations
- double-click / double-tap pixel erase
- compact per-scanline color controls beside the sprite: palette index, swatch and OR flag
- up to 32 SAT entries
- optional 8-sprites-per-scanline load visualization
- optional simulation of hiding the 9th+ sprite
- editable 16-entry V9938/V9958 RGB3 palette
- Aseprite-shipped palette presets including DawnBringer DB16, Arne16, JMP, PICO-8 and Commodore 64
- browser-local custom palette library plus Aseprite-compatible GIMP Palette (`.gpl`) save/load
- `palette.bin` export in V9938 palette-register format
- multiple animation frames with per-frame 60 Hz wait values and preview playback
- project autosave in browser storage, with migration from the legacy Pixlverse storage key
- `.msxsprite` project save/load with migration from the earlier absolute-position format
- PNG export of the VDP preview at the selected percentage zoom
- `patterns.bin`, `colors.bin`, `sat.bin` and Z80 assembly export
- responsive layouts for desktop, tablets and narrow screens
- mouse, touch and stylus drawing

## Run locally

There is no build step. Open `index.html` in a modern browser.

For a local web server you can also run:

```sh
python3 -m http.server 8000
```

and visit `http://localhost:8000`.

## Drawing controls

- Left-click / drag on the sprite: draw on the selected layer
- Right-click / drag: erase
- Double-click / double-tap: erase a pixel
- `P`: pencil
- `E`: eraser
- `S`: selection tool
- `+` / `-`: editor zoom in 10% steps
- Ctrl + mouse wheel over the editor: editor zoom
- Arrow buttons: move selected pixels when a selection exists; otherwise shift the complete bitmap
- Keyboard arrow keys: move the active selection
- Ctrl/Cmd+C and Ctrl/Cmd+V: copy/paste selected pixels
- Flip, Invert and Clear operate on the selection when one exists
- Layer arrow controls: move the selected hardware sprite

## Sprite color controls

The compact color rows next to the sprite correspond to its hardware scanlines. Each row exposes a two-digit palette index, a color swatch and an **OR** checkbox. OR maps to the V9938/V9958 combine-color (CC) flag. Legacy EC and IC values remain preserved in loaded project data for compatibility, but are not exposed by the simplified editor UI.

## Animation controls

Each frame has a `wait` value measured in 60 Hz display frames. For example, `wait 6` holds a frame for approximately 0.1 seconds.

- Start: loop the animation in the VDP scene preview
- Stop: stop playback and return the preview to the currently selected editing frame
- Up / Down: reorder the selected animation frame
- The scanline-load meter follows the frame currently being previewed during playback

## Palette controls

The active palette is always stored as 16 legal V9938/V9958 colors with 3-bit R, G and B components. Aseprite presets and imported 8-bit RGB palettes are quantized to that hardware color space.

Custom palettes can be stored inside Pixieverse using browser local storage, or saved as `.gpl` files and loaded again in Pixieverse or Aseprite. Clearing the browser's site data also clears palettes saved only inside the tool.

## VDP preview controls

- `+` / `-`: zoom in 10% steps
- Left-click / tap preview: zoom in 10%
- Right-click preview: zoom out 10%
- Ctrl + mouse wheel over the preview: zoom
- Start / Stop: loop animation on a 60 Hz timing base using each frame's wait value
- Scanline load: optional hardware-limit visualization, hidden by default
- Save image: export the current preview as a nearest-neighbor PNG

## Hardware notes

Sprite Size is always a legal VDP hardware size: 8×8 or 16×16. Every layer remains one real hardware sprite. Layer order maps to SAT priority, with layer #0 having the highest priority.

For 16×16 sprites, pattern numbers are aligned to four-pattern groups. Binary export uses the V9938 quadrant ordering and exports a 2048-byte pattern table, 512-byte Sprite Mode 2 color table, 128-byte sprite attribute table, and optional 32-byte palette table for the current project/frame.

## Roadmap

Planned improvements include undo/redo, onion skinning, exact SCREEN 8 sprite color handling, collision visualization, stronger import tools, openMSX-oriented workflows, drag-to-move layers, and richer animation management.
