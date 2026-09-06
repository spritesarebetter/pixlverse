# Pixieverse

A browser-based MSX2 / MSX2+ Sprite Mode 2 editor.

## 🚀 Launch Pixieverse

**[Open Pixieverse in your browser](https://spritesarebetter.github.io/pixieverse/)**

## Current focus

Pixieverse keeps the hardware sprite representation as the source of truth:

- 16×16 or 8×8 size selected in the Composite sprite editor
- editor and VDP preview zoom in 10% steps
- per-scanline color controls embedded beside the sprite and scaling with it
- two-digit palette index, swatch and OR flag for each sprite row
- Undo / Redo, including grouped drawing strokes and selection drags
- rectangular selection with copy/paste, arrow-key movement and direct drag movement
- selection-aware move, flip, invert and clear
- double-click / double-tap pixel erase
- frames with per-frame wait values on a 60 Hz timing base
- frame reordering and looping VDP animation preview
- scene X/Y controls inside the VDP preview
- each layer maps to one hardware sprite / SAT entry
- up to 32 sprite layers with visibility and priority ordering
- optional 8-sprites-per-scanline visualization, hidden by default
- editable 16-entry MSX RGB3 palette: 3-bit R/G/B = 512 legal colors
- simultaneous MSX RGB (0–7) and RGB display (0–255) values
- built-in DawnBringer DB16, Arne16, JMP, PICO-8 and Commodore 64 palettes
- custom palettes saved in browser storage and listed directly in the Palette File menu
- GIMP Palette (`.gpl`) load/save
- `palette.bin`, `patterns.bin`, `colors.bin`, `sat.bin` and Z80 assembly export
- responsive layouts for desktop, tablets and narrow screens
- mouse, touch and stylus drawing

## Project format

Pixieverse project files use the current `.msxsprite` format only. The saved project contains the current sprite size, scene position, palette, frames, layers, masks, per-line color/OR values and frame waits.

Pixieverse does not contain format-migration or legacy-project compatibility code.

## Drawing controls

- Left-click / drag: draw
- Right-click / drag: erase
- Double-click / double-tap: erase a pixel
- `P`: pencil
- `E`: eraser
- `S`: selection tool
- `+` / `-`: editor zoom in 10% steps
- Ctrl + mouse wheel: editor zoom
- Arrow buttons: move selected pixels; without a selection they shift the whole bitmap
- Keyboard arrow keys: move the active selection
- Drag inside an existing selection: move it directly
- Ctrl/Cmd+C / Ctrl/Cmd+V: copy/paste selection
- Ctrl/Cmd+Z: Undo
- Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: Redo
- Flip, Invert and Clear act on the selection when one exists

## Palette controls

The **File** menu contains built-in palettes, palettes saved inside Pixieverse, and **Load…** for opening a `.gpl` file.

- **Save** stores the current palette in browser local storage and adds it to the File menu.
- **Delete** removes the selected locally saved palette.
- **Save .gpl** exports the current palette.
- MSX RGB inputs edit the native 0–7 channel values.
- RGB inputs edit conventional 0–255 values and snap to the nearest legal MSX RGB3 color.
- Undo restores palette edits.

## VDP preview controls

- Scene X/Y place the sprite composition in the preview.
- `+` / `-`: zoom in 10% steps.
- Left-click / tap: zoom in 10%.
- Right-click: zoom out 10%.
- Ctrl + mouse wheel: zoom.
- Start / Stop: animate at a 60 Hz timing base using each frame's wait value.
- Scanline load: optional hardware-limit visualization, hidden by default.

## Run locally

There is no build step. Open `index.html` in a modern browser, or run:

```sh
python3 -m http.server 8000
```

and visit `http://localhost:8000`.
