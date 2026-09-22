import os
import shutil

artifacts_dir = r"C:\Users\Diego.delaCalle\.gemini\antigravity\brain\79e734c0-4154-4683-9960-6693f49410bd"
target_dir = r"c:\Users\Diego.delaCalle\OneDrive - Kantar\Desarrollos_One_Drive\Matchings_Antigravity\old\AIronLabs\Restaurantes\app\public\platos"

os.makedirs(target_dir, exist_ok=True)

files = [
    ("brioche_sardina_1789167574473.png", "brioche_sardina.png"),
    ("tosta_setas_trufa_1789167585151.png", "tosta_setas_trufa.png"),
    ("alcachofas_romesco_1789167602406.png", "alcachofas_romesco.png"),
    ("torrija_caramelizada_1789167613764.png", "torrija_caramelizada.png")
]

for src_name, dest_name in files:
    src_path = os.path.join(artifacts_dir, src_name)
    dest_path = os.path.join(target_dir, dest_name)
    if os.path.exists(src_path):
        shutil.copy(src_path, dest_path)
        print(f"Copied {src_name} -> {dest_path}")
    else:
        print(f"Not found: {src_path}")
