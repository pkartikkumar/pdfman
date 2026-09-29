import sys
import os
from docx2pdf import convert

def docx_to_pdf(input_docx, output_pdf):
    try:
        convert(input_docx, output_pdf)
        print("CONVERSION_SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    docx_to_pdf(sys.argv[1], sys.argv[2])