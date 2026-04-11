import os
import json
import time
from pymongo import MongoClient
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
EMBEDDINGS_DIR = os.path.join(BASE_DIR, 'embeddings')

# Load the backend environment variables
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

def get_mongo_client():
    uri = os.getenv('MONGODB_URI')
    if not uri:
        print("[ERROR] MONGODB_URI not found in backend/.env. Are you securely authenticated?")
        exit(1)
    
    print("Initiating Atlas Handshake...")
    client = MongoClient(uri)
    
    # Verify Atlas Configuration (Step 28)
    info = client.server_info()
    version = info.get('version', 'unknown')
    print(f"[SUCCESS] Connected to MongoDB Atlas. Cluster Version: {version}")
    
    return client

def upload_vectors():
    print("\nStarting Vector Record Insertion (Step 32)...")
    
    # Connect
    client = get_mongo_client()
    db = client['vaidyasetu']
    
    # Create / Select Collection (Step 29)
    # The collection `knowledge_chunks` is instantiated lazily or explicitly
    if 'knowledge_chunks' not in db.list_collection_names():
        db.create_collection('knowledge_chunks')
        print("Created new collection 'knowledge_chunks'")
    
    collection = db['knowledge_chunks']
    
    # Read vectors
    batch = []
    BATCH_SIZE = 500
    total_processed = 0
    total_inserted = 0
    
    start_time = time.time()
    
    # Iterate dynamically through all source subfolders in /embeddings
    for root, dirs, files in os.walk(EMBEDDINGS_DIR):
        for file in files:
            if not file.endswith('.json'):
                continue
                
            file_path = os.path.join(root, file)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    record = json.load(f)
                    
                # Clean up ID structure for Mongo (Replace chunks_id string with standard _id map or retain as string)
                # We will keep it as standard document insertion allowing MongoDB to auto-assign _id 
                # but retaining chunk_id for references
                batch.append(record)
                total_processed += 1
                
                # Execute batch insert
                if len(batch) >= BATCH_SIZE:
                    result = collection.insert_many(batch)
                    total_inserted += len(result.inserted_ids)
                    print(f"Uploaded batch of {len(batch)}. Total so far: {total_inserted}")
                    batch = []
                    
            except Exception as e:
                print(f"[ERROR] Failed to load or queue {file_path}: {e}")

    # Residual batch
    if len(batch) > 0:
        result = collection.insert_many(batch)
        total_inserted += len(result.inserted_ids)
        print(f"Uploaded final batch of {len(batch)}. Total so far: {total_inserted}")
        
    elapsed = time.time() - start_time
    
    # Verify insertion count
    db_count = collection.count_documents({})
    
    print("\n--- ATLAS VECTOR UPLOAD SUMMARY ---")
    print(f"Total Chunks Found: {total_processed}")
    print(f"Total Successfully Uploaded: {total_inserted}")
    print(f"Total Documents currently in Collection: {db_count}")
    print(f"Time Taken: {elapsed:.2f} seconds")
    
    if total_inserted != total_processed:
        print("[WARNING] Mismatch between chunks found and uploaded. Check permissions.")
    else:
        print("✅ Data synchronization complete.")

if __name__ == "__main__":
    upload_vectors()
