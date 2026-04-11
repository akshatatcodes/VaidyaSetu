import os
import json
import uuid

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, 'processed-text')
CHUNKS_DIR = os.path.join(BASE_DIR, 'chunks')

# Constants for sliding window (Step 17 & 18)
CHUNK_SIZE = 800
CHUNK_OVERLAP = 200

# Metadata placeholders
DEFAULT_ORG_LANG = "English"

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

# Ensure the root chunk directory exists
ensure_dir(CHUNKS_DIR)

def generate_chunk_json(source_name, doc_title, text_content, seq_num, content_type):
    # Step 21: Add Rich Metadata
    return {
        "chunk_id": str(uuid.uuid4()),
        "source_database": source_name.strip(),
        "document_title": doc_title.strip() if doc_title else "Unknown",
        "publication_version": "Latest", 
        "chunk_sequence_number": seq_num,
        "content_type": content_type,
        "language": DEFAULT_ORG_LANG,
        "text": text_content.strip()
    }

def chunk_sliding_window(text):
    """ Yields overlapping chunks of CHUNK_SIZE with CHUNK_OVERLAP. """
    words = text.split()
    # If standard text is short, return whole
    if len(text) <= CHUNK_SIZE:
        yield text
        return
        
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + CHUNK_SIZE
        # Ensure we don't break a word in half by rolling backward to a space if we cut inside a word
        if end < text_len and text[end] != ' ':
            # Backtrack to last space
            last_space = text.rfind(' ', start, end)
            if last_space != -1 and last_space > start:
                end = last_space
                
        yield text[start:end]
        
        if end >= text_len:
             break
             
        start = end - CHUNK_OVERLAP
        # Re-adjust start forward if it lands in the middle of a word
        if start > 0 and text[start-1] != ' ' and text[start] != ' ':
             next_space = text.find(' ', start, end)
             if next_space != -1:
                 start = next_space + 1


def process_file(filename, is_structured, content_type):
    file_path = os.path.join(PROCESSED_DIR, filename)
    if not os.path.exists(file_path):
        return []

    print(f"Chunking {filename}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = f.read()

    # Split records by the standard delimiter we created in Phase 2
    records = data.split('--- ')
    
    all_chunks = []
    
    for raw_record in records:
        if not raw_record.strip():
            continue
            
        lines = raw_record.strip().split('\n')
        # Skip the header line since we split by '--- '
        if "RECORD ---" in lines[0]:
            lines = lines[1:]
            
        source = "Unknown"
        title = "Unknown"
        content_lines = []
        is_content = False
        
        for line in lines:
            if line.startswith("Source:"):
                source = line.split("Source:", 1)[1].strip()
            elif line.startswith("Record:") or line.startswith("Document:"):
                title = line.split(":", 1)[1].strip()
            elif line.startswith("Content:"):
                is_content = True
            elif is_content:
                content_lines.append(line)
                
        full_content = "\n".join(content_lines).strip()
        if not full_content:
            continue
            
        # Step 19: Process Structured Data into Chunks (Whole)
        if is_structured and len(full_content) < 2500: # IMPPAT/DrugBank are short enough 
            chunk = generate_chunk_json(source, title, full_content, 1, content_type)
            all_chunks.append(chunk)
            
        # Step 20: Process Unstructured Documents (Sliding window on literature)
        else:
            chunks_str = list(chunk_sliding_window(full_content))
            for i, chunk_text in enumerate(chunks_str):
                chunk = generate_chunk_json(source, title, chunk_text, i + 1, content_type)
                all_chunks.append(chunk)
                
    return all_chunks

def chunk_all_data():
    master_index = []
    
    # Process Structured
    imppat_chunks = process_file('imppat_processed.txt', is_structured=True, content_type="Herb Profile")
    drugbank_chunks = process_file('drugbank_processed.txt', is_structured=True, content_type="Drug Profile")
    
    # Process Unstructured (Semi-structured PubMed, unstructured PDFs)
    pubmed_chunks = process_file('pubmed_processed.txt', is_structured=False, content_type="Research Paper")
    literature_chunks = process_file('literature_processed.txt', is_structured=False, content_type="Medical Guideline")
    
    all_chunks = imppat_chunks + drugbank_chunks + pubmed_chunks + literature_chunks
    
    # Step 22: Store Chunks in Intermediate Storage
    for chunk in all_chunks:
        # Create subfolders based on source metadata
        source_safename = chunk['source_database'].replace(" ", "_").lower()
        if not source_safename:
             source_safename = "unclassified"
        
        source_dir = os.path.join(CHUNKS_DIR, source_safename)
        ensure_dir(source_dir)
        
        # Save individual chunk JSON
        chunk_path = os.path.join(source_dir, f"{chunk['chunk_id']}.json")
        with open(chunk_path, 'w', encoding='utf-8') as f:
            json.dump(chunk, f, indent=4)
            
        # Append to Master Index
        master_index.append({
            "chunk_id": chunk['chunk_id'],
            "source_database": chunk['source_database'],
            "document_title": chunk['document_title'],
            "chunk_sequence_number": chunk['chunk_sequence_number'],
            "filepath": f"{source_safename}/{chunk['chunk_id']}.json"
        })
        
    # Write Master Index
    index_path = os.path.join(CHUNKS_DIR, "master_index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(master_index, f, indent=4)

    print(f"[SUCCESS] Chunking Complete. Created {len(all_chunks)} chunks with overlapping windows.")
    print(f"[SUCCESS] Master Index generated at {index_path}")

if __name__ == "__main__":
    chunk_all_data()
