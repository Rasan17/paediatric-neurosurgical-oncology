/**
 * MULTIDISCIPLINARY PAEDIATRIC NEUROSURGICAL ONCOLOGY DATABASE
 * SQLite Database Schema Definitions & Preloaded Clinical Demonstrators
 * Conceived, designed and tested: Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)
 * Copyright 2026, Dr G Narenthiran, g_narenthiran@hotmail.com, all rights reserved.
 * Dedicated to Mrs Nirmaladevy Ganesalingam BSc
 */

export const SCHEMA_SQL = `
-- 1. Patients Master Oncology Registry
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    study_id TEXT UNIQUE NOT NULL,
    hospital_number TEXT,
    first_name TEXT,
    last_name TEXT,
    dob DATE,
    age_at_presentation REAL,
    age_unit TEXT DEFAULT 'Years', -- 'Months', 'Years'
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other', 'Unknown')),
    ethnicity TEXT,
    handedness TEXT CHECK(handedness IN ('Right', 'Left', 'Ambidextrous', 'Not Applicable / Infant')),
    baseline_lansky_kps INTEGER, -- Lansky (<16y) or KPS (>=16y) 0-100
    performance_scale_type TEXT DEFAULT 'Lansky Play-Performance (<16y)',
    predisposition_syndrome TEXT CHECK(predisposition_syndrome IN (
        'None / Sporadic',
        'Neurofibromatosis Type 1 (NF1)',
        'Neurofibromatosis Type 2 (NF2)',
        'Li-Fraumeni Syndrome (TP53)',
        'Gorlin Syndrome (Nevoid Basal Cell Carcinoma / PTCH1)',
        'Schwannomatosis (SMARCB1/LZTR1)',
        'Tuberous Sclerosis Complex (TSC1/TSC2)',
        'von Hippel-Lindau Disease (VHL)',
        'Constitutional Mismatch Repair Deficiency (CMMRD)',
        'Other Genetic / Syndromic'
    )),
    consultant_surgeon TEXT,
    consultant_neurooncologist TEXT,
    consultant_radiotherapist TEXT,
    clinical_nurse_specialist TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tumour Anatomical Site & Presentation
CREATE TABLE IF NOT EXISTS tumour_presentation (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL UNIQUE,
    anatomical_category TEXT CHECK(anatomical_category IN (
        'Brain - Posterior Fossa',
        'Brain - Supratentorial Hemispheric (Lobar)',
        'Brain - Suprasellar / Hypothalamic / Chiasmatic',
        'Brain - Brainstem / Tectal / Pons',
        'Brain - Pineal Region',
        'Brain - Intraventricular (Lateral / 3rd / 4th)',
        'Spine - Intramedullary',
        'Spine - Intradural Extramedullary',
        'Spine - Extradural / Vertebral',
        'Peripheral Nerve - Brachial Plexus',
        'Peripheral Nerve - Lumbosacral Plexus',
        'Peripheral Nerve - Major Peripheral Trunk',
        'Cranial Nerve (Vestibular / Trigeminal Schwannoma)',
        'Multifocal / Disseminated at Presentation'
    )),
    specific_anatomical_site TEXT,
    laterality TEXT CHECK(laterality IN ('Left', 'Right', 'Bilateral', 'Midline', 'Not Applicable')),
    symptom_duration_weeks REAL,
    -- Brain presentation signs
    headache_raised_icp INTEGER DEFAULT 0,
    vomiting_morning INTEGER DEFAULT 0,
    papilledema INTEGER DEFAULT 0,
    seizures INTEGER DEFAULT 0,
    cranial_nerve_palsy INTEGER DEFAULT 0,
    cn_details TEXT,
    cerebellar_ataxia_dysmetria INTEGER DEFAULT 0,
    torticollis_head_tilt INTEGER DEFAULT 0,
    hemiparesis_motor_deficit INTEGER DEFAULT 0,
    macrocephaly_rapid_head_growth INTEGER DEFAULT 0,
    endocrine_dysfunction INTEGER DEFAULT 0,
    endocrine_details TEXT,
    -- Spine presentation signs
    back_or_neck_pain INTEGER DEFAULT 0,
    radicular_pain INTEGER DEFAULT 0,
    spinal_motor_weakness INTEGER DEFAULT 0,
    sensory_level_deficit INTEGER DEFAULT 0,
    sphincter_disturbance INTEGER DEFAULT 0,
    spinal_deformity_scoliosis INTEGER DEFAULT 0,
    -- Peripheral nerve signs
    palpable_nerve_mass INTEGER DEFAULT 0,
    tinel_sign_positive INTEGER DEFAULT 0,
    focal_muscle_wasting INTEGER DEFAULT 0,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 3. Tumour Pathology, Histology & Molecular Profile
CREATE TABLE IF NOT EXISTS tumour_pathology_molecular (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL UNIQUE,
    who_diagnosis_2021 TEXT NOT NULL,
    who_grade INTEGER CHECK(who_grade IN (1, 2, 3, 4)),
    histological_subtype TEXT,
    ki67_labeling_index_pct REAL,
    -- Molecular & Genetic Markers
    braf_status TEXT CHECK(braf_status IN ('Wildtype', 'BRAF V600E Mutated', 'KIAA1549-BRAF Fusion', 'Other BRAF Alteration', 'Not Tested')),
    histone_h3_status TEXT CHECK(histone_h3_status IN ('Wildtype', 'H3 K27M Mutated (Diffuse Midline Glioma)', 'H3 G34R/V Mutated', 'H3.3 K27M', 'Not Tested')),
    medulloblastoma_subgroup TEXT CHECK(medulloblastoma_subgroup IN ('WNT-Activated', 'SHH-Activated (TP53-Wildtype)', 'SHH-Activated (TP53-Mutant)', 'Non-WNT/Non-SHH (Group 3)', 'Non-WNT/Non-SHH (Group 4)', 'Not Applicable')),
    ependymoma_subgroup TEXT CHECK(ependymoma_subgroup IN ('Posterior Fossa Group A (PFA)', 'Posterior Fossa Group B (PFB)', 'Supratentorial ZFTA-Fusion', 'Supratentorial YAP1-Fusion', 'Spinal Ependymoma', 'Spinal MYCN-Amplified', 'Myxopapillary', 'Subependymoma', 'Not Applicable')),
    smarcb1_ini1_status TEXT CHECK(smarcb1_ini1_status IN ('Retained (Intact)', 'Loss of Expression (ATRT)', 'SMARCA4 Loss', 'Not Applicable')),
    idh1_idh2_status TEXT CHECK(idh1_idh2_status IN ('Wildtype', 'IDH1 R132H Mutated', 'IDH2 Mutated', 'Not Tested')),
    codeletion_1p19q TEXT CHECK(codeletion_1p19q IN ('Intact', 'Co-deleted', 'Not Tested')),
    cdkn2a_b_deletion TEXT CHECK(cdkn2a_b_deletion IN ('Intact', 'Homozygous Deletion', 'Not Tested')),
    myc_mycn_amplification TEXT CHECK(myc_mycn_amplification IN ('No Amplification', 'MYC Amplified', 'MYCN Amplified', 'Both Amplified', 'Not Tested')),
    ntrk_fusion_status TEXT CHECK(ntrk_fusion_status IN ('Negative', 'NTRK1/2/3 Fusion Positive', 'Not Tested')),
    methylation_profiling_result TEXT,
    molecular_summary TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 4. Surgical Interventions & Hardware Register
CREATE TABLE IF NOT EXISTS surgeries (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    surgery_type TEXT CHECK(surgery_type IN (
        'Primary Surgical Resection',
        'Primary Biopsy (Stereotactic / Open / Endoscopic)',
        'Redo Surgery (Second-Look / Planned Residual Clearance)',
        'Surgery for Recurrence (Relapse Resection)',
        'Surgery for Metastasis (Drop Metastasis / Distant Decompression)',
        'CSF Diversion (ETV / VP Shunt / Ommaya Reservoir / EVD)'
    )),
    operation_date DATE NOT NULL,
    lead_surgeon TEXT,
    surgical_approach TEXT,
    intraop_neuromonitoring INTEGER DEFAULT 0,
    ionm_modalities TEXT,
    image_guidance TEXT,
    fluorescence_guidance TEXT, -- '5-ALA', 'Sodium Fluorescein', 'None'
    extent_of_resection_intended TEXT,
    blood_loss_ml REAL,
    duration_minutes INTEGER,
    intraop_complications TEXT,
    histology_specimen_sent INTEGER DEFAULT 1,
    operative_notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 5. Tumour-Related Outcomes & Staging
CREATE TABLE IF NOT EXISTS tumour_outcomes (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL UNIQUE,
    -- Extent of Resection (EOR) confirmed on early 24-48h post-op MRI
    extent_of_resection_achieved TEXT CHECK(extent_of_resection_achieved IN (
        'Gross Total Resection (GTR - 100% resection, no enhancing residue)',
        'Near Total Resection (NTR - >90% resection, small rim <1.5 cm2)',
        'Subtotal Resection (STR - 50-90% resection)',
        'Partial Resection / Debulking (<50%)',
        'Biopsy Only',
        'Unresectable'
    )),
    residual_tumour_present INTEGER DEFAULT 0,
    residual_volume_cm3 REAL,
    residual_location_description TEXT,
    -- Modified Chang Metastatic Stage
    metastatic_stage_chang TEXT CHECK(metastatic_stage_chang IN (
        'M0: No evidence of metastasis',
        'M1: Microscopic tumour cells in CSF cytology',
        'M2: Gross nodular seeding in intracranial subarachnoid space',
        'M3: Gross nodular seeding in spinal subarachnoid space (drop metastasis)',
        'M4: Extraneural metastasis beyond neuraxis'
    )),
    -- Functional Performance & Status
    current_performance_score INTEGER, -- 0 to 100
    performance_tool TEXT DEFAULT 'Lansky Play-Performance Scale',
    pcpc_functional_grade TEXT CHECK(pcpc_functional_grade IN (
        'Grade 1: Normal (Age-appropriate development & activities)',
        'Grade 2: Mild Disability (Age-appropriate ADLs, minor deficit)',
        'Grade 3: Moderate Disability (Accommodations needed for daily activities)',
        'Grade 4: Severe Disability (Dependent on caregivers for daily needs)',
        'Grade 5: Coma / Vegetative State'
    )),
    ambulatory_status TEXT CHECK(ambulatory_status IN (
        'Independently Ambulant without aids',
        'Ambulant with mobility aids (walker / cane)',
        'Non-Ambulant / Wheelchair Dependent',
        'Bedbound'
    )),
    -- Complications
    posterior_fossa_syndrome_cms INTEGER DEFAULT 0,
    cms_onset_day_postop INTEGER,
    cranial_nerve_deficit_postop INTEGER DEFAULT 0,
    postop_cn_details TEXT,
    swallowing_dysphagia_peg_needed INTEGER DEFAULT 0,
    endocrine_failure_postop INTEGER DEFAULT 0,
    postop_endocrine_details TEXT,
    csf_leak_or_pseudomeningocele INTEGER DEFAULT 0,
    postop_hydrocephalus_shunt_required INTEGER DEFAULT 0,
    surgical_site_infection_meningitis INTEGER DEFAULT 0,
    radiation_necrosis_or_vasculopathy INTEGER DEFAULT 0,
    overall_disease_status TEXT CHECK(overall_disease_status IN (
        'Complete Remission (No Evidence of Disease - NED)',
        'Stable Disease with Residue',
        'Partial Response to Adjuvant Therapy',
        'Local Recurrence / Progression',
        'Metastatic Progression / Dissemination',
        'Palliative / End of Life Care'
    )),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 6. Paediatric Neuro-Oncology & Chemotherapy Input
CREATE TABLE IF NOT EXISTS mdt_oncology (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    consultant_oncologist TEXT,
    chemotherapy_protocol_name TEXT,
    chemo_intent TEXT CHECK(chemo_intent IN ('Adjuvant / Curative', 'Neoadjuvant (Pre-op cytoreduction)', 'Infant Brain Sparing (Delay RT)', 'Targeted Molecular Therapy', 'Maintenance', 'Palliative')),
    targeted_agents_used TEXT, -- 'Dabrafenib + Trametinib', 'Larotrectinib', 'Everolimus', 'None'
    regimen_start_date DATE,
    cycles_planned INTEGER,
    cycles_completed INTEGER,
    treatment_response_rano TEXT CHECK(treatment_response_rano IN ('Complete Response (CR)', 'Partial Response (PR)', 'Stable Disease (SD)', 'Progressive Disease (PD)')),
    significant_toxicities TEXT,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 7. Radiotherapy & Clinical Oncology Input
CREATE TABLE IF NOT EXISTS mdt_radiotherapy (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    consultant_radiotherapist TEXT,
    radiotherapy_modality TEXT CHECK(radiotherapy_modality IN (
        'Proton Beam Therapy (PBT)',
        'Conventional Photon 3D-CRT / VMAT',
        'Stereotactic Radiosurgery (SRS / CyberKnife)',
        'Brachytherapy',
        'Not Given / Sparing Infant Protocol'
    )),
    treatment_field TEXT CHECK(treatment_field IN (
        'Craniospinal Irradiation (CSI) + Boost',
        'Focal Tumour Bed Boost Only',
        'Whole Brain + Boost',
        'Spinal Focal Field',
        'None'
    )),
    csi_dose_gy REAL,
    boost_dose_gy REAL,
    total_dose_gy REAL,
    fraction_count INTEGER,
    start_date DATE,
    completion_date DATE,
    toxicities_radionecrosis TEXT,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 8. Neurorehabilitation Team Input
CREATE TABLE IF NOT EXISTS mdt_rehabilitation (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    assessment_date DATE,
    physiotherapy_goals TEXT,
    occupational_therapy_goals TEXT,
    speech_language_dysphagia_plan TEXT,
    dietetics_nutrition_plan TEXT,
    assistive_equipment TEXT,
    summary TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 9. Neuropsychology Team Input
CREATE TABLE IF NOT EXISTS mdt_neuropsychology (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    assessment_date DATE,
    test_battery_used TEXT, -- 'WISC-V', 'WPPSI-IV', 'Bayley-4', 'Vineland-3'
    full_scale_iq_dq REAL,
    verbal_comprehension_score REAL,
    perceptual_fluid_reasoning_score REAL,
    working_memory_score REAL,
    processing_speed_score REAL,
    executive_function_summary TEXT,
    educational_placement_recommendations TEXT,
    ehcp_status TEXT,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 10. Family Discussions & Communication Register (Multi-Timepoint)
CREATE TABLE IF NOT EXISTS family_discussions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    discussion_date DATE NOT NULL,
    encounter_milestone TEXT CHECK(encounter_milestone IN (
        'Initial Diagnosis & Prognostic Orientation',
        'Pre-Operative Consent & Surgical Risk Discussion',
        'Post-Operative Histology & Molecular MDT Debrief',
        'Adjuvant Oncology (Chemo / Proton Therapy) Planning',
        'Surveillance & Mid-Treatment Progress Review',
        'Disease Recurrence / Relapse / Progression Conversation',
        'Surgical Redo / Re-operation Discussion',
        'Advance Care Planning / Palliative / Parallel Planning',
        'Transition to Teen / Adult Oncology Services'
    )),
    clinician_lead TEXT,
    cns_present TEXT,
    family_members_present TEXT,
    key_topics_discussed TEXT NOT NULL,
    family_preferences_and_goals TEXT,
    agreed_management_plan TEXT,
    emotional_support_referrals TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
`;

if (typeof window !== "undefined") window.SCHEMA_SQL = SCHEMA_SQL;
