import sys
import os
import io
import json
import zipfile

# Force UTF-8 encoding on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pymupdf

def convert_pdf_to_images(input_pdf, output_path, img_format="jpg", dpi=150):
    try:
        doc = pymupdf.open(input_pdf)
        num_pages = len(doc)
        if num_pages == 0:
            raise ValueError("The PDF document contains no pages.")

        format_clean = img_format.lower()
        if format_clean not in ["jpg", "jpeg", "png"]:
            format_clean = "jpg"

        ext = "jpg" if format_clean in ["jpg", "jpeg"] else "png"

        # Calculate zoom matrix based on standard 72 DPI base
        zoom = dpi / 72.0
        mat = pymupdf.Matrix(zoom, zoom)

        # Case 1: Single page PDF -> Export directly as single image file
        if num_pages == 1:
            page = doc[0]
            pix = page.get_pixmap(matrix=mat, alpha=(ext == "png"))
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            pix.save(output_path)
            print("SINGLE_IMAGE_SUCCESS")

        # Case 2: Multi-page PDF -> Render each page and bundle into a ZIP archive
        else:
            base_dir = os.path.dirname(os.path.abspath(output_path))
            os.makedirs(base_dir, exist_ok=True)
            
            temp_images = []
            zip_target = output_path if output_path.endswith(".zip") else output_path + ".zip"

            with zipfile.ZipFile(zip_target, "w", zipfile.ZIP_DEFLATED) as zipf:
                for idx, page in enumerate(doc):
                    pix = page.get_pixmap(matrix=mat, alpha=(ext == "png"))
                    temp_img_name = f"page_{idx + 1:03d}.{ext}"
                    temp_img_path = os.path.join(base_dir, f"temp_{idx}_{temp_img_name}")
                    pix.save(temp_img_path)
                    
                    # Add to zip with clean file name
                    zipf.write(temp_img_path, arcname=temp_img_name)
                    temp_images.append(temp_img_path)

            # Cleanup individual temp images
            for temp_file in temp_images:
                if os.path.exists(temp_file):
                    os.remove(temp_file)

            print("ZIP_SUCCESS")

        doc.close()

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    in_pdf = sys.argv[1]
    out_file = sys.argv[2]
    fmt = sys.argv[3] if len(sys.argv) > 3 else "jpg"
    target_dpi = int(sys.argv[4]) if len(sys.argv) > 4 else 150

    convert_pdf_to_images(in_pdf, out_file, fmt, target_dpi)