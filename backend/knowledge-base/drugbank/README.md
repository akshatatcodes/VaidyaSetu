# DrugBank Data

## Action Required: Manual Data Download
The DrugBank database provides comprehensive biochemical and pharmacological information about drugs. Direct automated downloads are not permitted without registering for an account and accepting their specific license terms.

### Download Instructions:
1. Create a free "Academic" or "Non-Commercial" account on the DrugBank website: https://go.drugbank.com/releases/latest
2. Navigate to the **Downloads** section.
3. Download the **All Drugs (XML)** dataset. This contains the complete, structured data for all drugs including interactions.
4. Extract the `.zip` file if necessary.
5. Place the resulting `.xml` file (e.g., `full database.xml`) in this folder (`backend/knowledge-base/drugbank/`).
6. Optionally, download the "Drug Vocabulary" CSV mapping file and place it here as `drugbank_vocabulary.csv`.

## Data Schema Expected by Parser
The XML parsing script (`Step 10`) expects the standard DrugBank XML structure containing tags for:
* `<drug>` elements
* `<name>` and `<generic-name>`
* `<mechanism-of-action>`
* `<drug-interactions>` containing `<drug-interaction>` elements
* `<enzymes>` specifically checking for CYP pathways

*Note: A mock file `drugbank_mock_data.xml` has been provided to allow the data processing pipeline to be developed while waiting for the official download.*

**License Warning:** Ensure your use of DrugBank complies with their terms, especially regarding commercial application.
**Date Logged:** 2026-04-11
