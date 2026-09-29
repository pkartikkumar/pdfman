import sys
import os
import io
import warnings
import gc

# 1. Silence deprecation/runtime warnings so stderr stays clean
warnings.filterwarnings("ignore")

# 2. Force stdout and stderr to UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import numpy as np
from PIL import Image
import pymupdf
import easyocr
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader  # <--- Fixes BytesIO drawImage error
from pypdf import PdfWriter, PdfReader

# Initialize EasyOCR reader (verbose=False silences console progress bars)
reader = easyocr.Reader(['en'], gpu=False, verbose=False)

def create_text_layer_page(img_width, img_height, ocr_results):
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(img_width, img_height))
    can.setFillColorRGB(0, 0, 0, alpha=0.0)  # Invisible text layer for search/selection

    for bbox, text, prob in ocr_results:
        if not text.strip():
            continue
        tl, tr, br, bl = bbox
        x = tl[0]
        y = img_height - bl[1]  # Flip coordinate origin to bottom-left
        box_height = max(1, bl[1] - tl[1])
        font_size = max(6, int(box_height * 0.85))
        can.setFont("Helvetica", font_size)
        can.drawString(x, y, text)

    can.save()
    packet.seek(0)
    return PdfReader(packet).pages[0]

def process_ocr_pdf(input_path, output_path):
    try:
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        pdf_writer = PdfWriter()
        ext = os.path.splitext(input_path)[1].lower()

        if ext == '.pdf':
            doc = pymupdf.open(input_path)
            for page_index in range(len(doc)):
                page = doc[page_index]
                pix = page.get_pixmap(dpi=120)
                page_img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
                
                # 1. Run EasyOCR
                page_np = np.array(page_img)
                ocr_results = reader.readtext(page_np)

                # 2. Render background image using ImageReader
                bg_packet = io.BytesIO()
                bg_can = canvas.Canvas(bg_packet, pagesize=(page_img.width, page_img.height))
                
                # ImageReader wraps PIL Image directly for ReportLab
                img_reader = ImageReader(page_img)
                bg_can.drawImage(img_reader, 0, 0, width=page_img.width, height=page_img.height)
                bg_can.save()
                bg_packet.seek(0)
                base_page = PdfReader(bg_packet).pages[0]

                # 3. Merge invisible text layer over page image
                text_layer_page = create_text_layer_page(page_img.width, page_img.height, ocr_results)
                base_page.merge_page(text_layer_page)
                pdf_writer.add_page(base_page)

                del pix, page_img, page_np, ocr_results
                gc.collect()

            doc.close()
        else:
            # Single Image
            page_img = Image.open(input_path).convert("RGB")
            page_np = np.array(page_img)
            ocr_results = reader.readtext(page_np)

            bg_packet = io.BytesIO()
            bg_can = canvas.Canvas(bg_packet, pagesize=(page_img.width, page_img.height))
            
            img_reader = ImageReader(page_img)
            bg_can.drawImage(img_reader, 0, 0, width=page_img.width, height=page_img.height)
            bg_can.save()
            bg_packet.seek(0)
            base_page = PdfReader(bg_packet).pages[0]

            text_layer_page = create_text_layer_page(page_img.width, page_img.height, ocr_results)
            base_page.merge_page(text_layer_page)
            pdf_writer.add_page(base_page)

        with open(output_path, 'wb') as f_out:
            pdf_writer.write(f_out)

        print("OCR_SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    process_ocr_pdf(sys.argv[1], sys.argv[2])