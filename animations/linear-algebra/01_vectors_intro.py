"""
Vectors Intro — Three arrows of the same vector from different origins.

Usage:
    manim render 01_vectors_intro.py VectorsIntro -qh --format webm
    manim render 01_vectors_intro.py VectorsIntro -qh --format mp4
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))

from mathviz_theme import MathVizScene, VECTOR_BLUE, VECTOR_GREEN, ACCENT, INK, INK_MUTED
from manim import *


class VectorsIntro(MathVizScene):
    def construct(self):
        # Title
        title = self.make_title("Vectors as Arrows")
        self.play(Write(title))
        self.wait(0.5)

        # Grid
        grid = self.make_grid()
        self.play(FadeIn(grid, shift=UP * 0.3), run_time=0.8)

        # Define the vector (3, 2)
        vec = np.array([3, 2, 0])

        # Three different origins
        origins = [
            np.array([-3, -1, 0]),
            np.array([-1, 0, 0]),
            np.array([1, -2, 0]),
        ]
        colors = [VECTOR_BLUE, VECTOR_GREEN, ACCENT]

        arrows = []
        for origin, color in zip(origins, colors):
            arrow = self.make_vector(origin, origin + vec, color=color)
            arrows.append(arrow)

        # Draw arrows one by one
        for arrow in arrows:
            self.play(GrowArrow(arrow), run_time=0.6)
            self.wait(0.3)

        # Label: "same vector"
        label = Tex("same\\; \\vec{v}", color=INK_MUTED).scale(0.6)
        label.next_to(arrows[1], UP, buff=0.3)
        self.play(FadeIn(label), run_time=0.4)

        self.wait(1.5)

        # Highlight that tails differ
        tails_label = Tex("different\\; tails", color=INK_MUTED).scale(0.5)
        tails_label.to_edge(DOWN, buff=1)

        for origin in origins:
            dot = Dot(origin, radius=0.08, color=INK_MUTED)
            self.add(dot)

        self.play(Write(tails_label), run_time=0.6)
        self.wait(2)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=0.8,
        )
