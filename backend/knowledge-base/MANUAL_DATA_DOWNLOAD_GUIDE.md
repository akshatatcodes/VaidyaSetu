# 📋 Step-by-Step: Downloading the Real Data Yourself

This guide details the manual steps required to acquire the complete datasets for the VaidyaSetu RAG Knowledge Base. Because these sites require accounts, license agreements, or block automated scraping, they must be downloaded manually.

## Step 1: Download IMPPAT Data
| Action | Details |
| :--- | :--- |
| **Where to go** | Visit the IMPPAT website at the Institute of Mathematical Sciences Chennai (https://cb.imsc.res.in/imppat/) |
| **What to click** | Navigate to the "Downloads" or "Data" section |
| **What to download**| The complete CSV file of Indian medicinal plants and the phytochemical mapping file |
| **License** | Free for academic and research use; check commercial terms |
| **Where to save** | Place both files in `knowledge-base/imppat/` |
| **Time required** | 10-15 minutes |

## Step 2: Download DrugBank Data
| Action | Details |
| :--- | :--- |
| **Where to go** | Create a free account at https://go.drugbank.com/releases/latest |
| **What to click** | After login, go to "Downloads" section |
| **What to download**| The "DrugBank Vocabulary" CSV and "Drug Interactions" XML (free tier versions) |
| **License** | Free for academic use; commercial requires paid license |
| **Where to save** | Place both files in `knowledge-base/drugbank/` |
| **Time required** | 15-20 minutes including account creation |

## Step 3: Download ICMR Guidelines (Manual Process)
| Action | Details |
| :--- | :--- |
| **Where to go** | Visit https://icmr.gov.in and navigate to "Publications" |
| **What to search** | "Diabetes management guidelines India", "Hypertension guidelines India", "Anemia prevention guidelines India" |
| **What to download**| The most recent PDF version of each guideline |
| **Why manual** | Government sites block automated scrapers to protect server load |
| **Where to save** | Place all PDFs in `knowledge-base/icmr/` |
| **Time required** | 20-30 minutes |

## Step 4: Download AYUSH Documents (Manual Process)
| Action | Details |
| :--- | :--- |
| **Where to go** | Visit https://ayush.gov.in |
| **What to search** | "Ayurvedic Formulary of India PDF", "List of recognized medicinal plants" |
| **What to download**| Any official PDF documents related to herb standardization and safety |
| **Where to save** | Place all PDFs in `knowledge-base/ayush/` |
| **Time required** | 15-20 minutes |

## Step 5: Download WHO Monographs (Manual Process)
| Action | Details |
| :--- | :--- |
| **Where to go** | Visit https://who.int and search "WHO monographs on selected medicinal plants" |
| **What to download**| PDFs for plants commonly used in India (Tulsi, Ashwagandha, Turmeric, Guggul, Giloy) |
| **Where to save** | Place all PDFs in `knowledge-base/who/` |
| **Time required** | 15-20 minutes |

## Step 6: Download CCRH Homeopathy Data (Manual Process)
| Action | Details |
| :--- | :--- |
| **Where to go** | Visit https://ccrhindia.nic.in |
| **What to search** | "Homeopathic Pharmacopoeia of India", research publications on interactions |
| **What to download**| Any available PDFs related to remedy properties and safety |
| **Where to save** | Place all PDFs in `knowledge-base/ccrh/` |
| **Time required** | 10-15 minutes |

---

## 🔄 After Downloading Real Data
Once you have downloaded the real files:

1. **Clean up**: Delete or rename the mock files the AI created (or move them to a separate `mock-data/` folder for reference).
2. **Move files**: Place all real files in their respective folders (`imppat/`, `drugbank/`, etc.).
3. **Execute Parsers**: Run the Phase 2 parsing scripts developed using the mock data.
4. **Verify**: Verify that the scripts work correctly with real data (minor adjustments may be needed for exact column names or XML structure depending on version changes).
