# Pixieverse

A browser-based sprite editor for MSX2 / MSX2+ hardware using the Yamaha V9938 and V9958 VDPs.

## 🚀 Launch Pixieverse

**[Open Pixieverse in your browser](https://spritesarebetter.github.io/pixieverse/)**

> The GitHub Pages URL above becomes active after the repository is renamed from `pixlverse` to `pixieverse`.

## Current focus

Pixieverse targets Sprite Mode 2 and keeps the hardware representation as the source of truth:

- customizable composite artboard size
- fixed editor viewport with independent sprite-editor zoom
- Aseprite-inspired separation of frames and layers
- each layer maps to one real VDP hardware sprite / SAT entry
- overlapping hardware-sprite layers for multicolor/composite characters
- per-layer X/Y offsets inside the composite canvas
- independent scene X/Y placement for the whole composite in the VDP preview
- layer visibility, duplication, deletion and SAT priority ordering
- 8×8 and 16×16 hardware sprites
- V9938/V9958 1-bit sprite pattern masks
- per-scanline color attributes
- EC, CC and IC flags
- up to 32 SAT entries
- 8-sprites-per-scanline load visualization
- optional simulation of hiding the 9th+ sprite
- editable 16-entry V9938/V9958 RGB3 palette
- Aseprite-shipped palette presets including DawnBringer DB16, Arne16, JMP, PICO-8 and Commodore 64
- Aseprite-compatible GIMP Palette (`.gpl`) save/load for custom palettes
- `palette.bin` export in V9938 palette-register format
- multiple animation frames
- project autosave in browser storage, with migration from the legacy Pixlverse storage key
- `.msxsprite` project save/load with migration from the earlier absolute-position format
- PNG export of the VDP preview at the selected integer preview zoom
- `patterns.bin`, `colors.bin`, `sat.bin` and Z80 assembly export
- mouse, touch and stylus drawing

## Run locally

There is no build step. Open `index.html` in a modern browser.

For a local web server you can also run:

```sh
python3 -m http.server 8000
```

and visit `http://localhost:8000`.

## Drawing controls

- Left-click / drag on the artboard: draw on the selected layer
- Right-click / drag on the artboard: erase on the selected layer
- `P`: pencil
- `E`: eraser
- `+` / `-`: editor zoom
- Ctrl + mouse wheel over the editor: editor zoom
- Layer arrow controls: move the selected hardware sprite within the composite canvas
- Bitmap arrow controls: shift pixels inside the selected hardware sprite

## Palette controls

The active palette is always stored as 16 legal V9938/V9958 colors with 3-bit R, G and B components. Aseprite presets and imported 8-bit RGB palettes are quantized to that hardware color space.

Custom palettes can be saved as `.gpl` files and loaded again in Pixieverse or Aseprite. Imported palettes with more than 16 colors use the first 16 entries; shorter palettes keep the remaining current entries.

## VDP preview controls

- Left-click preview: zoom in by one integer step (1×, 2×, 3×, ...)
- Right-click preview: zoom out by one integer step
- Save image: export the current VDP preview as a nearest-neighbor PNG at the current preview zoom

## Hardware notes

The customizable canvas is an editor-side composite artboard; it does not create non-standard VDP sprite sizes. Every layer remains a legal 8×8 or 16×16 hardware sprite. Layer order maps to SAT priority, with layer #0 having the highest priority.

For 16×16 sprites, pattern numbers are aligned to four-pattern groups. Binary export uses the V9938 quadrant ordering and exports a 2048-byte pattern table, 512-byte Sprite Mode 2 color table, 128-byte sprite attribute table, and optional 32-byte palette table for the current project/frame.

## Roadmap

Planned improvements include undo/redo, onion skinning, exact SCREEN 8 sprite color handling, collision visualization, stronger import tools, openMSX-oriented workflows, drag-to-move layers, and richer animation management.
