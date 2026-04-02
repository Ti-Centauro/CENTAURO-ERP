import pandas as pd
import numpy as np

try:
    # Read without headers first to see what row the real headers are on
    df_raw = pd.read_excel(r"c:\Users\Centauro\Meu Canto\GitHub\Centauro\CENTAURO-ERP\Controle de Treinamentos - Centauro.xlsx", header=None)
    print("Raw headers (first 5 rows):")
    for i in range(5):
        print(f"Row {i}:", df_raw.iloc[i].tolist())
    
    # Try to find the person names column
    # Usually it's the one with most strings that look like names
except Exception as e:
    print(f"Error: {e}")
