import pandas as pd
import os

files = [
    r"c:\Users\LUCAS\Meu Canto\MEUS PROJETOS\CENTAURO ERP 2\IMP. SERV. PREST. Contabilidade.xlsx",
    r"c:\Users\LUCAS\Meu Canto\MEUS PROJETOS\CENTAURO ERP 2\IMP. DANF. PREST. Contabilidade.xlsx"
]

for file_path in files:
    print(f"--- Analyzing: {os.path.basename(file_path)} ---")
    try:
        # Read header=None to see all data
        df = pd.read_excel(file_path, header=None, nrows=10)
        print("First 10 rows dump:")
        print(df.to_string())
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    print("\n" + "="*30 + "\n")
