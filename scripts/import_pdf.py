"""One-time, deterministic import. Requires pypdf; pass the source PDF as argv[1]."""
import json
import re
import sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
CHAPTERS = [
    (1, 36, "Network defense & wireless security", "Build a stronger first line of defense.", "network"),
    (37, 67, "Identity, access & professional practice", "The right access. The right responsibilities.", "identity"),
    (68, 91, "Cryptography & information protection", "Understand the science of keeping data safe.", "crypto"),
    (92, 133, "Threats, attacks & adversaries", "Know the threat. Recognize the pattern.", "threats"),
    (134, 146, "Endpoint tools & troubleshooting", "Get comfortable with the tools of the trade.", "endpoint"),
    (147, 165, "Vulnerability assessment & risk", "Find weaknesses and put risk in perspective.", "risk"),
    (166, 179, "Incident response & recovery", "Respond with confidence. Recover with a plan.", "response"),
]

def clean(text):
    return re.sub(r"\s+", " ", text).strip()

def main():
    source = Path(sys.argv[1])
    reader = PdfReader(source)
    blocks = []
    current = None
    for page_number, page in enumerate(reader.pages[1:53], 2):
        for line in page.extract_text(extraction_mode="layout").splitlines():
            if "CCST CYBERSECURITY / STUDY EDITION" in line or "CCST Reviewer | Page" in line:
                continue
            if re.match(r"^0[1-7]\s{2,}", line):
                continue
            start = re.match(r"^(\d{3})\s{2,}(.*)", line)
            if start:
                current = {"number": int(start[1]), "page": page_number, "lines": [start[2]]}
                blocks.append(current)
            elif current:
                current["lines"].append(line)
    assert [b["number"] for b in blocks] == list(range(1, 180)), "Missing or duplicate questions"
    questions = []
    for block in blocks:
        number = block["number"]
        raw = "\n".join(block["lines"]).strip()
        content, solution = raw.split("Correct answer:", 1)
        answer, explanation = solution.split("Explanation:", 1)
        answer_lines = answer.strip().splitlines()
        answer_label = clean(answer_lines[0])
        explanation = clean(explanation)
        options = []
        pairs = []
        if "See the matches below" in answer_label:
            kind = "matching"
            boundary = next(line.index("Correct match") for line in answer_lines if "Correct match" in line)
            for line in answer_lines[1:]:
                if not line.strip() or "Term or statement" in line:
                    continue
                columns = re.split(r"\s{2,}", line.strip(), maxsplit=1)
                if len(columns) == 2:
                    left, right = map(clean, columns)
                elif len(line) - len(line.lstrip()) > boundary // 2:
                    left, right = "", clean(line)
                else:
                    left, right = clean(line), ""
                if left and right:
                    pairs.append({"id": f"pair-{len(pairs)+1}", "left": left, "right": right})
                elif pairs and (left or right):
                    if left:
                        pairs[-1]["left"] += " " + left
                    if right:
                        pairs[-1]["right"] += " " + right
            # True/false rows use the same matching renderer with reusable values.
            assert len(pairs) >= 2, (number, pairs)
            prompt = clean(content)
            correct_ids = []
        else:
            parts = re.split(r"(?m)^\s{0,8}([A-F])\.\s+", content)
            prompt = clean(parts[0])
            options = [{"id": parts[i].lower(), "text": clean(parts[i+1])} for i in range(1, len(parts), 2)]
            assert len(options) >= 3, (number, options)
            key = answer_label.split("(")[0]
            correct_ids = [x.lower() for x in re.findall(r"\b[A-F]\b", key)]
            kind = "ordering" if " then " in key else "multiple" if len(correct_ids) > 1 else "single"
        status = "standard"
        if number in (9, 82):
            status = "invalid"
        elif number in (43, 46, 56, 57, 170, 173):
            status = "historical"
        elif "(" in answer_label:
            status = "qualified"
        chapter_id = next(i for i, (lo, hi, *_) in enumerate(CHAPTERS, 1) if lo <= number <= hi)
        exhibit = ""
        if number == 179:
            start = prompt.index("2025-08-29")
            end = prompt.index("Which description")
            exhibit = re.sub(r" (?=2025-08-29)", "\n", prompt[start:end].strip())
            prompt = prompt[:start].strip() + " " + prompt[end:]
        questions.append({
            "id": f"q{number:03}", "number": number, "chapterId": chapter_id,
            "sourcePage": block["page"], "type": kind, "prompt": prompt, "exhibit": exhibit,
            "options": options, "correctIds": correct_ids, "pairs": pairs,
            "answerLabel": answer_label, "explanation": explanation,
            "status": status, "scorable": status == "standard",
        })
    # Compare the parsed answers to the PDF's separate quick-key table.
    quick_keys = {}
    for line in reader.pages[53].extract_text(extraction_mode="layout").splitlines():
        for match in re.finditer(r"\b(\d{3})\s+(None|Match|Order|[A-F](?:\s+[A-F]){0,2})(?=\s+\d{3}\b|\s*$)", line):
            quick_keys[int(match[1])] = clean(match[2])
    assert len(quick_keys) == 179, "Quick answer key did not parse completely"
    for q in questions:
        actual = "Match" if q["type"] == "matching" else "Order" if q["type"] == "ordering" else "None" if q["status"] == "invalid" else " ".join(q["correctIds"]).upper()
        assert actual == quick_keys[q["number"]], (q["id"], actual, quick_keys[q["number"]])
    chapters = [{"id": i, "title": title, "description": desc, "slug": slug, "count": hi-lo+1} for i, (lo,hi,title,desc,slug) in enumerate(CHAPTERS, 1)]
    output = ROOT / "src/data/questions.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"source": source.name, "edition": "13 November 2026", "chapters": chapters, "questions": questions}, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(f"Imported {len(questions)} questions; {sum(q['scorable'] for q in questions)} standard practice items")
    for q in questions:
        if q["pairs"]:
            print(q["id"], json.dumps(q["pairs"], ensure_ascii=True))
    for status in ["standard", "qualified", "historical", "invalid"]:
        print(status, sum(q["status"] == status for q in questions))

if __name__ == "__main__":
    main()
