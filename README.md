# Multidisciplinary Paediatric Neurosurgical Oncology Database
### Dedicated Clinical Registry & Research Database for Paediatric Brain, Spine & Peripheral Nerve Tumours

**Conceived, designed and tested: Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN). Copyright 2026, Dr G Narenthiran, g_narenthiran@hotmail.com, all rights reserved.**  
by **Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)**  
*Dedicated with heartfelt love and gratitude to Mrs Nirmaladevy Ganesalingam BSc.*

---

## 🌟 Clinical & Academic Overview

The **Multidisciplinary Paediatric Neurosurgical Oncology Database** is a comprehensive clinical, surgical, and biostatistical registry designed for tertiary paediatric neurosurgical and neuro-oncology units.

It replaces generic database structures with rigorous, disease-specific ontologies and scoring engines aligned with the **WHO CNS 5th Edition 2021 Classification of Tumours of the Central Nervous System**.

---

## 🔬 Core Capabilities

### 1. Tumour Presentations Across All Anatomical Compartments
- **Paediatric Brain Tumours**: Supratentorial hemispheric, diencephalic/midline, sellar/suprasellar, posterior fossa, intraventricular, and pineal regions. Captures intracranial hypertension (early morning vomiting, headache, papilloedema, infant macrocephaly), cranial neuropathies, and ataxia.
- **Paediatric Spinal Cord Tumours**: Cervical, thoracic, lumbar, and sacral intramedullary and extramedullary neoplasms with myelopathy, progressive scoliosis, and sensory-motor levels.
- **Peripheral Nerve Tumours**: Schwannomas, neurofibromas, plexiform neurofibromas, and MPNSTs in sporadic and genetic cancer predisposition contexts.

### 2. Comprehensive Pathology & Molecular Profiling (WHO CNS 2021)
- Integrated histological diagnosis & WHO CNS Grade (1 to 4).
- *BRAF* alterations: V600E mutation vs *KIAA1549-BRAF* fusion.
- *Histone H3* status: H3 K27M / G34 alterations.
- *Medulloblastoma* molecular subgroups: WNT-activated, SHH-activated (*TP53* status), Group 3, and Group 4.
- *Ependymoma* molecular subgroups: Posterior fossa PFA vs PFB, Supratentorial ZFTA / YAP1 fusions, and spinal types.
- *SMARCB1/INI1* immunohistochemistry for atypical teratoid/rhabdoid tumours (ATRT).
- *CDKN2A/B* homozygous deletion and Ki-67 proliferation index.

### 3. Dedicated Surgery Log: Primary, Redo, Recurrence & Metastasis
- Distinct procedural categorization:
  - **Primary Surgical Resection**
  - **Primary Diagnostic Biopsy**
  - **Redo Surgery (Planned Second-Look / Staged Residual Clearance)**
  - **Surgery for Recurrent Tumour / Local Relapse**
  - **Surgery for Metastasis (Drop Metastases / CSF Dissemination)**
  - **CSF Diversion (ETV, VP Shunt, Ommaya Reservoir)**
- Operative details: lead surgeon, surgical approach, intraoperative neuromonitoring (MEP/SSEP/cranial nerves), fluorescence guidance (5-ALA, sodium fluorescein), neuronavigation, duration, blood loss, and intraoperative complications.

### 4. Disease-Specific Tumour Outcomes
- **Extent of Resection (EOR)**: Gross Total (GTR, 100%), Near Total (NTR, >90%), Subtotal (STR, 50-90%), Partial (PR, <50%), and Biopsy.
- **Residual Volume**: Postoperative volumetric assessment ($ ext{cm}^3$) and precise residual anatomical landmarks.
- **Chang Metastatic Staging**: M0 (no metastases), M1 (CSF cytology positive), M2 (intracranial seeding), M3 (spinal drop metastases), M4 (extraneural).
- **Functional Scoring**: Lansky Play-Performance Scale for children $<16$ years; Karnofsky Performance Status for adolescents $\ge 16$ years.
- **Paediatric Cerebral Performance Category (PCPC)**: Grade 1 (normal) to Grade 5 (severe coma).
- **Oncology Complications**: Cerebellar Mutism Syndrome (CMS/PFS), cranial nerve palsies, swallowing dysphagia / gastrostomy dependency, hypopituitarism, postoperative hydrocephalus, and radiation necrosis.

### 5. Multidisciplinary Team (MDT) Longitudinal Records
- **Paediatric Neuro-Oncologists**: Chemotherapy protocols (SIOP, HIT, Milan, LGG), targeted therapies (BRAF/MEK/NTRK/ALK inhibitors), toxicities, and RANO response criteria.
- **Radiotherapists / Clinical Oncologists**: Proton Beam Therapy (PBT), photon VMAT, CyberKnife/SRS, CSI + boost dosing in Gy, fraction count.
- **Neurorehabilitation**: Longitudinal records for Physiotherapy, Occupational Therapy, Speech & Language Therapy, and Dietetics.
- **Neuropsychology**: WISC-V, WPPSI-IV, Bayley-4 batteries, FSIQ/DQ scores, index breakdowns (VCI, PRI, WMI, PSI), executive function, and EHCP educational planning.

### 6. Family Discussions Log Across Disease Milestones
Structured registry for parental conferences and clinical discussions across milestones:
- Initial diagnosis and prognostic orientation
- Pre-operative consent & surgical risk conference
- Post-operative histology and molecular MDT debrief
- Adjuvant therapy planning (chemotherapy / proton beam)
- Surveillance and response evaluations
- Relapse / recurrence and redo surgical conversations
- Advance care planning / parallel planning

---

## 💻 Technical Architecture

- **Desktop Framework**: Tauri v2 + Rust + SQLite (Zero external runtime dependencies).
- **Frontend Architecture**: Modern modular web frontend (Vanilla HTML5 / CSS3 / ES Modules) with responsive clinical dark/light theme.
- **RBAC Security**: Role-Based Access Control (Developer, Administrator, Clinician) with SHA-256 hashed passwords and tamper-evident audit ledger.
- **Export Engines**:
  - **Stata 114 / 118** binary dataset generator (`.dta`) for biostatistical modeling.
  - **Multi-sheet Microsoft Excel** (`.xlsx`) workbook generator.
  - **Hierarchical JSON** schema export.
- **Automated Clinical Documents**:
  - Inpatient Neurosurgical Discharge Summary
  - Paediatric Neuro-Oncology Outpatient Clinic Review Letter

---

## 🚀 Quick Launch (macOS & Windows)

### macOS One-Click Launch
Double-click:
```bash
./Launch_Paediatric_Neurosurgical_Oncology.command
```
Or open in any web browser:
```bash
open index.html
```

### Building Native Desktop Installers (Tauri)
To compile native `.dmg` (macOS) or `.msi` (Windows) packages:
```bash
npm run build
# Or build standalone frontend:
node build.js
```

---

## 👤 Attribution & Licensing

- **Conceived, designed and tested**: **Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)**  
  *Consultant Paediatric Neurosurgeon*  
  *Email*: [g_narenthiran@hotmail.com](mailto:g_narenthiran@hotmail.com)  
  *Copyright © 2026, Dr G Narenthiran. All rights reserved.*

- **Dedication**:  
  *"Dedicated with utmost love and gratitude to Mrs Nirmaladevy Ganesalingam BSc."*
