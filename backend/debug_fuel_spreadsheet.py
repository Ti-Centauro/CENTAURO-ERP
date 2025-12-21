"""
Debug script to analyze the fuel spreadsheet structure
"""
import pandas as pd
import sys

def analyze_spreadsheet(filepath):
    print(f"Analyzing: {filepath}")
    
    # Try to read as HTML first (common for .xls web exports)
    try:
        tables = pd.read_html(filepath)
        print(f"\n✅ Read as HTML - Found {len(tables)} table(s)")
        
        for i, table in enumerate(tables):
            print(f"\n=== TABLE {i} ===")
            print(f"Shape: {table.shape}")
            print(f"Columns: {list(table.columns)}")
            print(f"\nFirst 10 rows:")
            print(table.head(10).to_string())
            
            # Find rows with 'LQS5041'
            for idx, row in table.iterrows():
                row_str = str(row.values)
                if 'LQS5041' in row_str or 'LQS 5041' in row_str:
                    print(f"\n=== FOUND LQS5041 at row {idx} ===")
                    for col_idx, val in enumerate(row):
                        print(f"  Column {col_idx}: {val}")
    except Exception as e:
        print(f"❌ HTML read failed: {e}")
        
        # Try as Excel
        try:
            df = pd.read_excel(filepath, engine='xlrd')
            print(f"\n✅ Read as Excel (xlrd)")
            print(f"Columns: {list(df.columns)}")
            print(df.head(10))
        except Exception as e2:
            print(f"❌ Excel read also failed: {e2}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analyze_spreadsheet(sys.argv[1])
    else:
        print("Usage: python debug_fuel_spreadsheet.py <path_to_spreadsheet>")
