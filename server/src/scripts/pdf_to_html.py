import sys
import os
import pymupdf  # PyMuPDF

def pdf_to_html(input_path, output_path):
    try:
        doc = pymupdf.open(input_path)
        full_html = []

        for page in doc:
            # Extract structured XHTML from page
            page_html = page.get_text("xhtml")
            full_html.append(page_html)

        doc.close()

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n<hr/>\n".join(full_html))

        print("HTML_CONVERSION_SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    pdf_to_html(sys.argv[1], sys.argv[2])