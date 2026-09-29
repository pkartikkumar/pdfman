import sys
import os
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pymupdf

def protect_pdf(input_pdf, output_pdf, user_password, owner_password=None):
    try:
        doc = pymupdf.open(input_pdf)
        
        # If no owner password is provided, use user password for both
        owner_pw = owner_password if owner_password else user_password

        # Permissions: Print allowed, copy/modify restricted by default
        perm = int(
            pymupdf.PDF_PERM_PRINT
            | pymupdf.PDF_PERM_ACCESSIBILITY
        )

        os.makedirs(os.path.dirname(os.path.abspath(output_pdf)), exist_ok=True)

        # Save with AES-256 encryption
        doc.save(
            output_pdf,
            encryption=pymupdf.PDF_ENCRYPT_AES_256,
            user_pw=user_password,
            owner_pw=owner_pw,
            permissions=perm,
            deflate=True
        )
        doc.close()
        print("PROTECT_SUCCESS")

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(1)
    
    in_pdf = sys.argv[1]
    out_pdf = sys.argv[2]
    user_pw = sys.argv[3]
    owner_pw = sys.argv[4] if len(sys.argv) > 4 else None

    protect_pdf(in_pdf, out_pdf, user_pw, owner_pw)