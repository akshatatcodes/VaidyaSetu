import os
from pymongo import MongoClient
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

def get_mongo_client():
    uri = os.getenv('MONGODB_URI')
    if not uri:
        print("[ERROR] MONGODB_URI not found.")
        exit(1)
    return MongoClient(uri)

def test_vector_search(query_text):
    print(f"\nEvaluating Search Query: '{query_text}'")
    
    # Generate Vector for Query
    print("Loading embedding model parameters...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_vector = model.encode(query_text).tolist()
    
    # Establish Connection
    client = get_mongo_client()
    collection = client['vaidyasetu']['knowledge_chunks']
    
    # Step 33: Execute Vector Search
    print("Executing Kosine Similarity Search on Atlas...")
    
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 100,
                    "limit": 5
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "source_database": 1,
                    "document_title": 1,
                    "text": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        results = list(collection.aggregate(pipeline))
        
        if not results:
            print("[WARNING] Zero matches returned. Did you configure the 'vector_index' in Atlas?")
            return
            
        print("\n--- TOP 5 MATCHES ---")
        for i, match in enumerate(results, 1):
            source = match.get('source_database', 'Unknown')
            title = match.get('document_title', 'Unknown Title')
            score = match.get('score', 0)
            text_preview = match.get('text', '')[:150].replace('\n', ' ')
            
            print(f"\n[Match {i}] Confidence: {score:.4f} | Source: {source} ({title})")
            print(f"Content: {text_preview}...")
            
    except Exception as e:
        print(f"\n[ATLAS ERROR] Vector Search Failed!")
        print(f"Reason: {e}")
        print("-> Please double check you created the Search Index accurately as detailed in ATLAS_VECTOR_CONFIG_GUIDE.md")

if __name__ == "__main__":
    test_query = "What phytochemicals are found in Ashwagandha and what are its uses?"
    test_vector_search(test_query)
