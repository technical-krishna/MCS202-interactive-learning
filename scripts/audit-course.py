#!/usr/bin/env python3
"""Audit the bundled MCS-202 lesson, source, and diagram metadata.

This is a content-integrity check. It does not alter the extracted source text.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "public/source/lessons.json"
FIGURES = ROOT / "src/figure-catalog.json"
DERIVE = ROOT / "scripts/derive-diagram-pages.py"
ALLOWED_MODELS = {
    "architecture", "instruction", "pipeline", "transfer", "device", "concept", "scale",
    "logic", "adder", "memory", "state", "storage",
}
NONSTANDARD_PRINTED_CAPTIONS = {
    (3, "3.6", "3.16"): "Logic Circuit Using AND-OR gate",
    (3, "3.7.4", "3.30"): "Logic Diagram of a simple encoder",
    (4, "4.5.1", "4.13"): "A register with parallel load.",
}
SOURCE_LABEL_CORRECTIONS = {
    (1, "1.6.6", "1.14"): "1.15",
    (4, "4.5.4", "4.17"): "4.21",
    (9, "9.2.3", "9.2"): "9.3",
}


def normalise(text):
    return re.sub(r"\s+", " ", text).strip()


def check(condition, message, failures):
    if not condition:
        failures.append(message)


def main():
    failures = []
    lessons = json.loads(LESSONS.read_text())
    figures = json.loads(FIGURES.read_text())
    topics = {(unit["unit"], topic["id"]): topic for unit in lessons for topic in unit["topics"]}

    check(len(lessons) == 16, f"Expected 16 units, found {len(lessons)}", failures)
    check(len(topics) == 227, f"Expected 227 unique lesson sections, found {len(topics)}", failures)

    section_matches = 0
    for unit in lessons:
        unit_number = unit["unit"]
        block_number = (unit_number - 1) // 4 + 1
        unit_text = normalise((ROOT / f"public/source/unit{unit_number}.txt").read_text())
        block_path = ROOT / f"public/source/block{block_number}.txt"
        block_text = normalise(block_path.read_text())
        pdf = (ROOT / f"public/source/pdfs/block-{block_number}.pdf").read_bytes()
        page_match = re.search(rb"/N\s+(\d+)", pdf[:8192])
        check(page_match is not None, f"Block {block_number} PDF has no readable page count", failures)
        if page_match:
            extracted_pages = block_path.read_text().count("\f")
            check(extracted_pages == int(page_match.group(1)), f"Block {block_number}: {extracted_pages} extracted pages vs {page_match.group(1).decode()} PDF pages", failures)
        for topic in unit["topics"]:
            text = normalise(topic["text"])
            check(bool(text), f"Unit {unit_number}, {topic['id']} has no lesson text", failures)
            check(text in unit_text, f"Unit {unit_number}, {topic['id']} is missing from its unit reader", failures)
            check(text in block_text, f"Unit {unit_number}, {topic['id']} is missing from its block reader", failures)
            section_matches += 1

    check(bool(figures), "Figure catalog is empty", failures)
    figure_keys = {(figure.get("unit"), figure.get("topicId"), figure.get("figure")): figure for figure in figures}
    for figure in figures:
        topic = topics.get((figure.get("unit"), figure.get("topicId")))
        check(topic is not None, f"Figure {figure.get('id')} has no owning lesson", failures)
        check(figure.get("model") in ALLOWED_MODELS, f"Figure {figure.get('id')} has invalid model {figure.get('model')}", failures)
        check(isinstance(figure.get("page"), int) and figure["page"] > 0, f"Figure {figure.get('id')} has invalid page", failures)
        check(bool(figure.get("caption", "").strip()), f"Figure {figure.get('id')} has no caption", failures)
        block_number = (figure["unit"] - 1) // 4 + 1
        block_text = (ROOT / f"public/source/block{block_number}.txt").read_text()
        check(normalise(figure["caption"]) in normalise(block_text), f"Figure {figure['id']} caption is not in Block {block_number} source", failures)
        if topic:
            check(figure["topic"] == topic["title"], f"Figure {figure['id']} owner title does not match lesson metadata", failures)

    for key, caption in NONSTANDARD_PRINTED_CAPTIONS.items():
        figure = figure_keys.get(key)
        check(figure is not None, f"Non-standard printed figure label {key} is missing from the catalog", failures)
        if figure:
            check(figure.get("caption") == caption, f"Non-standard printed figure label {key} has the wrong caption", failures)
    for key, source_reference in SOURCE_LABEL_CORRECTIONS.items():
        figure = figure_keys.get(key)
        check(figure is not None, f"Corrected source figure label {key} is missing from the catalog", failures)
        if figure:
            check(source_reference in figure.get("referenceAliases", []), f"Figure {key} does not retain source reference {source_reference}", failures)
            check(bool(figure.get("referenceNote", "").strip()), f"Figure {key} does not explain the source-label mismatch", failures)

    derive = subprocess.run([sys.executable, str(DERIVE), "--check"], cwd=ROOT, text=True, capture_output=True)
    check(derive.returncode == 0, f"Diagram-page map audit failed: {derive.stdout}{derive.stderr}", failures)

    source = "\n".join(path.read_text() for path in (ROOT / "src").glob("*.jsx"))
    gallery_source = (ROOT / "src/AnimatedFigureGallery.jsx").read_text()
    diagram_css = (ROOT / "src/diagram.css").read_text()
    check("/source/pdfs/" not in source, "A learner-facing PDF reader or link remains in src", failures)
    check("AnimatedFigureGallery" in source, "Animated figure gallery is not connected to lessons", failures)
    for model in {figure["model"] for figure in figures}:
        model_is_special = f"model === '{model}'" in gallery_source
        model_has_stage = f"{model}:" in gallery_source
        check(model_is_special or model_has_stage, f"No interactive rendering path for '{model}' figure model", failures)
    check("html[data-theme=dark] body" in diagram_css and "#090909" in diagram_css, "Black dark-theme base is missing", failures)
    check("html[data-theme=dark] .lesson-card" in diagram_css, "Dark-theme lesson card override is missing", failures)

    if failures:
        print("COURSE AUDIT FAILED")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print("COURSE AUDIT PASSED")
    print(f"- {len(lessons)} units and {section_matches} section texts are present in both unit and block readers.")
    print(f"- {len(figures)} printed source-figure records have a lesson owner, valid model family, source caption, and mapped PDF page.")
    print("- Extracted page breaks match the PDF page counts for all four blocks.")
    print("- No learner-facing PDF reader or link remains in application source.")
    print("- Every figure model family has a rendering path; the final dark-theme layer uses black/charcoal surfaces.")


if __name__ == "__main__":
    main()
