#!/usr/bin/env python3
"""Derive lesson-to-PDF starting pages from the bundled extracted page text."""

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "public/source/lessons.json"
OUTPUT = ROOT / "src/diagram-pages.json"
FIGURES_OUTPUT = ROOT / "src/figure-catalog.json"

# The extracted course text contains three mismatched figure references.  These
# notes retain the source's wording while identifying the label printed beneath
# the actual diagram, so a learner is never asked to hunt through a PDF.
FIGURE_REFERENCE_NOTES = {
    (1, "1.6.6", "1.14"): {
        "referenceAliases": ["1.15"],
        "referenceNote": "The surrounding course prose calls this Figure 1.15; the diagram itself is printed as Figure 1.14.",
    },
    (4, "4.5.4", "4.17"): {
        "referenceAliases": ["4.21"],
        "referenceNote": "The surrounding course prose calls this Figure 4.21; the binary-cell diagram itself is printed as Figure 4.17.",
    },
    (9, "9.2.3", "9.2"): {
        "referenceAliases": ["9.3"],
        "referenceNote": "The surrounding course prose calls this Figure 9.3; the stored-program diagram itself is printed as Figure 9.2.",
    },
}


def normalize_with_offsets(text):
    """Collapse whitespace while preserving each normalized char's source offset."""
    chars, offsets = [], []
    in_whitespace = False
    for offset, char in enumerate(text):
        if char.isspace():
            if chars and not in_whitespace:
                chars.append(" ")
                offsets.append(offset)
            in_whitespace = True
        else:
            chars.append(char)
            offsets.append(offset)
            in_whitespace = False
    return "".join(chars).strip(), offsets


def diagram_model(caption, topic):
    text = f"{caption} {topic}".lower()
    if re.search(r"transistors per chip", text):
        return "scale"
    if re.search(r"adder|addition|subtractor|arithmetic circuit|arithmetic logic unit", text):
        return "adder"
    if re.search(r"gate|boolean|k-map|kmap|minterm|maxterm|multiplex|decoder|encoder|programmable logic|\bpla\b|truth table|logic diagram|combinational", text):
        return "logic"
    if re.search(r"pipeline|instruction cycle|clock pulse|interrupt cycle|loop structure", text):
        return "pipeline"
    if re.search(r"strobe|handshak|dma|interrupt|i/o|io channel|communication link|controller", text):
        return "transfer"
    if re.search(r"\b(disk|raid|cd|track|sector|hard disk|optical disk)\b", text):
        return "storage"
    if re.search(r"\b(cache|memory|ram|rom|dram|virtual address|memory address)\b", text):
        return "memory"
    if re.search(r"latch|flip.?flop|counter|register|binary cell|sequential", text):
        return "state"
    if re.search(r"mouse|keyboard|monitor|display|printer|scanner|camera|speaker|siri|alexa|modem|cathode ray|bitmap|bit-mapped|resolution|color planes|led", text):
        return "device"
    if re.search(r"assembler|program assembly|stored program|program characteristics", text):
        return "instruction"
    if re.search(r"instruction|addressing|stack|micro.?operation|micro.?instruction|control unit|wilkes|risc|cisc|operand data|hypothetical machine", text):
        return "instruction"
    if re.search(r"cpu|processor|architecture|multiprocessor|interconnect|computer system|bus", text):
        return "architecture"
    return "concept"


