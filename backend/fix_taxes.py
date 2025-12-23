import pandas as pd
import unicodedata
import sqlite3

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
df.columns = pd.Index([normalize_col(col) for col in df.columns])

def get_val(row, keywords):
    for col in df.columns:
        if col in keywords:
            if pd.notna(row[col]):
                try:
                    return float(row[col])
                except:
                    pass
    return 0.0

# Process invoice 4518
for index, row in df.iterrows():
    invoice_col = 'NO NF' if 'NO NF' in df.columns else None
    if invoice_col and pd.notna(row[invoice_col]):
        try:
            invoice_num = str(int(float(row[invoice_col])))
        except:
            continue
        
        if invoice_num == '4518':
            print(f"=== NOTA 4518 ===")
            
            # Read values exactly like commercial.py
            tax_pis = get_val(row, ['VALOR PIS'])
            tax_cofins = get_val(row, ['VALOR COFINS'])
            tax_iss = get_val(row, ['ISS VALOR'])
            
            print(f"tax_pis = {tax_pis}")
            print(f"tax_cofins = {tax_cofins}")
            print(f"tax_iss = {tax_iss}")
            
            # Connect to DB and update directly
            conn = sqlite3.connect('centauro.db')
            cursor = conn.cursor()
            
            # Find billing by invoice number
            cursor.execute("SELECT id, tax_pis, tax_cofins, tax_iss FROM project_billings WHERE invoice_number = '4518'")
            result = cursor.fetchone()
            
            if result:
                billing_id = result[0]
                print(f"\nBilling ID no banco: {billing_id}")
                print(f"Valores atuais: tax_pis={result[1]}, tax_cofins={result[2]}, tax_iss={result[3]}")
                
                # Update
                cursor.execute("""
                    UPDATE project_billings 
                    SET tax_pis = ?, tax_cofins = ?, tax_iss = ?
                    WHERE id = ?
                """, (tax_pis, tax_cofins, tax_iss, billing_id))
                conn.commit()
                print(f"\n>>> Valores atualizados diretamente no banco!")
                
                # Verify
                cursor.execute("SELECT tax_pis, tax_cofins, tax_iss FROM project_billings WHERE id = ?", (billing_id,))
                new_vals = cursor.fetchone()
                print(f"Novos valores: tax_pis={new_vals[0]}, tax_cofins={new_vals[1]}, tax_iss={new_vals[2]}")
            else:
                print("Nota 4518 não encontrada no banco!")
            
            conn.close()
            break
