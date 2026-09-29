import sys
import os
import re
import pdfplumber
import pandas as pd

def clean_sheet_title(title):
    # Excel sheets cannot contain: \ / ? * : [ ]
    cleaned = re.sub(r'[\\/*?:\[\]]', '_', title)
    return cleaned[:31]

def convert_pdf_to_excel(pdf_path, excel_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
                sheets_created = 0

                for page_idx, page in enumerate(pdf.pages):
                    tables = page.extract_tables()

                    for tbl_idx, table in enumerate(tables):
                        if not table or len(table) == 0:
                            continue

                        # Clean null/None values
                        cleaned_table = [
                            [("" if cell is None else str(cell).replace('\x00', '').strip()) for cell in row]
                            for row in table
                        ]

                        if len(cleaned_table) > 1:
                            raw_headers = cleaned_table[0]
                            # Ensure unique and non-empty headers
                            headers = []
                            for i, h in enumerate(raw_headers):
                                val = h.strip() if h.strip() else f"Column_{i+1}"
                                headers.append(val)
                            data = cleaned_table[1:]
                            df = pd.DataFrame(data, columns=headers)
                        else:
                            df = pd.DataFrame(cleaned_table)

                        # Modern pandas replacement for deprecated applymap
                        if hasattr(df, 'map'):
                            df = df.map(lambda x: str(x).replace('\x00', '') if isinstance(x, str) else x)
                        else:
                            df = df.applymap(lambda x: str(x).replace('\x00', '') if isinstance(x, str) else x)

                        sheet_title = clean_sheet_title(f"P{page_idx + 1}_Table{tbl_idx + 1}")
                        df.to_excel(writer, sheet_name=sheet_title, index=False)
                        sheets_created += 1

                # If no structured tables were found, extract text line-by-line into a readable sheet
                if sheets_created == 0:
                    rows = []
                    for page_idx, page in enumerate(pdf.pages):
                        text = page.extract_text()
                        if text:
                            for line in text.splitlines():
                                if line.strip():
                                    rows.append([f"Page {page_idx + 1}", line.strip()])

                    if not rows:
                        rows = [["Notice", "No text or tabular data found in PDF."]]

                    df_text = pd.DataFrame(rows, columns=["Page", "Content"])
                    df_text.to_excel(writer, sheet_name="Extracted_Content", index=False)

        print("CONVERSION_SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_xlsx = sys.argv[2]
    convert_pdf_to_excel(input_pdf, output_xlsx)