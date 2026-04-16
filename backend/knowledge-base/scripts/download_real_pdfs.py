import os
import requests
import time

# Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WHO_DIR = os.path.join(BASE_DIR, 'who')
ICMR_DIR = os.path.join(BASE_DIR, 'icmr')

# User-Agent to avoid immediate 403 blocks from simple bots
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/pdf'
}

def download_file(url, target_path, source_name):
    print(f"Attempting to download real {source_name} PDF from: {url}")
    try:
        response = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        if response.status_code == 200:
            with open(target_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"[SUCCESS] Downloaded to {target_path}\n")
        else:
            print(f"[FAILED] Server returned status code {response.status_code}\n")
    except Exception as e:
        print(f"[ERROR] downloading {source_name}: {e}\n")

def fetch_real_pdfs():
    # 1. WHO Monographs Volume 1
    # Often available on WHO IRIS
    who_vol1_url = "https://iris.who.int/bitstream/handle/10665/42052/9241545178.pdf"
    who_target = os.path.join(WHO_DIR, "WHO_Monographs_Vol1_Real.pdf")
    download_file(who_vol1_url, who_target, "WHO Monographs Vol 1")

    # 2. ICMR Generic Dietary/Diabetes Management Guidelines (National Institute of Nutrition India)
    # ICMR main site often blocks requests, but we can try a known dietary PDF link
    icmr_diet_url = "https://www.nin.res.in/downloads/DietaryGuidelinesforNINwebsite.pdf"
    icmr_target = os.path.join(ICMR_DIR, "ICMR_NIN_Dietary_Guidelines_Real.pdf")
    download_file(icmr_diet_url, icmr_target, "ICMR Dietary Guidelines")

if __name__ == "__main__":
    fetch_real_pdfs()
