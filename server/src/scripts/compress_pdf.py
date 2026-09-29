import sys
import os
import fitz  # PyMuPDF

def compress_pdf(input_path, output_path, quality_level="ebook"):
    try:
        doc = fitz.open(input_path)

        # Map quality levels to deflate / cleanup flags
        # deflate=True compresses streams
        # garbage=4 aggressively cleans unused objects & compacts xref table
        # deflate_images=True re-encodes embedded images
        # deflate_fonts=True compresses embedded font dictionaries
        if quality_level == "screen":
            # Extreme compression
            doc.save(
                output_path,
                garbage=4,
                deflate=True,
                deflate_images=True,
                deflate_fonts=True,
                clean=True
            )
        elif quality_level == "ebook":
            # Recommended compression
            doc.save(
                output_path,
                garbage=3,
                deflate=True,
                deflate_images=True,
                deflate_fonts=True
            )
        else:
            # Low compression / High quality
            doc.save(
                output_path,
                garbage=2,
                deflate=True
            )

        doc.close()
        print("COMPRESS_SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    quality = sys.argv[3] if len(sys.argv) > 3 else "ebook"

    compress_pdf(input_file, output_file, quality)