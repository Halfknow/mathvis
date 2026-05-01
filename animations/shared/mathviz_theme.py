"""
MathViz brand theme for Manim.
Maps design tokens from tokens.css to Manim colors.
"""

from manim import *

# Surface colors
PAPER = "#faf7f2"
PAPER_ELEVATED = "#ffffff"
SURFACE_1 = "#f4f0e8"

# Ink colors
INK = "#1a1f36"
INK_MUTED = "#4a5170"
INK_FAINT = "#8b91a7"

# Accent
ACCENT = "#c8693d"

# Chalk / diagram colors (pedagogical)
VECTOR_BLUE = "#3b6cb7"
VECTOR_GREEN = "#4f8a5b"
VECTOR_RED = "#b54a4a"
VECTOR_YELLOW = "#d4a02a"


class MathVizScene(Scene):
    """Base scene with MathViz brand styling."""

    def setup(self):
        super().setup()
        self.camera.background_color = PAPER

    def make_title(self, text: str, scale=0.8):
        """Create a brand-styled title."""
        title = Tex(text, color=INK, tex_template=None)
        title.scale(scale).to_edge(UP, buff=0.5)
        return title

    def make_label(self, text: str, color=INK):
        """Create a styled text label."""
        return Tex(text, color=color)

    def make_vector(self, start, end, color=VECTOR_BLUE, stroke_width=3):
        """Create a branded vector arrow."""
        return Arrow(
            start=start,
            end=end,
            color=color,
            stroke_width=stroke_width,
            buff=0,
            max_tip_length_to_length_ratio=0.15,
        )

    def make_grid(self, x_range=(-6, 6), y_range=(-4, 4), color=INK_FAINT):
        """Create a subtle coordinate grid."""
        return NumberPlane(
            x_range=x_range,
            y_range=y_range,
            background_line_style={
                "stroke_color": color,
                "stroke_width": 0.5,
                "stroke_opacity": 0.4,
            },
            axis_config={
                "stroke_color": INK_MUTED,
                "stroke_width": 1,
            },
        )
