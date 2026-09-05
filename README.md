# Pixlverse

A browser-based sprite editor for MSX2 / MSX2+ hardware using the Yamaha V9938 and V9958 VDPs.

## Current focus

Pixlverse targets Sprite Mode 2 and keeps the hardware representation as the source of truth:

- 8×8 and 16×16 hardware sprites
- V9938/V9958 1-bit sprite pattern masks
- per-scanline color attributes
- EC, CC and IC flags
- up to 32 SAT entries
- 8-sprites-per-scanline load visualization
- optional simulation of hiding the 9th+ sprite
- SAT priority ordering
- multiple animation frames
- project autosave in browser storage
- `.msxsprite` project save/load
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

- Left-click / drag: draw
- Right-click / drag: erase
- `P`: pencil
- `E`: eraser

## Hardware notes

For 16×16 sprites, pattern numbers are aligned to four-pattern groups. Binary export uses the V9938 quadrant ordering and exports a 2048-byte pattern table, 512-byte Sprite Mode 2 color table, and 128-byte sprite attribute table for the current frame.

## Roadmap

Planned improvements include undo/redo, editable V9938 palette registers, exact SCREEN 8 sprite color handling, collision visualization, stronger import tools, openMSX-oriented workflows, and richer animation management.
