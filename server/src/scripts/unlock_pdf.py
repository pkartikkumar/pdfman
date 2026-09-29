import sys
import os
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pymupdf

def unlock_pdf(input_pdf, output_pdf, password=""):
    try:
        doc = pymupdf.open(input_pdf)

        # If the PDF is encrypted, authenticate with the provided password
        if doc.is_encrypted:
            auth_success = doc.authenticate(password)
            if not auth_success:
                print("INVALID_PASSWORD", file=sys.stderr)
                sys.exit(2)

        os.makedirs(os.path.dirname(os.path.abspath(output_pdf)), exist_ok=True)

        # Saving with encryption=PDF_ENCRYPT_NONE strips all passwords and permissions
        doc.save(
            output_pdf,
            encryption=pymupdf.PDF_ENCRYPT_NONE,
            deflate=True,
            garbage=4
        )
        doc.close()
        print("UNLOCK_SUCCESS")

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    in_pdf = sys.argv[1]
    out_pdf = sys.argv[2]
    pwd = sys.argv[3] if len(sys.argv) > 3 else ""

    unlock_pdf(in_pdf, out_pdf, pwd)