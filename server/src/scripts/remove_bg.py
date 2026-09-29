import sys
import os
import numpy as np
from PIL import Image, ImageFilter, ImageOps
from rembg import remove, new_session

# Use 'isnet-general-use' for crisp edges, or fallback to 'u2netp' for low memory
MODEL_NAME = "isnet-general-use"

try:
    session = new_session(MODEL_NAME)
except Exception:
    session = new_session("u2netp")


def preserve_text_and_details(orig_img_pil, cutout_pil):
    """
    Finds sharp high-contrast text, typography, and logo elements
    from the original image and preserves them inside the cutout's alpha mask.
    """
    # 1. Convert source to RGB and Grayscale
    orig_rgb = orig_img_pil.convert("RGB")
    gray = orig_rgb.convert("L")

    # 2. Detect sharp high-contrast edges (characters, strokes, line graphics)
    edges = gray.filter(ImageFilter.FIND_EDGES)
    enhanced_edges = ImageOps.autocontrast(edges)

    # 3. Create a binary mask for sharp strokes (letters, typography)
    text_mask = enhanced_edges.point(lambda p: 255 if p > 75 else 0)

    # 4. Extract alpha channel from rembg output
    cutout_rgba = cutout_pil.convert("RGBA")
    cutout_np = np.array(cutout_rgba)
    rembg_alpha = cutout_np[:, :, 3]

    # 5. Union: combine rembg subject cutout with detected text strokes
    text_mask_np = np.array(text_mask)
    combined_alpha = np.maximum(rembg_alpha, text_mask_np)

    # 6. Rebuild final RGBA image using original RGB values and merged alpha
    orig_np = np.array(orig_rgb)
    final_rgba = np.dstack((orig_np, combined_alpha))

    return Image.fromarray(final_rgba.astype(np.uint8), mode="RGBA")


def process_png(input_path, output_path):
    try:
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")

        # Ensure destination folder exists
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        with Image.open(input_path) as input_image:
            # 1. Primary AI subject isolation
            cutout_image = remove(
                input_image,
                session=session,
                post_process_mask=True
            )

            # 2. Preserve text, typographic lines, and logos
            final_image = preserve_text_and_details(input_image, cutout_image)

            # 3. Save as transparent PNG
            final_image.save(output_path, format="PNG")

        print("BG_REMOVE_SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("ERROR: Missing arguments. Usage: python remove_bg.py <input> <output>", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    process_png(input_file, output_file)