def derive():
    lessons = json.loads(LESSONS.read_text())
    output = {}
    figure_catalog = []
    total = 0
    for unit in lessons:
        unit_number = unit["unit"]
        block_number = (unit_number - 1) // 4 + 1
        block_text = (ROOT / f"public/source/block{block_number}.txt").read_text()
        pdf = (ROOT / f"public/source/pdfs/block-{block_number}.pdf").read_bytes()
        page_match = re.search(rb"/N\s+(\d+)", pdf[:8192])
        if not page_match:
            raise ValueError(f"Could not read page count from block {block_number} PDF")
        page_count = int(page_match.group(1))
        if block_text.count("\f") != page_count:
            raise ValueError(
                f"Block {block_number}: extracted-text page separators "
                f"({block_text.count(chr(12))}) do not match PDF page count ({page_count})"
            )

        normalized, offsets = normalize_with_offsets(block_text)
        section_starts = []
        for unit_row in lessons:
            if (unit_row["unit"] - 1) // 4 + 1 != block_number:
                continue
            for topic_row in unit_row["topics"]:
                section_text = re.sub(r"\s+", " ", topic_row["text"]).strip()
                section_start = normalized.find(section_text)
                if section_start >= 0:
                    section_starts.append((section_start, unit_row, topic_row))
        section_starts.sort(key=lambda row: row[0])

        if (unit_number - 1) % 4 == 0:
            caption_matches = list(re.finditer(
                r"\b(?:Figure|Fig\.)(?:\s*-\s*|\s*)(\d+(?:\.\d+)*)\s*:\s*([^\n]*?)(?=\s+(?:Figure|Fig\.)(?:\s*-\s*|\s*)\d+(?:\.\d+)*\s*:|$)",
                block_text,
                re.I | re.M,
            ))
            # A small number of genuine figure labels use a non-standard format in
            # the supplied extraction: "Figure: 4.13 ..." or no colon after the
            # number.  Restrict this recovery pattern to the beginning of a line
            # so ordinary prose such as "shown in Figure 4.13" is never mistaken
            # for a new diagram.
            caption_matches.extend(re.finditer(
                r"(?m)^\s*Figure\s*:?\s*(\d+(?:\.\d+)*)\s+([A-Z][^\n]+)",
                block_text,
            ))
            # Three unit 8 captions in the source omit a colon after the number.
            caption_matches.extend(re.finditer(
                r"(?im)^\s*Figure-\s*(8\.(?:7|8|13))\s+([^\n]+)", block_text
            ))
            seen_figure_offsets = set()
            for match in sorted(caption_matches, key=lambda item: item.start()):
                figure_id = match.group(1)
                caption = re.sub(r"\s+", " ", match.group(2)).strip(" \t\r\n\f")
                raw_offset = match.start()
                # The normal and recovery patterns intentionally overlap for
                # well-formed captions.  Keep one catalog entry per printed label.
                identity = (figure_id, raw_offset)
                if identity in seen_figure_offsets:
                    continue
                seen_figure_offsets.add(identity)
                normalized_offset = len(re.sub(r"\s+", " ", block_text[:raw_offset]).strip())
                owner = [row for row in section_starts if row[0] <= normalized_offset]
                if not owner:
                    continue
                _, owner_unit, owner_topic = owner[-1]
                page = block_text[:raw_offset].count("\f") + 1
                record = {
                    "id": f"b{block_number}-p{page}-{figure_id}-{len(figure_catalog) + 1}",
                    "unit": owner_unit["unit"],
                    "topicId": owner_topic["id"],
                    "topic": owner_topic["title"],
                    "figure": figure_id,
                    "caption": caption,
                    "page": page,
                    "model": diagram_model(caption, owner_topic["title"]),
                }
                record.update(FIGURE_REFERENCE_NOTES.get((owner_unit["unit"], owner_topic["id"], figure_id), {}))
                figure_catalog.append(record)

        topics = {}
        for topic in unit["topics"]:
            target = re.sub(r"\s+", " ", topic["text"]).strip()
            position = normalized.find(target)
            if position < 0:
                raise ValueError(
                    f"Unit {unit_number}, section {topic['id']} does not match Block {block_number} text"
                )
            source_offset = offsets[position]
            page = block_text[:source_offset].count("\f") + 1
            if not 1 <= page <= page_count:
                raise ValueError(f"Invalid page {page} for unit {unit_number}, section {topic['id']}")

            figures = {}
            for match in re.finditer(r"\b(?:Figure|Fig\.)\s*(\d+(?:\.\d+)*)", target, re.I):
                figure_id = match.group(1)
                if figure_id in figures:
                    continue
                caption = re.search(
                    rf"\b(?:Figure|Fig\.)\s*{re.escape(figure_id)}\s*:",
                    target,
                    re.I,
                )
                target_offset = caption.start() if caption else match.start()
                figure_offset = offsets[position + target_offset]
                figure_page = block_text[:figure_offset].count("\f") + 1
                if not 1 <= figure_page <= page_count:
                    raise ValueError(f"Invalid page for figure {figure_id} in unit {unit_number}")
                figures[figure_id] = figure_page

            topics[topic["id"]] = {"page": page, "figures": figures}
            total += 1
        output[str(unit_number)] = topics
        print(f"Unit {unit_number:02}: {len(topics)} sections mapped to Block {block_number} ({page_count} pages)")

    encoded = json.dumps(output, indent=2) + "\n"
    encoded_figures = json.dumps(figure_catalog, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != encoded:
            raise SystemExit("diagram-pages.json is stale; rerun without --check to regenerate it")
        if not FIGURES_OUTPUT.exists() or FIGURES_OUTPUT.read_text() != encoded_figures:
            raise SystemExit("figure-catalog.json is stale; rerun without --check to regenerate it")
        print(f"Verified {total} section texts, PDF pages, and {len(figure_catalog)} figure captions.")
    else:
        OUTPUT.write_text(encoded)
        FIGURES_OUTPUT.write_text(encoded_figures)
        print(f"Wrote {total} section maps and {len(figure_catalog)} figure captions.")


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--check", action="store_true", help="verify the checked-in page map without changing it")
args = parser.parse_args()
derive()
