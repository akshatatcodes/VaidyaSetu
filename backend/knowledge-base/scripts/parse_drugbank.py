import os
from bs4 import BeautifulSoup

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRUGBANK_DIR = os.path.join(BASE_DIR, 'drugbank')
PROCESSED_DIR = os.path.join(BASE_DIR, 'processed-text')

def parse_drugbank_xml():
    print("Starting DrugBank XML Parsing (Step 10)...")
    
    # Try using the master database or fallback to mock
    target_xml = os.path.join(DRUGBANK_DIR, 'full database.xml')
    if not os.path.exists(target_xml):
        target_xml = os.path.join(DRUGBANK_DIR, 'drugbank_mock_data.xml')
        
    if not os.path.exists(target_xml):
         print("[ERROR] No DrugBank data found to parse.")
         return

    output_file = os.path.join(PROCESSED_DIR, 'drugbank_processed.txt')
    
    try:
        with open(target_xml, 'r', encoding='utf-8') as f:
            content = f.read()

        soup = BeautifulSoup(content, 'xml')
        drugs = soup.find_all('drug')
        
        # In a real setup, full database has root drug elements and nested ones; 
        # we filter for root drugs by checking their type attribute.
        root_drugs = [d for d in drugs if d.has_attr('type')]
        
        print(f"Detected {len(root_drugs)} drug records.")
        
        with open(output_file, 'w', encoding='utf-8') as out:
            count = 0
            for drug in root_drugs:
                name_tag = drug.find('name')
                name = name_tag.text if name_tag else "Unknown Drug"
                
                moa_tag = drug.find('mechanism-of-action')
                moa = moa_tag.text.strip() if moa_tag and moa_tag.text else "Mechanism not fully specified."
                
                # Fetch Interactions
                interactions_block = []
                interactions_group = drug.find('drug-interactions')
                if interactions_group:
                    for interaction in interactions_group.find_all('drug-interaction'):
                        i_name = interaction.find('name').text if interaction.find('name') else ""
                        i_desc = interaction.find('description').text if interaction.find('description') else ""
                        if i_name and i_desc:
                            interactions_block.append(f"- Interacts with {i_name}: {i_desc}")
                
                interactions_text = "\n".join(interactions_block) if interactions_block else "No specific interactions recorded."

                # Synthesize readable text paragraph
                paragraph = (f"Drug Profile for {name}:\n"
                             f"Mechanism of Action: {moa}\n"
                             f"Known Drug Interactions:\n{interactions_text}\n")
                             
                # Write to unified text file
                out.write(f"--- DRUGBANK RECORD ---\n")
                out.write(f"Source: DrugBank\n")
                out.write(f"Record: {name}\n")
                out.write(f"Content:\n{paragraph}\n\n")
                count += 1
                
        print(f"[SUCCESS] Extracted {count} drug records into {output_file}")
    except Exception as e:
         print(f"[ERROR] Error parsing DrugBank XML: {e}")

if __name__ == "__main__":
    parse_drugbank_xml()
