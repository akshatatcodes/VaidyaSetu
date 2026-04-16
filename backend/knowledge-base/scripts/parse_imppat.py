import os
import csv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMPPAT_DIR = os.path.join(BASE_DIR, 'imppat')
PROCESSED_DIR = os.path.join(BASE_DIR, 'processed-text')

def parse_imppat_csv():
    print("Starting IMPPAT CSV Parsing (Step 9)...")
    
    # Try using the mock data or the master data if the user downloaded it
    target_csv = os.path.join(IMPPAT_DIR, 'imppat_master.csv')
    if not os.path.exists(target_csv):
        target_csv = os.path.join(IMPPAT_DIR, 'imppat_mock_data.csv')
        
    if not os.path.exists(target_csv):
         print("[ERROR] No IMPPAT data found to parse.")
         return

    output_file = os.path.join(PROCESSED_DIR, 'imppat_processed.txt')
    
    try:
        with open(target_csv, 'r', encoding='utf-8-sig') as f, open(output_file, 'w', encoding='utf-8') as out:
            reader = csv.DictReader(f)
            
            # Print columns to verify finding
            print(f"Detected columns: {reader.fieldnames}")
            
            count = 0
            for row in reader:
                plant = row.get("Plant_Name", "Unknown Plant")
                botanical = row.get("Botanical_Name", "")
                sanskrit = row.get("Sanskrit_Name", "")
                phytochemicals = row.get("Phytochemicals", "Not specified")
                targets = row.get("Molecular_Targets", "Unknown target")
                uses = row.get("Therapeutic_Uses", "Not specified")

                # Synthesize readable text paragraph for Vector embedding
                paragraph = (f"Indian Medicinal Plant '{plant}' (Botanical: {botanical}, Sanskrit: {sanskrit}) "
                             f"is traditionally used for {uses}. It contains active phytochemicals such as "
                             f"{phytochemicals}, which interact with molecular targets including {targets}.")
                             
                # Write to the unified text file, appending metadata for later chunking
                out.write(f"--- IMPPAT RECORD ---\n")
                out.write(f"Source: IMPPAT\n")
                out.write(f"Record: {botanical}\n")
                out.write(f"Content:\n{paragraph}\n\n")
                count += 1
                
        print(f"[SUCCESS] Extracted {count} plant records into {output_file}")
    except Exception as e:
         print(f"[ERROR] Error parsing IMPPAT: {e}")

if __name__ == "__main__":
    parse_imppat_csv()
