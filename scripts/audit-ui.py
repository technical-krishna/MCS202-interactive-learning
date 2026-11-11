#!/usr/bin/env python3
"""Static UI and interaction coverage audit for the MCS-202 study app.

This complements ``audit-course.py``.  It intentionally checks the code paths
that make a diagram interactive and the final CSS cascade that protects the
black/charcoal theme; it does not rewrite course material.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
FIGURES = SRC / "figure-catalog.json"
LESSONS = ROOT / "public/source/lessons.json"

SPECIAL_MODELS = {"scale", "logic", "adder", "memory", "state", "storage"}
STAGED_MODELS = {"architecture", "instruction", "pipeline", "transfer", "device", "concept"}


def check(condition, message, failures):
    if not condition:
        failures.append(message)


def main():
    failures = []
    gallery = (SRC / "AnimatedFigureGallery.jsx").read_text()
    labs = (SRC / "InteractiveLab.jsx").read_text()
    lesson_view = (SRC / "LessonView.jsx").read_text()
    main_app = (SRC / "main.jsx").read_text()
    diagram_css = (SRC / "diagram.css").read_text()
    base_css = (SRC / "style.css").read_text()
    figures = json.loads(FIGURES.read_text())
    lessons = json.loads(LESSONS.read_text())

    topic_keys = {(unit["unit"], topic["id"]) for unit in lessons for topic in unit["topics"]}
    check(len(topic_keys) == 227, f"Expected 227 lesson topics, found {len(topic_keys)}", failures)
    check(len(figures) == 197, f"Expected 197 printed source figures, found {len(figures)}", failures)
    check(bool(figures), "Figure catalog is empty", failures)

    for figure in figures:
        check((figure.get("unit"), figure.get("topicId")) in topic_keys, f"{figure.get('id')} is not owned by a lesson", failures)
        check(bool(figure.get("caption", "").strip()), f"{figure.get('id')} has no source caption", failures)
        check(figure.get("model") in SPECIAL_MODELS | STAGED_MODELS, f"{figure.get('id')} uses unsupported model {figure.get('model')}", failures)

    represented_models = {figure["model"] for figure in figures}
    for model in represented_models & SPECIAL_MODELS:
        check(f"model === '{model}'" in gallery, f"No specialised interactive renderer for {model}", failures)
    for model in represented_models & STAGED_MODELS:
        check(f"{model}:" in gallery, f"No staged interactive renderer for {model}", failures)

    check("<AnimatedFigureGallery unit={unit} topic={topic}/>" in lesson_view, "Figure gallery is not mounted in lessons", failures)
    check("<InteractiveLab" in lesson_view, "Interactive lab is not mounted in lessons", failures)
    check("onClick" in gallery and "setPlaying" in gallery and "setStep" in gallery, "Figure gallery lacks direct learner controls", failures)
    check("aria-label" in gallery, "Figure gallery lacks accessible labels", failures)

    # InteractiveLab is used by every topic.  These branches ensure every one
    # of the sixteen unit contexts has a custom or safe generic interaction.
    for unit_index in range(16):
        check(f"unit==={unit_index}" in labs or unit_index == 15, f"No explicit interactive-lab branch for unit index {unit_index}", failures)
    check("else content=" in labs, "InteractiveLab has no safe fallback model", failures)

    all_jsx = "\n".join(path.read_text() for path in SRC.glob("*.jsx"))
    check("/source/pdfs/" not in all_jsx and "<iframe" not in all_jsx, "Learner UI still embeds or links a source PDF", failures)
    check("study-theme" in main_app and "document.documentElement.dataset.theme" in main_app, "Theme choice is not persisted and applied", failures)

    final_theme = diagram_css[diagram_css.find("/* Final dark theme layer:"):]
    check("#090909" in final_theme, "Final dark theme is not black-based", failures)
    for selector in ("body", ".lesson-card", ".interactive-lab", ".animated-figure-gallery", ".source-panel", ".guided-reader"):
        check(selector in final_theme, f"Final dark theme does not cover {selector}", failures)
    check("!important" in final_theme, "Final dark-theme cascade cannot override legacy light styles", failures)
    check("@media(max-width:660px)" in diagram_css, "Diagram layout has no small-screen rules", failures)
    check("overflow-x:auto" in base_css and "prefers-reduced-motion" in base_css + diagram_css, "Diagram layout lacks overflow or reduced-motion safety", failures)

    if failures:
        print("UI AUDIT FAILED")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    with_figures = len({(figure["unit"], figure["topicId"]) for figure in figures})
    print("UI AUDIT PASSED")
    print(f"- {len(figures)} source figures map to specialised or staged interactive renderers in {with_figures} lessons.")
    print("- All 227 lessons mount an interactive lab, and all sixteen unit contexts are covered.")
    print("- The final CSS cascade covers the black/charcoal theme, responsive overflow, and reduced-motion behavior.")
    print("- No learner-facing PDF iframe or PDF link remains in JSX source.")


if __name__ == "__main__":
    main()
