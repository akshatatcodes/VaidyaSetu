# IMPPAT Database (Indian Medicinal Plants, Phytochemistry And Therapeutics)

## Action Required: Manual Data Download
The full IMPPAT dataset is curated by the Institute of Mathematical Sciences, Chennai and requires manual querying and export via their web interface.

### Download Instructions:
1. Visit the IMPPAT website: https://cb.imsc.res.in/imppat/
2. Navigate to the **Search/Browse** section or use the **Downloads** section if an updated bulk export is available.
3. Perform a query to retrieve all Phytochemical associations with Indian Medicinal Plants.
4. Export the resulting tables (usually tab-separated or CSV).
5. Name the core database file `imppat_master.csv` and place it in this folder (`backend/knowledge-base/imppat/`).
6. Name the phytochemical mapping file `imppat_phytochemicals.csv` and place it here.

## Data Schema Expected by Parser
The parsing script (`Step 9`) expects the downloaded CSV files to contain, at a minimum, the following columns (or equivalents):
* `Plant_Name` (Common English string)
* `Botanical_Name` (Scientific name string)
* `Sanskrit_Name` (Traditional Ayurvedic identifier)
* `Phytochemicals` (Comma-separated list of active compounds)
* `Molecular_Targets` (Associated biological targets)
* `Therapeutic_Uses` (Clinical indications and traditional uses)

*Note: A mock file `imppat_mock_data.csv` has been provided to allow the data processing pipeline to be developed while waiting for the official download.*

**Version:** Validated against IMPPAT 2.0 structure.
**Date Logged:** 2026-04-11
