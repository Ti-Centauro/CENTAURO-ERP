import pandas as pd
import io
import os
import unicodedata

# Helper to remove accents
def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', str(input_str))
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

# Files to test
files = [
    r"c:\Users\LUCAS\Meu Canto\MEUS PROJETOS\CENTAURO ERP 2\IMP. SERV. PREST. Contabilidade.xlsx",
    r"c:\Users\LUCAS\Meu Canto\MEUS PROJETOS\CENTAURO ERP 2\IMP. DANF. PREST. Contabilidade.xlsx"
]

def test_import(file_path):
    print(f"\n{'='*60}")
    print(f"Testing File: {os.path.basename(file_path)}")
    print(f"{'='*60}")
    
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            
        df_preview = pd.read_excel(io.BytesIO(content), header=None, nrows=20).astype(str)
        
        header_row_index = 0
        found_header = False
        
        print("\n--- Scanning for Header ---")
        for i, row in df_preview.iterrows():
            row_str = " ".join(row.values).upper()
            row_str_norm = remove_accents(row_str)
            
            has_id = "NOTA" in row_str_norm or "NUMERO" in row_str_norm or "NF" in row_str_norm
            has_ctx = "VALOR" in row_str_norm or "EMISSAO" in row_str_norm or "DATA" in row_str_norm or "CLIENTE" in row_str_norm or "ICMS" in row_str_norm
            
            if has_id and has_ctx:
                header_row_index = i
                found_header = True
                print(f">>> FOUND HEADER AT ROW {i}")
                break
        
        if not found_header:
            print(">>> WARNING: Header not found, using row 0")

        df = pd.read_excel(io.BytesIO(content), header=header_row_index)
        
        # Normalize columns exactly like backend
        df.columns = [remove_accents(str(col).upper().replace('.', ' ').replace('-', ' ').strip()) for col in df.columns]
        df.columns = pd.Index([' '.join(col.split()) for col in df.columns])
        
        print(f"\n--- ALL COLUMNS (Normalized) ---")
        for i, col in enumerate(df.columns):
            print(f"  {i}: '{col}'")
        
        # Check which keywords match
        print(f"\n--- KEYWORD MATCHING TEST ---")
        
        # Material keywords
        material_keywords = ['ICMS', 'VALOR ICMS', 'VLR ICMS', 'VI ICMS', 'VL ICMS', 'VL ICMS TOTAL']
        ipi_keywords = ['IPI', 'VALOR IPI', 'VLR IPI', 'VI IPI', 'VL IPI']
        st_keywords = ['ST', 'VALOR ST', 'SUBST TRIBUTARIA', 'VI ST', 'VL ST', 'VALOR ST']
        pis_keywords = ['PIS', 'VI PIS', 'VL PIS', 'TOTAL PIS', 'TOTAL PIS TOTAL', 'VALOR PIS']
        cofins_keywords = ['COFINS', 'VI COFINS', 'VL COFINS', 'TOTAL COFINS', 'VALOR COFINS']
        
        # Service keywords
        iss_keywords = ['ISS RETIDO', 'RETENCAO ISS', 'VLR ISS', 'ISS', 'VI ISS', 'VL ISS', 'VALOR ISS']
        inss_keywords = ['INSS RETIDO', 'RETENCAO INSS', 'VLR INSS', 'INSS', 'VI INSS', 'VL INSS', 'VALOR INSS']
        irrf_keywords = ['IRRF RETIDO', 'RETENCAO IRRF', 'VLR IRRF', 'IRRF', 'VI IRRF', 'VL IRRF', 'VALOR IRRF']
        
        all_tests = [
            ("ICMS", material_keywords),
            ("IPI", ipi_keywords),
            ("ST", st_keywords),
            ("PIS", pis_keywords),
            ("COFINS", cofins_keywords),
            ("ISS", iss_keywords),
            ("INSS", inss_keywords),
            ("IRRF", irrf_keywords),
        ]
        
        for name, keywords in all_tests:
            matched = [k for k in keywords if k in df.columns]
            if matched:
                print(f"  {name}: MATCH -> {matched}")
            else:
                # Try to find partial matches
                partial = [col for col in df.columns if name in col]
                if partial:
                    print(f"  {name}: PARTIAL (not exact) -> {partial}")
                else:
                    print(f"  {name}: NO MATCH")
        
        # Sample first data row
        print(f"\n--- FIRST DATA ROW VALUES ---")
        if len(df) > 0:
            row = df.iloc[0]
            for col in df.columns:
                val = row[col]
                if pd.notna(val):
                    print(f"  '{col}': {val}")

    except Exception as e:
        import traceback
        print(f"ERROR: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    for f in files:
        test_import(f)
