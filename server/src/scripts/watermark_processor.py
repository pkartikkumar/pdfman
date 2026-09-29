import sys
import os
import io
import json
import math

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pymupdf
from PIL import Image

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 6:
        return tuple(int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    return (0.88, 0.11, 0.28)

def apply_watermark(input_pdf, output_pdf, params_json_path, image_watermark_path=None):
    try:
        with open(params_json_path, 'r', encoding='utf-8') as f:
            p = json.load(f)

        doc = pymupdf.open(input_pdf)
        wm_type = p.get('type', 'text')
        text = p.get('text', 'PDFMAN')
        font_name = p.get('fontFamily', 'helv')
        font_size = float(p.get('fontSize', 32))
        color = hex_to_rgb(p.get('color', '#E11D48'))
        opacity = float(p.get('opacity', 0.5))  # e.g., 0.5 for 50%
        rotation = float(p.get('rotation', 45))
        mosaic = bool(p.get('mosaic', False))
        position = int(p.get('position', 5))
        from_page = int(p.get('fromPage', 1)) - 1
        to_page = int(p.get('toPage', len(doc))) - 1

        # Clean standard font family
        base_font = 'helv'
        if 'times' in font_name.lower():
            base_font = 'times'
        elif 'couri' in font_name.lower():
            base_font = 'couri'

        # If Image Watermark: Pre-multiply image with alpha mask
        temp_img_path = None
        if wm_type == 'image' and image_watermark_path and os.path.exists(image_watermark_path):
            img = Image.open(image_watermark_path).convert('RGBA')
            r, g, b, a = img.split()
            # Scale alpha by user opacity
            a = a.point(lambda val: int(val * opacity))
            img.putalpha(a)
            temp_img_path = image_watermark_path + "_wm_temp.png"
            img.save(temp_img_path, format="PNG")

        for page_idx in range(max(0, from_page), min(len(doc), to_page + 1)):
            page = doc[page_idx]
            rect = page.rect
            w, h = rect.width, rect.height

            # Coordinates
            points = []
            if mosaic:
                # 3x3 uniform mosaic matrix
                for y_ratio in [0.22, 0.50, 0.78]:
                    for x_ratio in [0.20, 0.50, 0.80]:
                        points.append((w * x_ratio, h * y_ratio))
            else:
                x_ratio = 0.20 if position in [1, 4, 7] else 0.50 if position in [2, 5, 8] else 0.80
                y_ratio = 0.18 if position in [1, 2, 3] else 0.50 if position in [4, 5, 6] else 0.82
                points.append((w * x_ratio, h * y_ratio))

            # 1. TEXT WATERMARK
            if wm_type == 'text':
                # Create an isolated transparent Form XObject (layer) for the watermark
                # This guarantees that PDF viewers apply the alpha opacity on glyphs
                box_w = max(font_size * len(text) * 1.5, 200)
                box_h = font_size * 3.0
                rad = math.radians(rotation)
                cos_r = math.cos(rad)
                sin_r = math.sin(rad)

                for (cx, cy) in points:
                    # Center the box at (cx, cy)
                    target_rect = pymupdf.Rect(cx - box_w / 2, cy - box_h / 2, cx + box_w / 2, cy + box_h / 2)
                    
                    # Create Shape on the page
                    shape = page.new_shape()
                    # Center rotation transform on (cx, cy)
                    morph_center = pymupdf.Point(cx, cy)
                    morph_matrix = pymupdf.Matrix(rotation)
                    
                    # Estimate insertion point for centered text
                    text_pt = pymupdf.Point(cx - (len(text) * font_size * 0.25), cy + (font_size * 0.35))
                    
                    shape.insert_text(
                        text_pt,
                        text,
                        fontsize=font_size,
                        fontname=base_font,
                        color=color,
                        morph=(morph_center, morph_matrix)
                    )
                    
                    # Commit using stroke/fill opacity
                    shape.finish(
                        color=color,
                        fill=color,
                        fill_opacity=opacity,
                        stroke_opacity=opacity
                    )
                    shape.commit(overlay=True)

            # 2. IMAGE WATERMARK
            elif wm_type == 'image' and temp_img_path:
                img_w = float(p.get('imageWidth', 120))
                img_h = float(p.get('imageHeight', 80))

                for (cx, cy) in points:
                    target_rect = pymupdf.Rect(
                        cx - img_w / 2,
                        cy - img_h / 2,
                        cx + img_w / 2,
                        cy + img_h / 2
                    )
                    page.insert_image(
                        target_rect,
                        filename=temp_img_path,
                        rotate=int(rotation),
                        overlay=True,
                        keep_proportion=True
                    )

        os.makedirs(os.path.dirname(os.path.abspath(output_pdf)), exist_ok=True)
        doc.save(output_pdf, garbage=4, deflate=True)
        doc.close()

        if temp_img_path and os.path.exists(temp_img_path):
            os.remove(temp_img_path)

        print("WATERMARK_SUCCESS")

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(1)
    in_pdf = sys.argv[1]
    out_pdf = sys.argv[2]
    json_path = sys.argv[3]
    img_path = sys.argv[4] if len(sys.argv) > 4 else None
    apply_watermark(in_pdf, out_pdf, json_path, img_path)