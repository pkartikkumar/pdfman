import sys
import os
import io
import fitz  # PyMuPDF
from pptx import Presentation
from pptx.util import Inches, Pt

def convert_pdf_to_pptx(pdf_path, pptx_path):
    try:
        doc = fitz.open(pdf_path)
        prs = Presentation()

        # Remove default blank slide template margins
        blank_slide_layout = prs.slide_layouts[6]

        for page in doc:
            # Match PowerPoint slide dimensions to the PDF page size
            rect = page.rect
            prs.slide_width = Inches(rect.width / 72.0)
            prs.slide_height = Inches(rect.height / 72.0)

            slide = prs.slides.add_slide(blank_slide_layout)

            # Render page as a crisp image for background layout preservation (2x zoom)
            pix = page.get_pixmap(dpi=150)
            image_stream = io.BytesIO(pix.tobytes("png"))

            slide.shapes.add_picture(
                image_stream,
                0,
                0,
                width=prs.slide_width,
                height=prs.slide_height
            )

        prs.save(pptx_path)
        doc.close()
        print("CONVERSION_SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_pptx = sys.argv[2]
    convert_pdf_to_pptx(input_pdf, output_pptx)