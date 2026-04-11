import os
import re
from bs4 import BeautifulSoup

try:
    import PyPDF2
except ImportError:
    print("PyPDF2 not installed. Run 'pip install PyPDF2' first.")
    exit(1)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, 'processed-text')

# Directories to process
PDF_DIRS = {
    'ICMR': os.path.join(BASE_DIR, 'icmr'),
    'AYUSH': os.path.join(BASE_DIR, 'ayush'),
    'WHO': os.path.join(BASE_DIR, 'who'),
    'CCRH': os.path.join(BASE_DIR, 'ccrh')
}
PUBMED_DIR = os.path.join(BASE_DIR, 'pubmed')

def clean_text(raw_text):
    # Remove multiple newlines and extra spaces
    text = re.sub(r'\n+', '\n', raw_text)
    text = re.sub(r'\s{2,}', ' ', text)
    # Basic attempt to remove typical header/footer pagination artifacts (e.g., matching standalone numbers)
    text = re.sub(r'\n\d+\n', '\n', text)
    return text.strip()

def parse_pdfs():
    print("Starting PDF Extraction (Steps 11, 13, 14, 15)...")
    output_file = os.path.join(PROCESSED_DIR, 'literature_processed.txt')
    count = 0
    
    with open(output_file, 'w', encoding='utf-8') as out:
        for source_name, folder_path in PDF_DIRS.items():
            if not os.path.exists(folder_path):
                continue
                
            for filename in os.listdir(folder_path):
                if not filename.endswith('.pdf'):
                    continue
                    
                file_path = os.path.join(folder_path, filename)
                print(f"Extracting {source_name}: {filename}...")
                
                try:
                    with open(file_path, 'rb') as pdf_file:
                        reader = PyPDF2.PdfReader(pdf_file)
                        text_blocks = []
                        for i, page in enumerate(reader.pages):
                            page_text = page.extract_text()
                            if page_text:
                                text_blocks.append(page_text)
                        
                        full_text = clean_text(" ".join(text_blocks))
                        
                        out.write(f"--- LITERATURE RECORD ---\n")
                        out.write(f"Source: {source_name}\n")
                        out.write(f"Document: {filename}\n")
                        out.write(f"Content:\n{full_text}\n\n")
                        count += 1
                except Exception as e:
                    print(f"[ERROR] Failed to read {filename}: {e}")

    print(f"[SUCCESS] Extracted {count} PDF documents into {output_file}")
    return count

def parse_pubmed_xml():
    print("Starting PubMed XML Extraction (Step 12)...")
    output_file = os.path.join(PROCESSED_DIR, 'pubmed_processed.txt')
    count = 0
    
    if not os.path.exists(PUBMED_DIR):
        return
        
    with open(output_file, 'w', encoding='utf-8') as out:
        for filename in os.listdir(PUBMED_DIR):
            if not filename.endswith('.xml'):
                continue
                
            file_path = os.path.join(PUBMED_DIR, filename)
            print(f"Extracting PubMed: {filename}...")
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    soup = BeautifulSoup(f.read(), 'xml')
                    
                    title_tag = soup.find('article-title')
                    title = title_tag.text if title_tag else "Unknown Title"
                    
                    abstract_tag = soup.find('abstract')
                    abstract = abstract_tag.text.strip() if abstract_tag else "No abstract."
                    
                    # We can synthesize the body text by stripping all tags in body
                    body_tag = soup.find('body')
                    body_text = body_tag.text.strip() if body_tag else "Body content missing or malformed."
                    
                    clean_abstract = clean_text(abstract)
                    
                    paragraph = (f"Research Paper: {title}\n"
                                 f"Abstract:\n{clean_abstract}\n")
                    
                    out.write(f"--- PUBMED RECORD ---\n")
                    out.write(f"Source: PubMed\n")
                    out.write(f"Document: {filename}\n")
                    out.write(f"Content:\n{paragraph}\n\n")
                    count += 1
            except Exception as e:
                print(f"[ERROR] Failed to read {filename}: {e}")

    print(f"[SUCCESS] Extracted {count} PubMed documents into {output_file}")

if __name__ == "__main__":
    parse_pdfs()
    parse_pubmed_xml()
