#!/usr/bin/env python3
"""
Local Manim render script.
Usage:
    python render.py                     # Render all animations
    python render.py la-01-vectors-intro # Render specific animation
    python render.py --list              # List all animations
"""

import subprocess
import sys
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MANIFEST_PATH = os.path.join(SCRIPT_DIR, "manifest.json")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "videos")


def load_manifest():
    with open(MANIFEST_PATH) as f:
        return json.load(f)


def render_animation(anim):
    script_path = os.path.join(SCRIPT_DIR, anim["script"])
    scene_name = os.path.splitext(os.path.basename(anim["script"]))[0]
    scene_name = "".join(w.capitalize() for w in scene_name.split("_"))

    course = anim["course"]
    lesson = anim["lesson"]

    for fmt in anim.get("outputs", ["webm", "mp4"]):
        outdir = os.path.join(OUTPUT_DIR, course, lesson)
        os.makedirs(outdir, exist_ok=True)

        cmd = [
            "manim", "render",
            script_path,
            scene_name,
            "-qh",
            f"--format={fmt}",
            f"--output_file={anim['id']}.{fmt}",
        ]

        print(f"Rendering {anim['id']} ({fmt})...")
        result = subprocess.run(cmd, cwd=SCRIPT_DIR)
        if result.returncode != 0:
            print(f"  FAILED: {anim['id']} ({fmt})")
        else:
            print(f"  OK: {anim['id']}.{fmt}")


def main():
    manifest = load_manifest()

    if "--list" in sys.argv:
        for anim in manifest["animations"]:
            print(f"  {anim['id']}: {anim['script']}")
        return

    target = None
    for arg in sys.argv[1:]:
        if not arg.startswith("-"):
            target = arg
            break

    for anim in manifest["animations"]:
        if target and anim["id"] != target:
            continue
        render_animation(anim)


if __name__ == "__main__":
    main()
