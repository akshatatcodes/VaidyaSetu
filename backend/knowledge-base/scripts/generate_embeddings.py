import os
import json
import time
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHUNKS_DIR = os.path.join(BASE_DIR, 'chunks')
EMBEDDINGS_DIR = os.path.join(BASE_DIR, 'embeddings')

# Ensure embeddings directory structure
if not os.path.exists(EMBEDDINGS_DIR):
    os.makedirs(EMBEDDINGS_DIR)

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

# Steps 23 & 24: Initialization and Sanity Check
print("Initializing sentence-transformers with 'all-MiniLM-L6-v2' (Step 23)...")
model = SentenceTransformer('all-MiniLM-L6-v2')

print("Running sanity check layout...")
test_text = "This is a quick verification sentence."
test_embedding = model.encode(test_text)
dim_size = len(test_embedding)
print(f"[SANITY CHECK] Successfully loaded model. Embedded vector dimensions: {dim_size}")

if dim_size != 384:
    print(f"[ERROR] Expected 384 dimensions, got {dim_size}. Aborting.")
    exit(1)

def get_all_chunks():
    """ Load the master index if available or iterate through the chunk folders to find all target files. """
    master_index_path = os.path.join(CHUNKS_DIR, 'master_index.json')
    if os.path.exists(master_index_path):
        with open(master_index_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def main():
    print("Starting Embedding Batch Pipeline (Step 25)...")
    
    chunks_index = get_all_chunks()
    total_chunks = len(chunks_index)
    
    if total_chunks == 0:
        print("[ERROR] No chunks found in master_index.json. Execute chunk_text.py first.")
        return
        
    print(f"Total chunks registered: {total_chunks}")
    
    BATCH_SIZE = 100
    successful_count = 0
    failed_count = 0
    
    start_time = time.time()
    
    # Process batches
    for i in range(0, total_chunks, BATCH_SIZE):
        batch = chunks_index[i:i+BATCH_SIZE]
        print(f"Processing Batch {i//BATCH_SIZE + 1} ({len(batch)} chunks)...")
        
        # Load the physical JSON objects
        batch_payloads = []
        for idx_entry in batch:
            rel_path = idx_entry['filepath']
            abs_path = os.path.join(CHUNKS_DIR, rel_path)
            
            try:
                with open(abs_path, 'r', encoding='utf-8') as f:
                    payload = json.load(f)
                    batch_payloads.append((abs_path, payload))
            except Exception as e:
                print(f"[ERROR] Could not load {rel_path}: {e}")
                failed_count += 1
                
        # Extract Texts for batch inference
        texts = [pl['text'] for path, pl in batch_payloads]
        
        # ML Inference Generation
        try:
            embeddings_matrix = model.encode(texts)
            
            # Reattach, inject, and save to output
            for (old_path, original_json), emb_list in zip(batch_payloads, embeddings_matrix):
                original_json['embedding'] = emb_list.tolist()  # Convert numpy array to standard float list
                original_json['embedding_model'] = 'all-MiniLM-L6-v2'
                
                # Formulate target directory structure like /embeddings/icmr/xxx-x-x-x.json
                rel_base_folder = os.path.dirname(os.path.relpath(old_path, CHUNKS_DIR))
                target_folder = os.path.join(EMBEDDINGS_DIR, rel_base_folder)
                ensure_dir(target_folder)
                
                target_filename = os.path.basename(old_path)
                target_path = os.path.join(target_folder, target_filename)
                
                with open(target_path, 'w', encoding='utf-8') as f:
                    json.dump(original_json, f)
                    
                successful_count += 1
                
        except Exception as e:
             print(f"[ERROR] Model inference failed on batch: {e}")
             failed_count += len(batch_payloads)
             
    # Step 26: Monitor and Summary
    elapsed = time.time() - start_time
    print("\n--- EMBEDDING GENERATION SUMMARY ---")
    print(f"Total Chunks Embedded: {successful_count}")
    print(f"Failed Processes: {failed_count}")
    print(f"Output Dimension verified at: 384")
    print(f"Time Taken: {elapsed:.2f} seconds")
    print("Vectors injected. Database format ready for Atlas Search Insertion.")

if __name__ == "__main__":
    main()
