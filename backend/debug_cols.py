import pandas as pd
import unicodedata

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', str(input_str))
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def normalize_col(col):
    s = str(col).upper()
    s = s.replace('º', 'O').replace('°', 'O').replace('ª', 'A')
    s = s.replace('.', ' ').replace('-', ' ').replace('/', ' ')
    s = remove_accents(s)
    return ' '.join(s.split())

# Read with header at row 4
df = pd.read_excel(r'c:\Users\LUCAS\Meu Canto\MEUS PROJETOS\CENTAURO ERP 2\IMP. SERV. PREST. Contabilidade.xlsx', header=4)

# Normalize columns
df.columns = pd.Index([normalize_col(col) for col in df.columns])

# Test get_val function exactly as in commercial.py
def get_val(row, keywords):
    for col in df.columns:
        if col in keywords:
            if pd.notna(row[col]):
                try:
                    return float(row[col])
                except:
                    pass
    return 0.0

# Find invoice 4518
for index, row in df.iterrows():
    invoice_col = None
    for possible in ['NO NF', 'N NF', 'NF', 'NOTA']:
        if possible in df.columns:
            invoice_col = possible
            break
    
    if invoice_col and pd.notna(row[invoice_col]):
        try:
            invoice_num = str(int(float(row[invoice_col])))
        except:
            invoice_num = str(row[invoice_col])
        
        if invoice_num == '4518':
            print(f"Encontrada nota 4518 na linha {index}")
            print(f"VALOR PIS: {get_val(row, ['VALOR PIS'])}")
            print(f"VALOR COFINS: {get_val(row, ['VALOR COFINS'])}")
            print(f"ISS VALOR: {get_val(row, ['ISS VALOR'])}")
            print(f"S RETENCAO: {get_val(row, ['S RETENCAO', 'S/RETENCAO'])}")
            
            # Valor direto da coluna
            if 'VALOR PIS' in df.columns:
                print(f"Acesso direto VALOR PIS: {row['VALOR PIS']}")
            break
