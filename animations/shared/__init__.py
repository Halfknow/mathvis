"""Manim animation manifest — tracks all renderable animations."""

import json
import os

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "manifest.json")


def load_manifest():
    with open(MANIFEST_PATH, "r") as f:
        return json.load(f)


def get_animation(animation_id: str):
    manifest = load_manifest()
    for anim in manifest["animations"]:
        if anim["id"] == animation_id:
            return anim
    return None
