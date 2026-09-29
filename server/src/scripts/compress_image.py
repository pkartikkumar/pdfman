import sys
import os
import io

# Force UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from PIL import Image, ImageOps

# 1. Allow large high-resolution images (bypasses DecompressionBombError)
Image.MAX_IMAGE_PIXELS = None

# 2. Register HEIF/HEIC/AVIF support cleanly without throwing AttributeError
try:
    import pillow_heif
    # This registers HEIF, HEIC, and AVIF decoders/encoders in Pillow
    pillow_heif.register_heif_opener()
    if hasattr(pillow_heif, 'register_avif_opener'):
        pillow_heif.register_avif_opener()
except ImportError:
    pass

def compress_image(input_path, output_path, target_level='recommended', convert_to='original'):
    try:
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")

        raw_img = Image.open(input_path)
        img = ImageOps.exif_transpose(raw_img)

        # Detect source format
        src_ext = os.path.splitext(input_path)[1].lower().replace('.', '')
        orig_format = (raw_img.format or src_ext or 'JPEG').upper()

        # Target output format
        out_format = orig_format
        if convert_to != 'original':
            out_format = convert_to.upper()

        if out_format in ['JPG', 'JPEG']:
            out_format = 'JPEG'

        # Quality presets
        quality_map = {
            'low': 45,
            'recommended': 75,
            'high': 88
        }
        quality = quality_map.get(target_level, 75)

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        # 1. JPEG
        if out_format == 'JPEG':
            if img.mode != 'RGB':
                bg = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    img = img.convert('RGBA')
                    bg.paste(img, mask=img.split()[3])
                else:
                    bg.paste(img.convert('RGB'))
                img = bg

            img.save(output_path, format='JPEG', quality=quality, optimize=True, progressive=True)

        # 2. PNG
        elif out_format == 'PNG':
            if target_level in ['low', 'recommended'] and img.mode in ('RGBA', 'RGB'):
                colors = 128 if target_level == 'low' else 256
                try:
                    quantized = img.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
                    quantized.save(output_path, format='PNG', optimize=True, compress_level=9)
                except Exception:
                    img.save(output_path, format='PNG', optimize=True, compress_level=9)
            else:
                img.save(output_path, format='PNG', optimize=True, compress_level=9)

        # 3. WEBP
        elif out_format == 'WEBP':
            if img.mode in ('CMYK', 'P'):
                img = img.convert('RGBA' if 'transparency' in img.info or img.mode == 'RGBA' else 'RGB')
            img.save(output_path, format='WEBP', quality=quality, method=4)

        # 4. AVIF
        elif out_format == 'AVIF':
            avif_q = max(20, min(quality - 10, 80))
            if img.mode in ('CMYK', 'P'):
                img = img.convert('RGB')
            img.save(output_path, format='AVIF', quality=avif_q)

        # 5. HEIC / HEIF
        elif out_format in ['HEIF', 'HEIC']:
            heic_q = max(30, min(quality, 85))
            if img.mode in ('CMYK', 'P'):
                img = img.convert('RGB')
            img.save(output_path, format='HEIF', quality=heic_q)

        # 6. Fallback (BMP, TIFF, etc.)
        else:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(output_path, format='JPEG', quality=quality, optimize=True)

        print("COMPRESS_SUCCESS")

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    level = sys.argv[3] if len(sys.argv) > 3 else 'recommended'
    convert = sys.argv[4] if len(sys.argv) > 4 else 'original'

    compress_image(input_file, output_file, level, convert)