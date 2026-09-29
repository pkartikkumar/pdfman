import sys
import os
import json
import pymupdf

# Force standard streams to UTF-8 on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 6:
        r = int(hex_str[0:2], 16) / 255.0
        g = int(hex_str[2:4], 16) / 255.0
        b = int(hex_str[4:6], 16) / 255.0
        return (r, g, b)
    return (0, 0, 0)

def apply_pdf_edits(input_pdf, output_pdf, edits_json_path):
    try:
        with open(edits_json_path, 'r', encoding='utf-8') as f:
            edits = json.load(f)

        doc = pymupdf.open(input_pdf)

        # edits is a dict where keys are 1-based page numbers: {"1": [...], "2": [...]}
        for page_str, items in edits.items():
            page_num = int(page_str) - 1
            if page_num < 0 or page_num >= len(doc):
                continue

            page = doc[page_num]

            for item in items:
                # Bounding box in native PDF coordinates: [x0, y0, x1, y1]
                bbox = item.get("bbox")
                if not bbox or len(bbox) != 4:
                    continue

                rect = pymupdf.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
                text = item.get("text", "")
                font_family = item.get("fontFamily", "Arimo")
                font_size = float(item.get("fontSize", 10.0))
                bold = item.get("bold", False)
                italic = item.get("italic", False)
                color = hex_to_rgb(item.get("color", "#000000"))
                align_str = item.get("align", "left")

                # Map alignment
                align_code = pymupdf.TEXT_ALIGN_LEFT
                if align_str == "center":
                    align_code = pymupdf.TEXT_ALIGN_CENTER
                elif align_str == "right":
                    align_code = pymupdf.TEXT_ALIGN_RIGHT
                elif align_str == "justify":
                    align_code = pymupdf.TEXT_ALIGN_JUSTIFY

                # Map font
                is_serif = "tinos" in font_family.lower() or "times" in font_family.lower()
                font_name = "times" if is_serif else "helv"
                if bold and italic:
                    font_name += "bi"
                elif bold:
                    font_name += "b"
                elif italic:
                    font_name += "i"

                # 1. Cleanly redact/erase original vector text inside the box
                page.add_redact_annot(rect, fill=(1, 1, 1))
                page.apply_redactions(images=0, graphics=0)

                # 2. Insert edited text reflowed inside the box (fits automatically)
                if text.strip():
                    # Attempt insert; if text is longer, reduce font size slightly so it never overflows
                    for test_size in [font_size, font_size * 0.9, font_size * 0.8, font_size * 0.7]:
                        rc = page.insert_textbox(
                            rect,
                            text,
                            fontsize=test_size,
                            fontname=font_name,
                            color=color,
                            align=align_code
                        )
                        if rc >= 0:  # Successfully fit inside box
                            break

        os.makedirs(os.path.dirname(os.path.abspath(output_pdf)), exist_ok=True)
        doc.save(output_pdf, garbage=4, deflate=True)
        doc.close()
        print("EDIT_SUCCESS")

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(1)
    apply_pdf_edits(sys.argv[1], sys.argv[2], sys.argv[3])