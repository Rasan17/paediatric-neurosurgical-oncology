/**
 * MULTIDISCIPLINARY PAEDIATRIC NEUROSURGICAL ONCOLOGY DATABASE ADAPTER
 * Unified Browser (LocalStorage / IndexedDB / SQL.js) & Native Tauri Desktop SQLite Bridge
 * Conceived, designed and tested: Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)
 * Copyright 2026, Dr G Narenthiran, g_narenthiran@hotmail.com, all rights reserved.
 * Dedicated to Mrs Nirmaladevy Ganesalingam BSc
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DatabaseAdapter = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

// Stata 114 Binary Generator Helper (Compatible with Stata 10-19, R haven/foreign, Python pandas)
function buildStata114Binary(variables, rows, datasetLabel = 'Paediatric Neuro-Oncology') {
  const nvar = variables.length;
  const nobs = rows.length;

  let rowSize = 0;
  for (const v of variables) {
    if (v.type <= 244) rowSize += v.type;
    else if (v.type === 251) rowSize += 1;
    else if (v.type === 252) rowSize += 2;
    else if (v.type === 253) rowSize += 4;
    else if (v.type === 254) rowSize += 4;
    else if (v.type === 255) rowSize += 8;
  }

  const headerSize = 109;
  const typlistSize = nvar;
  const varlistSize = nvar * 33;
  const srtlistSize = (nvar + 1) * 2;
  const fmtlistSize = nvar * 49;
  const lbllistSize = nvar * 33;
  const varlabsSize = nvar * 81;
  const dataSize = nobs * rowSize;
  const totalSize = headerSize + typlistSize + varlistSize + srtlistSize + fmtlistSize + lbllistSize + varlabsSize + 5 + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);
  const encoder = new TextEncoder();

  // 1. Header (109 bytes)
  view.setUint8(0, 114); // Release 114 (Stata 10-12 binary standard)
  view.setUint8(1, 1);   // Little-endian
  view.setUint8(2, 1);   // Filetype
  view.setUint8(3, 0);   // Unused
  view.setUint16(4, nvar, true);
  view.setUint32(6, nobs, true);

  const labelBytes = encoder.encode(datasetLabel.slice(0, 31));
  uint8.set(labelBytes, 10);

  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dateBytes = encoder.encode(dateStr.slice(0, 17));
  uint8.set(dateBytes, 42);

  let offset = headerSize;

  // 2. Typlist
  for (let i = 0; i < nvar; i++) view.setUint8(offset + i, variables[i].type);
  offset += typlistSize;

  // 3. Varlist
  for (let i = 0; i < nvar; i++) {
    const nameBytes = encoder.encode(variables[i].name.slice(0, 32));
    uint8.set(nameBytes, offset + (i * 33));
  }
  offset += varlistSize;

  // 4. Srtlist
  for (let i = 0; i <= nvar; i++) view.setInt16(offset + (i * 2), 0, true);
  offset += srtlistSize;

  // 5. Fmtlist
  for (let i = 0; i < nvar; i++) {
    const fmt = variables[i].fmt || (variables[i].type <= 244 ? `%${variables[i].type}s` : '%9.2f');
    const fmtBytes = encoder.encode(fmt.slice(0, 48));
    uint8.set(fmtBytes, offset + (i * 49));
  }
  offset += fmtlistSize;

  // 6. Lbllist
  for (let i = 0; i < nvar; i++) {
    if (variables[i].lbl) {
      const lblBytes = encoder.encode(variables[i].lbl.slice(0, 32));
      uint8.set(lblBytes, offset + (i * 33));
    }
  }
  offset += lbllistSize;

  // 7. Varlabs
  for (let i = 0; i < nvar; i++) {
    if (variables[i].label) {
      const labBytes = encoder.encode(variables[i].label.slice(0, 80));
      uint8.set(labBytes, offset + (i * 81));
    }
  }
  offset += nvar * 81;

  // 8. Expansion fields (5 zero bytes)
  offset += 5;

  // 9. Data Rows
  for (let r = 0; r < nobs; r++) {
    const row = rows[r];
    for (let i = 0; i < nvar; i++) {
      const v = variables[i];
      const val = row[v.name];
      const t = v.type;

      if (t <= 244) {
        const strVal = (val !== null && val !== undefined) ? String(val) : '';
        const strBytes = encoder.encode(strVal).slice(0, t);
        uint8.set(strBytes, offset);
        offset += t;
      } else if (t === 251) {
        if (val === null || val === undefined || isNaN(val)) view.setInt8(offset, 101);
        else view.setInt8(offset, parseInt(val, 10));
        offset += 1;
      } else if (t === 252) {
        if (val === null || val === undefined || isNaN(val)) view.setInt16(offset, 32741, true);
        else view.setInt16(offset, parseInt(val, 10), true);
        offset += 2;
      } else if (t === 253) {
        if (val === null || val === undefined || isNaN(val)) view.setInt32(offset, 2147483621, true);
        else view.setInt32(offset, parseInt(val, 10), true);
        offset += 4;
      } else if (t === 254) {
        if (val === null || val === undefined || isNaN(val)) view.setUint32(offset, 0x7f000000, true);
        else view.setFloat32(offset, parseFloat(val), true);
        offset += 4;
      } else if (t === 255) {
        if (val === null || val === undefined || isNaN(val)) {
          view.setUint32(offset, 0, true);
          view.setUint32(offset + 4, 0x7fe00000, true);
        } else {
          view.setFloat64(offset, parseFloat(val), true);
        }
        offset += 8;
      }
    }
  }

  return buffer;
}

class DatabaseAdapterImpl {
  constructor() {
    this.isTauri = typeof window !== 'undefined' && 
      (window.__TAURI__ !== undefined || window.__TAURI_INTERNALS__ !== undefined);
    this.localDB = null;
    this.STORAGE_KEY = 'paediatric_neuro_oncology_db_v1';
  }

  async init() {
    if (this.isTauri && window.__TAURI__?.core?.invoke) {
      console.log("⚡ [DB] Initialized in native Tauri desktop container with SQLite.");
      return true;
    }
    console.log("🌐 [DB] Initialized in universal browser storage engine.");
    this.initLocalStore();
    return true;
  }

  initLocalStore() {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
    if (raw) {
      try {
        this.localDB = JSON.parse(raw);
        if (this.localDB.patients && Array.isArray(this.localDB.patients)) {
          if (!this.localDB.surgeries) this.localDB.surgeries = [];
          if (!this.localDB.oncology) this.localDB.oncology = [];
          if (!this.localDB.radiotherapy) this.localDB.radiotherapy = [];
          if (!this.localDB.rehab) this.localDB.rehab = [];
          if (!this.localDB.neuropsych) this.localDB.neuropsych = [];
          if (!this.localDB.family_discussions) this.localDB.family_discussions = [];
          if (!this.localDB.users || !this.localDB.users.length) this.initDefaultUsers();
          if (!this.localDB.audit_logs || !this.localDB.audit_logs.length) this.initDefaultAuditLogs();
          if (!this.localDB.db_design_schema) this.initDefaultDbSchema();
          return;
        }
      } catch (e) {
        console.error("Local storage corrupted, restoring default demonstrators", e);
      }
    }

    this.localDB = {
      patients: this.getDemonstratorPatients(),
      surgeries: this.getDemonstratorSurgeries(),
      oncology: this.getDemonstratorOncology(),
      radiotherapy: this.getDemonstratorRadiotherapy(),
      rehab: this.getDemonstratorRehab(),
      neuropsych: this.getDemonstratorNeuropsych(),
      family_discussions: this.getDemonstratorFamilyDiscussions(),
      users: [],
      audit_logs: [],
      db_design_schema: null
    };

    this.initDefaultUsers();
    this.initDefaultAuditLogs();
    this.initDefaultDbSchema();
    this.saveLocalStore();
  }

  saveLocalStore() {
    if (typeof localStorage !== 'undefined' && this.localDB) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.localDB));
      } catch (e) {
        console.warn("Storage quota exceeded or unavailable:", e);
      }
    }
  }

  // =========================================================================
  // PRELOADED DEMONSTRATORS (BRAIN, SPINE, PERIPHERAL NERVE, REDO SURGERIES)
  // Conceived & designed by Dr G Narenthiran
  // =========================================================================
  getDemonstratorPatients() {
    return [
      {
        id: "pat-onc-001",
        study_id: "ONC-PILO-001",
        hospital_number: "RMCH-551928",
        first_name: "Oliver",
        last_name: "Vance",
        dob: "2018-09-12",
        age_at_presentation: 7.2,
        age_unit: "Years",
        gender: "Male",
        ethnicity: "White British",
        handedness: "Right",
        baseline_lansky_kps: 80,
        performance_scale_type: "Lansky Play-Performance (<16y)",
        predisposition_syndrome: "None / Sporadic",
        consultant_surgeon: "Dr G Narenthiran",
        consultant_neurooncologist: "Dr Victoria Shaw",
        consultant_radiotherapist: "Dr Marcus Cole",
        clinical_nurse_specialist: "Sister Rachel Adams",
        
        // Tumour presentation
        anatomical_category: "Brain - Posterior Fossa",
        specific_anatomical_site: "Right cerebellar hemisphere compressing 4th ventricle",
        laterality: "Right",
        symptom_duration_weeks: 6.0,
        headache_raised_icp: 1,
        vomiting_morning: 1,
        papilledema: 1,
        seizures: 0,
        cranial_nerve_palsy: 0,
        cerebellar_ataxia_dysmetria: 1,
        torticollis_head_tilt: 1,
        hemiparesis_motor_deficit: 0,
        macrocephaly_rapid_head_growth: 0,
        endocrine_dysfunction: 0,
        back_or_neck_pain: 1,
        radicular_pain: 0,
        palpable_nerve_mass: 0,

        // Pathology & Molecular
        who_diagnosis_2021: "Pilocytic Astrocytoma",
        who_grade: 1,
        histological_subtype: "Classic pilocytic with Rosenthal fibers & eosinophilic granular bodies",
        ki67_labeling_index_pct: 1.5,
        braf_status: "KIAA1549-BRAF Fusion",
        histone_h3_status: "Wildtype",
        medulloblastoma_subgroup: "Not Applicable",
        ependymoma_subgroup: "Not Applicable",
        smarcb1_ini1_status: "Retained (Intact)",
        idh1_idh2_status: "Wildtype",
        codeletion_1p19q: "Intact",
        cdkn2a_b_deletion: "Intact",
        myc_mycn_amplification: "No Amplification",
        ntrk_fusion_status: "Negative",
        molecular_summary: "KIAA1549:BRAF exon 16-9 fusion identified by RT-PCR and FISH; characteristic of cerebellar pilocytic astrocytoma with excellent prognosis.",

        // Tumour Outcomes
        extent_of_resection_achieved: "Gross Total Resection (GTR - 100% resection, no enhancing residue)",
        residual_tumour_present: 0,
        residual_volume_cm3: 0.0,
        residual_location_description: "Cavity clear on 48h post-op 3T volumetric MRI; 4th ventricle fully decompressed",
        metastatic_stage_chang: "M0: No evidence of metastasis",
        current_performance_score: 100,
        performance_tool: "Lansky Play-Performance Scale",
        pcpc_functional_grade: "Grade 1: Normal (Age-appropriate development & activities)",
        ambulatory_status: "Independently Ambulant without aids",
        posterior_fossa_syndrome_cms: 0,
        cranial_nerve_deficit_postop: 0,
        swallowing_dysphagia_peg_needed: 0,
        endocrine_failure_postop: 0,
        csf_leak_or_pseudomeningocele: 0,
        postop_hydrocephalus_shunt_required: 0,
        surgical_site_infection_meningitis: 0,
        radiation_necrosis_or_vasculopathy: 0,
        overall_disease_status: "Complete Remission (No Evidence of Disease - NED)",

        notes: "7-year-old presenting with 6 weeks of morning headaches and right-sided dysmetria. Underwent suboccipital telovelar approach GTR. Completely cured with surgery alone; under standard 6-monthly MRI surveillance."
      },
      {
        id: "pat-onc-002",
        study_id: "ONC-MED-002",
        hospital_number: "RMCH-662194",
        first_name: "Amara",
        last_name: "Chen",
        dob: "2020-04-18",
        age_at_presentation: 5.6,
        age_unit: "Years",
        gender: "Female",
        ethnicity: "Asian British",
        handedness: "Right",
        baseline_lansky_kps: 70,
        performance_scale_type: "Lansky Play-Performance (<16y)",
        predisposition_syndrome: "None / Sporadic",
        consultant_surgeon: "Dr G Narenthiran",
        consultant_neurooncologist: "Dr Victoria Shaw",
        consultant_radiotherapist: "Dr Marcus Cole",
        clinical_nurse_specialist: "Sister Rachel Adams",

        // Presentation
        anatomical_category: "Brain - Posterior Fossa",
        specific_anatomical_site: "4th ventricular vermian medulloblastoma obstructing cerebral aqueduct",
        laterality: "Midline",
        symptom_duration_weeks: 3.5,
        headache_raised_icp: 1,
        vomiting_morning: 1,
        papilledema: 1,
        seizures: 0,
        cranial_nerve_palsy: 1,
        cn_details: "Bilateral CN VI abducens paresis secondary to raised ICP",
        cerebellar_ataxia_dysmetria: 1,
        torticollis_head_tilt: 0,
        hemiparesis_motor_deficit: 0,
        macrocephaly_rapid_head_growth: 0,
        endocrine_dysfunction: 0,
        back_or_neck_pain: 1,
        radicular_pain: 0,
        palpable_nerve_mass: 0,

        // Pathology & Molecular
        who_diagnosis_2021: "Medulloblastoma, WNT-activated",
        who_grade: 4,
        histological_subtype: "Classic medulloblastoma with nuclear beta-catenin accumulation",
        ki67_labeling_index_pct: 45.0,
        braf_status: "Wildtype",
        histone_h3_status: "Wildtype",
        medulloblastoma_subgroup: "WNT-Activated",
        ependymoma_subgroup: "Not Applicable",
        smarcb1_ini1_status: "Retained (Intact)",
        idh1_idh2_status: "Wildtype",
        codeletion_1p19q: "Intact",
        cdkn2a_b_deletion: "Intact",
        myc_mycn_amplification: "No Amplification",
        ntrk_fusion_status: "Negative",
        molecular_summary: "CTNNB1 exon 3 point mutation confirmed with Monosomy 6. WNT-activated subgroup with low risk profile (>95% event-free survival with de-escalated therapy).",

        // Tumour Outcomes
        extent_of_resection_achieved: "Gross Total Resection (GTR - 100% resection, no enhancing residue)",
        residual_tumour_present: 0,
        residual_volume_cm3: 0.0,
        residual_location_description: "Complete resection of 4th ventricle lesion; obex and floor preserved",
        metastatic_stage_chang: "M0: No evidence of metastasis",
        current_performance_score: 90,
        performance_tool: "Lansky Play-Performance Scale",
        pcpc_functional_grade: "Grade 1: Normal (Age-appropriate development & activities)",
        ambulatory_status: "Independently Ambulant without aids",
        posterior_fossa_syndrome_cms: 0,
        cranial_nerve_deficit_postop: 0,
        swallowing_dysphagia_peg_needed: 0,
        endocrine_failure_postop: 0,
        csf_leak_or_pseudomeningocele: 0,
        postop_hydrocephalus_shunt_required: 0,
        surgical_site_infection_meningitis: 0,
        radiation_necrosis_or_vasculopathy: 0,
        overall_disease_status: "Complete Remission (No Evidence of Disease - NED)",

        notes: "Suboccipital craniectomy GTR performed. Lumbar puncture at 14 days post-op confirmed M0 status. Eligible for de-escalated craniospinal irradiation (CSI 18 Gy + boost) via Proton Beam Therapy plus adjuvant maintenance chemotherapy."
      },
      {
        id: "pat-onc-003",
        study_id: "ONC-SPIN-003",
        hospital_number: "RMCH-449102",
        first_name: "Marcus",
        last_name: "Bell",
        dob: "2013-11-25",
        age_at_presentation: 12.4,
        age_unit: "Years",
        gender: "Male",
        ethnicity: "Black British",
        handedness: "Right",
        baseline_lansky_kps: 60,
        performance_scale_type: "Lansky Play-Performance (<16y)",
        predisposition_syndrome: "None / Sporadic",
        consultant_surgeon: "Dr G Narenthiran",
        consultant_neurooncologist: "Dr Victoria Shaw",
        consultant_radiotherapist: "Dr Marcus Cole",
        clinical_nurse_specialist: "Sister Rachel Adams",

        // Presentation
        anatomical_category: "Spine - Intramedullary",
        specific_anatomical_site: "Cervicothoracic intramedullary cord lesion from C4 to T1 with syrinx",
        laterality: "Midline",
        symptom_duration_weeks: 14.0,
        headache_raised_icp: 0,
        vomiting_morning: 0,
        papilledema: 0,
        seizures: 0,
        cranial_nerve_palsy: 0,
        cerebellar_ataxia_dysmetria: 0,
        torticollis_head_tilt: 0,
        hemiparesis_motor_deficit: 0,
        macrocephaly_rapid_head_growth: 0,
        endocrine_dysfunction: 0,
        back_or_neck_pain: 1,
        radicular_pain: 1,
        spinal_motor_weakness: 1,
        sensory_level_deficit: 1,
        sphincter_disturbance: 1,
        spinal_deformity_scoliosis: 1,
        palpable_nerve_mass: 0,

        // Pathology & Molecular
        who_diagnosis_2021: "Spinal Ependymoma",
        who_grade: 2,
        histological_subtype: "Classic ependymoma with perivascular pseudorosettes",
        ki67_labeling_index_pct: 3.0,
        braf_status: "Wildtype",
        histone_h3_status: "Wildtype",
        medulloblastoma_subgroup: "Not Applicable",
        ependymoma_subgroup: "Spinal Ependymoma",
        smarcb1_ini1_status: "Retained (Intact)",
        idh1_idh2_status: "Wildtype",
        codeletion_1p19q: "Intact",
        cdkn2a_b_deletion: "Intact",
        myc_mycn_amplification: "No Amplification",
        ntrk_fusion_status: "Negative",
        molecular_summary: "Spinal ependymoma subgroup; negative for MYCN amplification (which heralds aggressive course). Good surgical plane along glial margin.",

        // Tumour Outcomes
        extent_of_resection_achieved: "Near Total Resection (NTR - >90% resection, small rim <1.5 cm2)",
        residual_tumour_present: 1,
        residual_volume_cm3: 0.4,
        residual_location_description: "Small residual fleck left densely adherent to right anterior horn / ventral cord surface to preserve motor power",
        metastatic_stage_chang: "M0: No evidence of metastasis",
        current_performance_score: 80,
        performance_tool: "Lansky Play-Performance Scale",
        pcpc_functional_grade: "Grade 2: Mild Disability (Age-appropriate ADLs, minor deficit)",
        ambulatory_status: "Ambulant with mobility aids (walker / cane)",
        posterior_fossa_syndrome_cms: 0,
        cranial_nerve_deficit_postop: 0,
        swallowing_dysphagia_peg_needed: 0,
        endocrine_failure_postop: 0,
        csf_leak_or_pseudomeningocele: 0,
        postop_hydrocephalus_shunt_required: 0,
        surgical_site_infection_meningitis: 0,
        radiation_necrosis_or_vasculopathy: 0,
        overall_disease_status: "Stable Disease with Residue",

        notes: "Intraoperative neurophysiological monitoring (IONM) guided C4-T1 posterior osteoplastic laminoplasty and midline myelotomy. Regained independent walking with ankle-foot orthosis."
      },
      {
        id: "pat-onc-004",
        study_id: "ONC-NF1-004",
        hospital_number: "RMCH-338190",
        first_name: "Chloe",
        last_name: "Davies",
        dob: "2011-08-30",
        age_at_presentation: 14.8,
        age_unit: "Years",
        gender: "Female",
        ethnicity: "White British",
        handedness: "Right",
        baseline_lansky_kps: 80,
        performance_scale_type: "Lansky Play-Performance (<16y)",
        predisposition_syndrome: "Neurofibromatosis Type 1 (NF1)",
        consultant_surgeon: "Dr G Narenthiran",
        consultant_neurooncologist: "Dr Victoria Shaw",
        consultant_radiotherapist: "Dr Marcus Cole",
        clinical_nurse_specialist: "Sister Rachel Adams",

        // Presentation
        anatomical_category: "Peripheral Nerve - Major Peripheral Trunk",
        specific_anatomical_site: "Right deep sciatic nerve with malignant transformation",
        laterality: "Right",
        symptom_duration_weeks: 8.0,
        headache_raised_icp: 0,
        vomiting_morning: 0,
        papilledema: 0,
        seizures: 0,
        cranial_nerve_palsy: 0,
        cerebellar_ataxia_dysmetria: 0,
        torticollis_head_tilt: 0,
        hemiparesis_motor_deficit: 0,
        macrocephaly_rapid_head_growth: 0,
        endocrine_dysfunction: 0,
        back_or_neck_pain: 0,
        radicular_pain: 1,
        palpable_nerve_mass: 1,
        tinel_sign_positive: 1,
        focal_muscle_wasting: 1,

        // Pathology & Molecular
        who_diagnosis_2021: "Malignant Peripheral Nerve Sheath Tumour (MPNST)",
        who_grade: 3,
        histological_subtype: "Spindle cell sarcoma arising within pre-existing plexiform neurofibroma",
        ki67_labeling_index_pct: 28.0,
        braf_status: "Wildtype",
        histone_h3_status: "Wildtype",
        medulloblastoma_subgroup: "Not Applicable",
        ependymoma_subgroup: "Not Applicable",
        smarcb1_ini1_status: "Retained (Intact)",
        idh1_idh2_status: "Wildtype",
        codeletion_1p19q: "Intact",
        cdkn2a_b_deletion: "Homozygous Deletion",
        myc_mycn_amplification: "No Amplification",
        ntrk_fusion_status: "Negative",
        molecular_summary: "CDKN2A/B homozygous deletion identified, confirming malignant transformation of plexiform neurofibroma in NF1.",

        // Tumour Outcomes
        extent_of_resection_achieved: "Gross Total Resection (GTR - 100% resection, no enhancing residue)",
        residual_tumour_present: 0,
        residual_volume_cm3: 0.0,
        residual_location_description: "En bloc resection with clear microscopic soft tissue margins; sural nerve cable grafting performed",
        metastatic_stage_chang: "M0: No evidence of metastasis",
        current_performance_score: 80,
        performance_tool: "Lansky Play-Performance Scale",
        pcpc_functional_grade: "Grade 2: Mild Disability (Age-appropriate ADLs, minor deficit)",
        ambulatory_status: "Ambulant with mobility aids (walker / cane)",
        posterior_fossa_syndrome_cms: 0,
        cranial_nerve_deficit_postop: 0,
        swallowing_dysphagia_peg_needed: 0,
        endocrine_failure_postop: 0,
        csf_leak_or_pseudomeningocele: 0,
        postop_hydrocephalus_shunt_required: 0,
        surgical_site_infection_meningitis: 0,
        radiation_necrosis_or_vasculopathy: 0,
        overall_disease_status: "Complete Remission (No Evidence of Disease - NED)",

        notes: "NF1 patient with painful enlarging thigh mass. Wide local excision with nerve sparing and reconstruction followed by adjuvant proton therapy."
      },
      {
        id: "pat-onc-005",
        study_id: "ONC-REDO-005",
        hospital_number: "RMCH-221085",
        first_name: "Benjamin",
        last_name: "Ross",
        dob: "2019-02-14",
        age_at_presentation: 6.8,
        age_unit: "Years",
        gender: "Male",
        ethnicity: "White British",
        handedness: "Right",
        baseline_lansky_kps: 70,
        performance_scale_type: "Lansky Play-Performance (<16y)",
        predisposition_syndrome: "None / Sporadic",
        consultant_surgeon: "Dr G Narenthiran",
        consultant_neurooncologist: "Dr Victoria Shaw",
        consultant_radiotherapist: "Dr Marcus Cole",
        clinical_nurse_specialist: "Sister Rachel Adams",

        // Presentation
        anatomical_category: "Brain - Posterior Fossa",
        specific_anatomical_site: "4th ventricle and right foramen of Luschka ependymoma with residual disease",
        laterality: "Right",
        symptom_duration_weeks: 5.0,
        headache_raised_icp: 1,
        vomiting_morning: 1,
        papilledema: 1,
        seizures: 0,
        cranial_nerve_palsy: 1,
        cn_details: "Right CN VII & VIII mild lower motor neuron paresis",
        cerebellar_ataxia_dysmetria: 1,
        torticollis_head_tilt: 0,
        hemiparesis_motor_deficit: 0,
        macrocephaly_rapid_head_growth: 0,
        endocrine_dysfunction: 0,
        back_or_neck_pain: 0,
        radicular_pain: 0,
        palpable_nerve_mass: 0,

        // Pathology & Molecular
        who_diagnosis_2021: "Posterior Fossa Ependymoma (PFA)",
        who_grade: 3,
        histological_subtype: "Anaplastic ependymoma with high mitotic activity & microvascular proliferation",
        ki67_labeling_index_pct: 18.0,
        braf_status: "Wildtype",
        histone_h3_status: "Wildtype",
        medulloblastoma_subgroup: "Not Applicable",
        ependymoma_subgroup: "Posterior Fossa Group A (PFA)",
        smarcb1_ini1_status: "Retained (Intact)",
        idh1_idh2_status: "Wildtype",
        codeletion_1p19q: "Intact",
        cdkn2a_b_deletion: "Intact",
        myc_mycn_amplification: "No Amplification",
        ntrk_fusion_status: "Negative",
        molecular_summary: "Posterior Fossa Group A (PFA) confirmed by H3 K27me3 global loss on immunohistochemistry and DNA methylation profiling. Aggressive biology mandating second-look redo clearance prior to proton beam therapy.",

        // Tumour Outcomes
        extent_of_resection_achieved: "Gross Total Resection (GTR - 100% resection, no enhancing residue)",
        residual_tumour_present: 0,
        residual_volume_cm3: 0.0,
        residual_location_description: "Redo surgery successfully cleared residual nodule in right cerebellomedullary cistern and foramen of Luschka",
        metastatic_stage_chang: "M0: No evidence of metastasis",
        current_performance_score: 90,
        performance_tool: "Lansky Play-Performance Scale",
        pcpc_functional_grade: "Grade 1: Normal (Age-appropriate development & activities)",
        ambulatory_status: "Independently Ambulant without aids",
        posterior_fossa_syndrome_cms: 0,
        cranial_nerve_deficit_postop: 1,
        postop_cn_details: "Transient right facial weakness (House-Brackmann Grade 2), improving",
        swallowing_dysphagia_peg_needed: 0,
        endocrine_failure_postop: 0,
        csf_leak_or_pseudomeningocele: 0,
        postop_hydrocephalus_shunt_required: 0,
        surgical_site_infection_meningitis: 0,
        radiation_necrosis_or_vasculopathy: 0,
        overall_disease_status: "Complete Remission (No Evidence of Disease - NED)",

        notes: "Initially underwent subtotal resection at peripheral unit. Transferred for planned second-look REDO surgery: telovelar and lateral cerebellomedullary re-exploration achieving complete GTR. Proceeding to focal proton beam therapy."
      }
    ];
  }

  getDemonstratorSurgeries() {
    return [
      {
        id: "surg-001",
        patient_id: "pat-onc-001",
        surgery_type: "Primary Surgical Resection",
        operation_date: "2025-10-14",
        lead_surgeon: "Dr G Narenthiran",
        surgical_approach: "Midline Suboccipital & Right Telovelar Approach",
        intraop_neuromonitoring: 1,
        ionm_modalities: "Brainstem Auditory Evoked Potentials (BAEPs), Cranial Nerves VII, IX, X, XII EMG, MEPs",
        image_guidance: "Medtronic StealthStation S8 Neuronavigation + Intraoperative Ultrasound",
        fluorescence_guidance: "None (Pilocytic astrocytoma)",
        extent_of_resection_intended: "Gross Total Resection (GTR)",
        blood_loss_ml: 60,
        duration_minutes: 210,
        intraop_complications: "None; clear dissection plane from brainstem pial surface",
        operative_notes: "Cystic tumour with mural nodule in right cerebellar hemisphere. Cyst drained, mural nodule resected completely under microscope."
      },
      {
        id: "surg-002",
        patient_id: "pat-onc-002",
        surgery_type: "Primary Surgical Resection",
        operation_date: "2025-11-04",
        lead_surgeon: "Dr G Narenthiran",
        surgical_approach: "Suboccipital Telovelar Approach with C1 laminectomy",
        intraop_neuromonitoring: 1,
        ionm_modalities: "Facial nerve, lower cranial nerves EMG, Somatosensory Evoked Potentials (SSEPs), Motor Evoked Potentials (MEPs)",
        image_guidance: "Neuronavigation + High-Frequency Micro-Ultrasound",
        fluorescence_guidance: "Sodium Fluorescein (Yellow 560 filter)",
        extent_of_resection_intended: "Gross Total Resection (GTR)",
        blood_loss_ml: 120,
        duration_minutes: 275,
        intraop_complications: "None; ventricular floor carefully preserved",
        operative_notes: "Vermis-splitting avoided; telovelar entry into 4th ventricle. Tumour debulked and separated from lateral recesses and floor."
      },
      {
        id: "surg-003",
        patient_id: "pat-onc-003",
        surgery_type: "Primary Surgical Resection",
        operation_date: "2026-01-20",
        lead_surgeon: "Dr G Narenthiran",
        surgical_approach: "C4-T1 Posterior Osteoplastic Laminoplasty & Midline Myelotomy",
        intraop_neuromonitoring: 1,
        ionm_modalities: "Continuous D-Wave Monitoring, Transcranial MEPs, Posterior Tibial SSEPs, Dorsal Column Mapping",
        image_guidance: "Intraoperative Ultrasound (Hitachi Arietta)",
        fluorescence_guidance: "None",
        extent_of_resection_intended: "Near Total Resection (NTR)",
        blood_loss_ml: 90,
        duration_minutes: 320,
        intraop_complications: "Transient 20% D-wave amplitude reduction on ventral manipulation; resolved with warm irrigation",
        operative_notes: "Midline dorsal myelotomy between dorsal columns. Encapsulated ependymoma dissected. 92% cleared, tiny ventral adherent rim left for motor safety."
      },
      {
        id: "surg-004",
        patient_id: "pat-onc-005",
        surgery_type: "Redo Surgery (Second-Look / Planned Residual Clearance)",
        operation_date: "2025-09-18",
        lead_surgeon: "Dr G Narenthiran",
        surgical_approach: "Re-exploration of Suboccipital Telovelar & Right Lateral Cerebellomedullary Approach",
        intraop_neuromonitoring: 1,
        ionm_modalities: "Full Cranial Nerve VII-XII EMG, BAEPs, MEPs, SSEPs",
        image_guidance: "3T MRI-fused Neuronavigation + Micro-Ultrasound",
        fluorescence_guidance: "5-ALA",
        extent_of_resection_intended: "Complete Clearance of Residual Disease",
        blood_loss_ml: 80,
        duration_minutes: 240,
        intraop_complications: "None",
        operative_notes: "Planned REDO surgery for residual ependymoma. Previous scar dissected; residual 12mm nodule in right foramen of Luschka identified and peeled off pial envelope completely."
      }
    ];
  }

  getDemonstratorOncology() {
    return [
      {
        id: "onc-med-001",
        patient_id: "pat-onc-002",
        consultant_oncologist: "Dr Victoria Shaw",
        chemotherapy_protocol_name: "SIOP PNET 5 MB - WNT Low-Risk Arm",
        chemo_intent: "Adjuvant / Curative",
        targeted_agents_used: "None (Standard chemotherapy arm)",
        regimen_start_date: "2025-12-15",
        cycles_planned: 6,
        cycles_completed: 3,
        treatment_response_rano: "Complete Response (CR)",
        significant_toxicities: "Grade 2 neutropenia (managed with G-CSF); no ototoxicity on audiometry",
        notes: "Following proton radiotherapy, on maintenance cyclophosphamide and vincristine. Tolerating well with steady weight gain."
      }
    ];
  }

  getDemonstratorRadiotherapy() {
    return [
      {
        id: "rt-001",
        patient_id: "pat-onc-002",
        consultant_radiotherapist: "Dr Marcus Cole",
        radiotherapy_modality: "Proton Beam Therapy (PBT)",
        treatment_field: "Craniospinal Irradiation (CSI) + Boost",
        csi_dose_gy: 18.0,
        boost_dose_gy: 36.0,
        total_dose_gy: 54.0,
        fraction_count: 30,
        start_date: "2025-11-25",
        completion_date: "2026-01-10",
        toxicities_radionecrosis: "None; mild alopecia, skin erythema Grade 1",
        notes: "Treated at Christie NHS Proton Beam Therapy Centre. Reduced-dose CSI 18 Gy used given low-risk WNT molecular profile to minimize late endocrine/neurocognitive sequelae."
      }
    ];
  }

  getDemonstratorRehab() {
    return [
      {
        id: "rehab-001",
        patient_id: "pat-onc-003",
        assessment_date: "2026-02-15",
        physiotherapy_goals: "Independent transfer from bed to chair, gait re-education with bilateral AFOs, stair climbing with single handrail.",
        occupational_therapy_goals: "Fine motor handwriting adaptations, laptop keyboarding assessment for school, adapted cutlery.",
        speech_language_dysphagia_plan: "Dysphagia screen normal, no aspiration risk. Diet standard.",
        dietetics_nutrition_plan: "High-protein diet to promote muscle recovery.",
        assistive_equipment: "Right-sided solid AFO, lightweight carbon forearm crutches.",
        summary: "Making outstanding motor gains; walking independently indoors with orthotics."
      }
    ];
  }

  getDemonstratorNeuropsych() {
    return [
      {
        id: "np-001",
        patient_id: "pat-onc-002",
        assessment_date: "2026-02-10",
        test_battery_used: "Wechsler Preschool and Primary Scale of Intelligence (WPPSI-IV)",
        full_scale_iq_dq: 98,
        verbal_comprehension_score: 104,
        perceptual_fluid_reasoning_score: 96,
        working_memory_score: 95,
        processing_speed_score: 92,
        executive_function_summary: "Normal attentional focus with minor fatigue towards end of session. Excellent vocabulary and social interaction.",
        educational_placement_recommendations: "Full-time mainstream primary school with designated rest breaks and individualized educational healthcare plan (EHCP).",
        ehcp_status: "EHCP Band 3 approved by Local Authority",
        notes: "Baseline post-surgical and post-PBT assessment. Shows well-preserved cognitive faculties."
      }
    ];
  }

  getDemonstratorFamilyDiscussions() {
    return [
      {
        id: "fam-001",
        patient_id: "pat-onc-002",
        discussion_date: "2025-11-01",
        encounter_milestone: "Initial Diagnosis & Prognostic Orientation",
        clinician_lead: "Dr G Narenthiran (Consultant Neurosurgeon)",
        cns_present: "Sister Rachel Adams (CNS)",
        family_members_present: "Mr David Chen (Father), Mrs Mei Chen (Mother)",
        key_topics_discussed: "MRI findings of 4th ventricle posterior fossa mass, hydrocephalus, urgency of surgical decompression, risks of surgery (including posterior fossa syndrome, infection, CSF leak).",
        family_preferences_and_goals: "Parents strongly expressed desire for complete resection with all intraoperative monitoring safeguards.",
        agreed_management_plan: "Proceed with suboccipital telovelar surgical resection on 04/11/2025.",
        emotional_support_referrals: "Macmillan Paediatric Cancer Support Pack provided; clinical psychologist introduction arranged."
      },
      {
        id: "fam-002",
        patient_id: "pat-onc-002",
        discussion_date: "2025-11-18",
        encounter_milestone: "Post-Operative Histology & Molecular MDT Debrief",
        clinician_lead: "Dr G Narenthiran & Dr Victoria Shaw",
        cns_present: "Sister Rachel Adams (CNS)",
        family_members_present: "Mother and Father",
        key_topics_discussed: "Histopathology confirms classic Medulloblastoma. Molecular profiling demonstrates WNT-activated subtype with Monosomy 6 and GTR confirmation on MRI. Explanation of the highly favourable prognostic significance of WNT subgroup (>95% cure).",
        family_preferences_and_goals: "Parents greatly relieved by favourable molecular diagnosis. Agreed to de-escalated trial protocol to preserve neurocognitive function.",
        agreed_management_plan: "Referral to National Proton Beam Therapy Centre at The Christie for 18 Gy CSI + boost, followed by SIOP maintenance chemotherapy.",
        emotional_support_referrals: "CLIC Sargent / Young Lives vs Cancer social worker assigned for travel grants to proton centre."
      },
      {
        id: "fam-003",
        patient_id: "pat-onc-005",
        discussion_date: "2025-09-08",
        encounter_milestone: "Surgical Redo / Re-operation Discussion",
        clinician_lead: "Dr G Narenthiran",
        cns_present: "Sister Rachel Adams (CNS)",
        family_members_present: "Mr and Mrs Ross",
        key_topics_discussed: "Review of transfer MRI demonstrating residual ependymoma nodule in foramen of Luschka. Discussion of the vital importance of complete macroscopic GTR in ependymoma before starting radiotherapy. Explanation of second-look redo surgical approach, risks to lower cranial nerves, and IONM protection.",
        family_preferences_and_goals: "Family understood that residual ependymoma carries high relapse risk and gave fully informed consent for redo surgery.",
        agreed_management_plan: "Schedule elective redo surgery for 18/09/2025.",
        emotional_support_referrals: "Direct access nurse contact number provided."
      }
    ];
  }

  // =========================================================================
  // CRUD OPERATIONS FOR PATIENTS
  // =========================================================================
  async getAllPatients() {
    if (this.isTauri && window.__TAURI__?.core?.invoke) {
      try {
        return await window.__TAURI__.core.invoke('get_all_patients');
      } catch (e) {
        console.warn("Tauri get_all_patients fallback:", e);
      }
    }
    return this.localDB.patients || [];
  }

  async getPatientById(id) {
    if (this.isTauri && window.__TAURI__?.core?.invoke) {
      try {
        return await window.__TAURI__.core.invoke('get_patient_by_id', { id });
      } catch (e) {
        console.warn("Tauri get_patient_by_id fallback:", e);
      }
    }
    return (this.localDB.patients || []).find(p => p.id === id) || null;
  }

  async savePatient(patientData, requestingUser = null) {
    if (this.isTauri && window.__TAURI__?.core?.invoke) {
      try {
        return await window.__TAURI__.core.invoke('save_patient', { patient: patientData });
      } catch (e) {
        console.warn("Tauri save_patient fallback:", e);
      }
    }

    if (!patientData.id) patientData.id = "pat-onc-" + Date.now();
    if (!patientData.created_at) patientData.created_at = new Date().toISOString();
    patientData.updated_at = new Date().toISOString();

    const idx = (this.localDB.patients || []).findIndex(p => p.id === patientData.id);
    const action = idx >= 0 ? 'UPDATE_PATIENT' : 'CREATE_PATIENT';
    if (idx >= 0) {
      this.localDB.patients[idx] = { ...this.localDB.patients[idx], ...patientData };
    } else {
      if (!this.localDB.patients) this.localDB.patients = [];
      this.localDB.patients.unshift(patientData);
    }
    this.saveLocalStore();

    await this.logAuditEvent({
      action: action,
      resource: 'patients',
      record_id: patientData.id,
      details: `Saved neuro-oncology patient record ${patientData.study_id || patientData.id} (${patientData.first_name} ${patientData.last_name}). Diagnosis: ${patientData.who_diagnosis_2021 || 'Tumour'}`,
      user: requestingUser?.username || 'system',
      role: requestingUser?.role || 'Clinician'
    });

    return patientData;
  }

  async deletePatient(id, requestingUser = null) {
    if (requestingUser && requestingUser.role === 'User') {
      throw new Error("Access Denied: Standard Clinician role does not have privilege to delete patient records. Only Administrator or Developer may delete records.");
    }

    if (this.isTauri && window.__TAURI__?.core?.invoke) {
      try {
        return await window.__TAURI__.core.invoke('delete_patient', { id });
      } catch (e) {
        console.warn("Tauri delete_patient fallback:", e);
      }
    }

    const patient = (this.localDB.patients || []).find(p => p.id === id);
    this.localDB.patients = (this.localDB.patients || []).filter(p => p.id !== id);
    this.localDB.surgeries = (this.localDB.surgeries || []).filter(s => s.patient_id !== id);
    this.localDB.oncology = (this.localDB.oncology || []).filter(o => o.patient_id !== id);
    this.localDB.radiotherapy = (this.localDB.radiotherapy || []).filter(r => r.patient_id !== id);
    this.localDB.rehab = (this.localDB.rehab || []).filter(r => r.patient_id !== id);
    this.localDB.neuropsych = (this.localDB.neuropsych || []).filter(n => n.patient_id !== id);
    this.localDB.family_discussions = (this.localDB.family_discussions || []).filter(f => f.patient_id !== id);
    this.saveLocalStore();

    await this.logAuditEvent({
      action: 'DELETE_PATIENT',
      resource: 'patients',
      record_id: id,
      details: `Deleted paediatric oncology patient ${id} (${patient?.first_name || ''} ${patient?.last_name || ''}) and cascading child records`,
      user: requestingUser?.username || 'system',
      role: requestingUser?.role || 'Administrator'
    });

    return true;
  }

  // =========================================================================
  // SUB-COLLECTIONS: SURGERIES, ONCOLOGY, RT, REHAB, NEUROPSYCH, FAMILY
  // =========================================================================
  async getSurgeriesForPatient(patientId) {
    return (this.localDB.surgeries || []).filter(s => s.patient_id === patientId);
  }
  async saveSurgery(surgeryData) {
    if (!surgeryData.id) surgeryData.id = "surg-onc-" + Date.now();
    const idx = (this.localDB.surgeries || []).findIndex(s => s.id === surgeryData.id);
    if (idx >= 0) this.localDB.surgeries[idx] = surgeryData;
    else this.localDB.surgeries.push(surgeryData);
    this.saveLocalStore();
    return surgeryData;
  }
  async deleteSurgery(id) {
    this.localDB.surgeries = (this.localDB.surgeries || []).filter(s => s.id !== id);
    this.saveLocalStore();
    return true;
  }

  async getOncologyForPatient(patientId) {
    return (this.localDB.oncology || []).filter(o => o.patient_id === patientId);
  }
  async saveOncology(oncData) {
    if (!oncData.id) oncData.id = "onc-mdt-" + Date.now();
    const idx = (this.localDB.oncology || []).findIndex(o => o.id === oncData.id);
    if (idx >= 0) this.localDB.oncology[idx] = oncData;
    else this.localDB.oncology.push(oncData);
    this.saveLocalStore();
    return oncData;
  }
  async deleteOncology(id) {
    this.localDB.oncology = (this.localDB.oncology || []).filter(o => o.id !== id);
    this.saveLocalStore();
    return true;
  }

  async getRadiotherapyForPatient(patientId) {
    return (this.localDB.radiotherapy || []).filter(r => r.patient_id === patientId);
  }
  async saveRadiotherapy(rtData) {
    if (!rtData.id) rtData.id = "rt-mdt-" + Date.now();
    const idx = (this.localDB.radiotherapy || []).findIndex(r => r.id === rtData.id);
    if (idx >= 0) this.localDB.radiotherapy[idx] = rtData;
    else this.localDB.radiotherapy.push(rtData);
    this.saveLocalStore();
    return rtData;
  }
  async deleteRadiotherapy(id) {
    this.localDB.radiotherapy = (this.localDB.radiotherapy || []).filter(r => r.id !== id);
    this.saveLocalStore();
    return true;
  }

  async getRehabForPatient(patientId) {
    return (this.localDB.rehab || []).filter(r => r.patient_id === patientId);
  }
  async saveRehab(rehabData) {
    if (!rehabData.id) rehabData.id = "rehab-mdt-" + Date.now();
    const idx = (this.localDB.rehab || []).findIndex(r => r.id === rehabData.id);
    if (idx >= 0) this.localDB.rehab[idx] = rehabData;
    else this.localDB.rehab.push(rehabData);
    this.saveLocalStore();
    return rehabData;
  }
  async deleteRehab(id) {
    this.localDB.rehab = (this.localDB.rehab || []).filter(r => r.id !== id);
    this.saveLocalStore();
    return true;
  }

  async getNeuropsychForPatient(patientId) {
    return (this.localDB.neuropsych || []).filter(n => n.patient_id === patientId);
  }
  async saveNeuropsych(npData) {
    if (!npData.id) npData.id = "np-mdt-" + Date.now();
    const idx = (this.localDB.neuropsych || []).findIndex(n => n.id === npData.id);
    if (idx >= 0) this.localDB.neuropsych[idx] = npData;
    else this.localDB.neuropsych.push(npData);
    this.saveLocalStore();
    return npData;
  }
  async deleteNeuropsych(id) {
    this.localDB.neuropsych = (this.localDB.neuropsych || []).filter(n => n.id !== id);
    this.saveLocalStore();
    return true;
  }

  async getFamilyDiscussionsForPatient(patientId) {
    return (this.localDB.family_discussions || []).filter(f => f.patient_id === patientId);
  }
  async saveFamilyDiscussion(discData) {
    if (!discData.id) discData.id = "fam-disc-" + Date.now();
    const idx = (this.localDB.family_discussions || []).findIndex(f => f.id === discData.id);
    if (idx >= 0) this.localDB.family_discussions[idx] = discData;
    else this.localDB.family_discussions.push(discData);
    this.saveLocalStore();
    return discData;
  }
  async deleteFamilyDiscussion(id) {
    this.localDB.family_discussions = (this.localDB.family_discussions || []).filter(f => f.id !== id);
    this.saveLocalStore();
    return true;
  }

  async exportFullDatabase() {
    return {
      metadata: {
        app: "Multidisciplinary Paediatric Neurosurgical Oncology Database",
        author: "Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)",
        dedication: "Dedicated to Mrs Nirmaladevy Ganesalingam BSc",
        exported_at: new Date().toISOString(),
        version: "1.0.0"
      },
      patients: this.localDB.patients || [],
      surgeries: this.localDB.surgeries || [],
      oncology: this.localDB.oncology || [],
      radiotherapy: this.localDB.radiotherapy || [],
      rehab: this.localDB.rehab || [],
      neuropsych: this.localDB.neuropsych || [],
      family_discussions: this.localDB.family_discussions || []
    };
  }

  // =========================================================================
  // RBAC & SECURITY
  // =========================================================================
  initDefaultUsers() {
    if (!this.localDB) return;
    this.localDB.users = [
      {
        id: 'usr-dev-001',
        username: 'developer',
        full_name: 'Lead Oncology Database Developer',
        role: 'Developer',
        salt: 'salt_dev_2026',
        password_hash: 'd98630267c71417d5f2165888bb6b3d0864725ad27a861a897113030f24d6652', // dev2026!
        created_at: '2026-01-01T00:00:00.000Z',
        last_login: null
      },
      {
        id: 'usr-admin-001',
        username: 'admin',
        full_name: 'Paediatric Oncology MDT Administrator',
        role: 'Administrator',
        salt: 'salt_admin_2026',
        password_hash: 'cf53f176e7a93d535cd86f3695e5522da0505419de0633467b181e2ebe18970d', // admin2026!
        created_at: '2026-01-01T00:00:00.000Z',
        last_login: null
      },
      {
        id: 'usr-clin-001',
        username: 'clinician',
        full_name: 'Paediatric Neurosurgeon / Oncologist',
        role: 'User',
        salt: 'salt_user_2026',
        password_hash: '048573dada841825d713c7ad9be5bd9d27cdc29086e934d7f243e82a09615d27', // user2026!
        created_at: '2026-01-01T00:00:00.000Z',
        last_login: null
      }
    ];
  }

  initDefaultAuditLogs() {
    if (!this.localDB) return;
    this.localDB.audit_logs = [
      {
        id: 'log-onc-genesis-001',
        timestamp: '2026-01-01T00:00:00.000Z',
        user_id: 'SYSTEM',
        user_name: 'System Root Authority',
        role: 'System',
        action: 'DATABASE_OPEN',
        resource: 'system',
        record_id: 'GENESIS',
        details_preview: 'Multidisciplinary Paediatric Neurosurgical Oncology Database initialized with cryptographic audit ledger.',
        encrypted_payload: 'SEALED_v1:eyJhY3Rpb24iOiJEQVRBQkFTRV9PUEVOIiwicmVzb3VyY2UiOiJzeXN0ZW0iLCJkZXRhaWxzIjoiR2VuZXNpcyBQYWVkaWF0cmljIE9uY29sb2d5IERhdGFiYXNlIGluaXRpYWxpemVkIn0=:GENESIS_SIG',
        prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
        entry_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      }
    ];
  }

  initDefaultDbSchema() {
    if (!this.localDB) return;
    this.localDB.db_design_schema = {
      version: '1.0.0',
      last_modified: '2026-01-01T00:00:00.000Z',
      modified_by: 'developer',
      tables: [
        {
          name: 'patients',
          description: 'Core paediatric neurosurgical oncology patient registry',
          columns: [
            { name: 'id', type: 'TEXT', pk: true },
            { name: 'study_id', type: 'TEXT', unique: true },
            { name: 'who_diagnosis_2021', type: 'TEXT' },
            { name: 'who_grade', type: 'INTEGER' },
            { name: 'extent_of_resection_achieved', type: 'TEXT' }
          ]
        },
        {
          name: 'surgeries',
          description: 'Primary resection, Redo surgery, Surgery for recurrence, Surgery for metastasis',
          columns: [
            { name: 'id', type: 'TEXT', pk: true },
            { name: 'surgery_type', type: 'TEXT' },
            { name: 'operation_date', type: 'DATE' },
            { name: 'intraop_neuromonitoring', type: 'INTEGER' }
          ]
        },
        {
          name: 'family_discussions',
          description: 'Multi-timepoint structured communication register with parents and family',
          columns: [
            { name: 'id', type: 'TEXT', pk: true },
            { name: 'discussion_date', type: 'DATE' },
            { name: 'encounter_milestone', type: 'TEXT' },
            { name: 'key_topics_discussed', type: 'TEXT' }
          ]
        }
      ]
    };
  }

  async sha256(message) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < message.length; i++) {
      ch = message.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    return (Math.abs(h1).toString(16) + Math.abs(h2).toString(16)).padStart(64, '0');
  }

  async hashPassword(password, salt) {
    return await this.sha256(password + ":" + salt + ":paediatric_oncology_auth_token_2026");
  }

  async logAuditEvent({ action, resource = 'system', record_id = null, details = '', user = null, role = null }) {
    if (!this.localDB) return;
    if (!this.localDB.audit_logs) this.localDB.audit_logs = [];

    const now = new Date().toISOString();
    const lastEntry = this.localDB.audit_logs[this.localDB.audit_logs.length - 1];
    const prevHash = lastEntry ? (lastEntry.entry_hash || '0000000000000000000000000000000000000000000000000000000000000000') : '0000000000000000000000000000000000000000000000000000000000000000';
    const id = 'log-onc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const contentToHash = `${prevHash}|${id}|${now}|${action}|${resource}|${record_id}|${user}|${details}`;
    const entryHash = await this.sha256(contentToHash);

    const logEntry = {
      id,
      timestamp: now,
      user_id: user || 'UNAUTHENTICATED',
      user_name: user || 'Anonymous Clinician',
      role: role || 'Clinician',
      action,
      resource,
      record_id,
      details_preview: details.slice(0, 140),
      encrypted_payload: `SEALED_v1:${btoa(unescape(encodeURIComponent(JSON.stringify({ action, resource, details, timestamp: now, user, role }))))}`,
      prev_hash: prevHash,
      entry_hash: entryHash
    };

    this.localDB.audit_logs.push(logEntry);
    this.saveLocalStore();
    return logEntry;
  }

  async authenticateUser(username, password) {
    if (!this.localDB || !this.localDB.users) this.initDefaultUsers();
    const user = this.localDB.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) return { success: false, message: "Invalid username or password" };

    const testHash = await this.hashPassword(password, user.salt);
    if (testHash !== user.password_hash) return { success: false, message: "Invalid username or password" };

    user.last_login = new Date().toISOString();
    this.saveLocalStore();

    await this.logAuditEvent({
      action: 'LOGIN_SUCCESS',
      resource: 'users',
      record_id: user.id,
      details: `User ${user.username} logged in with role ${user.role}`,
      user: user.username,
      role: user.role
    });

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        last_login: user.last_login
      }
    };
  }

  async getAllUsers(requestingUser) {
    if (!requestingUser || (requestingUser.role !== 'Administrator' && requestingUser.role !== 'Developer')) {
      throw new Error("Access Denied: Only Administrator or Developer may list users.");
    }
    return (this.localDB.users || []).map(u => ({
      id: u.id, username: u.username, full_name: u.full_name, role: u.role, created_at: u.created_at, last_login: u.last_login
    }));
  }

  async createUser(userData, requestingUser) {
    if (!requestingUser || requestingUser.role !== 'Administrator') {
      throw new Error("Access Denied: Only Administrator may assign accounts.");
    }
    const cleanUser = userData.username.trim().toLowerCase();
    if (this.localDB.users.find(u => u.username.toLowerCase() === cleanUser)) {
      throw new Error(`Username '${cleanUser}' already exists.`);
    }

    const salt = 'salt_' + Math.random().toString(36).substring(2, 10);
    const passwordHash = await this.hashPassword(userData.password, salt);

    const newUser = {
      id: 'usr-onc-' + Date.now(),
      username: cleanUser,
      full_name: userData.full_name || cleanUser,
      role: userData.role || 'User',
      salt: salt,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      last_login: null
    };

    this.localDB.users.push(newUser);
    this.saveLocalStore();
    return { id: newUser.id, username: newUser.username, full_name: newUser.full_name, role: newUser.role };
  }

  async deleteUser(userId, requestingUser) {
    if (!requestingUser || requestingUser.role !== 'Administrator') {
      throw new Error("Access Denied: Only Administrator may delete users.");
    }
    const target = this.localDB.users.find(u => u.id === userId);
    if (!target) throw new Error("User not found.");
    if (target.username === 'admin' || target.username === 'developer') {
      throw new Error("Cannot delete primary system Administrator or Developer account.");
    }
    this.localDB.users = this.localDB.users.filter(u => u.id !== userId);
    this.saveLocalStore();
    return true;
  }

  async changePassword(username, oldPassword, newPassword) {
    const user = this.localDB.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) throw new Error("User not found.");
    const testHash = await this.hashPassword(oldPassword, user.salt);
    if (testHash !== user.password_hash) throw new Error("Current password is incorrect.");
    user.password_hash = await this.hashPassword(newPassword, user.salt);
    this.saveLocalStore();
    return true;
  }

  async getAuditLogs(requestingUser) {
    if (!requestingUser || (requestingUser.role !== 'Administrator' && requestingUser.role !== 'Developer')) {
      throw new Error("Access Denied: Only Administrator or Developer may inspect audit logs.");
    }
    return this.localDB.audit_logs || [];
  }

  async getDbDesignSchema(requestingUser) {
    if (!requestingUser || (requestingUser.role !== 'Developer' && requestingUser.role !== 'Administrator')) {
      throw new Error("Access Denied: Insufficient privilege.");
    }
    return this.localDB.db_design_schema;
  }

  async updateDbDesignSchema(newSchema, requestingUser) {
    if (!requestingUser || requestingUser.role !== 'Developer') {
      throw new Error("Access Denied: Only Developer can modify database schema design.");
    }
    this.localDB.db_design_schema = {
      ...newSchema,
      last_modified: new Date().toISOString(),
      modified_by: requestingUser.username
    };
    this.saveLocalStore();
    return this.localDB.db_design_schema;
  }

  // =========================================================================
  // ONCOLOGY CLINICAL & DISCHARGE LETTERS GENERATOR
  // =========================================================================
  generateDischargeLetter(patient) {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const surgeries = (this.localDB.surgeries || []).filter(s => s.patient_id === patient.id);
    const latestSurg = surgeries.length ? surgeries[surgeries.length - 1] : null;

    return `
================================================================================
          ROYAL MANCHESTER PAEDIATRIC NEUROSURGERY & ONCOLOGY
                        INPATIENT DISCHARGE SUMMARY
================================================================================
Date of Discharge: ${today}
Consultant Neurosurgeon: ${patient.consultant_surgeon || 'Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)'}
Consultant Neuro-Oncologist: ${patient.consultant_neurooncologist || 'Dr Victoria Shaw'}
Consultant Radiotherapist: ${patient.consultant_radiotherapist || 'Dr Marcus Cole'}
Clinical Nurse Specialist: ${patient.clinical_nurse_specialist || 'Sister Rachel Adams'}

PATIENT IDENTIFICATION & CANCER STAGING:
--------------------------------------------------------------------------------
Child's Name:          ${patient.first_name || ''} ${patient.last_name || ''}
Hospital / NHS No:      ${patient.hospital_number || 'N/A'}
Study Reference ID:    ${patient.study_id || 'N/A'}
DOB & Current Age:     ${patient.dob || 'N/A'} (${patient.age_at_presentation || 'N/A'} ${patient.age_unit || 'Years'}, ${patient.gender || ''})
Genetic Predisposition: ${patient.predisposition_syndrome || 'None / Sporadic'}
Baseline Performance:  Lansky / Karnofsky: ${patient.baseline_lansky_kps || 'N/A'}%

PATHOLOGICAL DIAGNOSIS & MOLECULAR PROFILE:
--------------------------------------------------------------------------------
Integrated Diagnosis:  ${patient.who_diagnosis_2021 || 'Paediatric CNS Tumour'} (WHO Grade ${patient.who_grade || 'N/A'})
Histological Subtype:  ${patient.histological_subtype || 'Documented'}
Proliferation Index:   Ki-67 / MIB-1: ${patient.ki67_labeling_index_pct ? patient.ki67_labeling_index_pct + '%' : 'N/A'}
BRAF Status:           ${patient.braf_status || 'Tested'}
Histone H3 Mutation:   ${patient.histone_h3_status || 'Tested'}
Molecular Subgroup:    ${patient.medulloblastoma_subgroup !== 'Not Applicable' ? patient.medulloblastoma_subgroup : (patient.ependymoma_subgroup !== 'Not Applicable' ? patient.ependymoma_subgroup : 'N/A')}
SMARCB1 (INI1) Status: ${patient.smarcb1_ini1_status || 'Retained'}
Molecular Summary:     ${patient.molecular_summary || 'Genomic and methylation profiling completed.'}

SURGICAL INTERVENTIONS PERFORMED:
--------------------------------------------------------------------------------
Latest Procedure:      ${latestSurg?.surgery_type || 'Craniotomy and tumour resection'}
Date of Operation:     ${latestSurg?.operation_date || 'During admission'}
Surgical Approach:     ${latestSurg?.surgical_approach || 'Standard neurosurgical exposure'}
Neuromonitoring (IONM): ${latestSurg?.intraop_neuromonitoring ? 'Yes (' + (latestSurg.ionm_modalities || 'MEPs/SSEPs/Cranial Nerves') + ')' : 'No'}
Image Guidance:        ${latestSurg?.image_guidance || 'Neuronavigation'} (Fluorescence: ${latestSurg?.fluorescence_guidance || 'None'})
Estimated Blood Loss:  ${latestSurg?.blood_loss_ml ? latestSurg.blood_loss_ml + ' ml' : 'Minimal'}

TUMOUR OUTCOME & EXTENT OF RESECTION:
--------------------------------------------------------------------------------
Extent of Resection:   ${patient.extent_of_resection_achieved || 'Confirmed on 24-48h post-op MRI'}
Residual Disease:      ${patient.residual_tumour_present ? 'Yes - Residual Volume ' + (patient.residual_volume_cm3 || 'N/A') + ' cm³ (' + (patient.residual_location_description || '') + ')' : 'No - Macroscopically Complete (GTR 100%)'}
Metastatic Staging:    Chang Stage: ${patient.metastatic_stage_chang || 'M0 (No metastases)'}
Functional Level:      PCPC: ${patient.pcpc_functional_grade || 'Grade 1'} | Ambulation: ${patient.ambulatory_status || 'Independently ambulant'}
Post-op Complications: CMS: ${patient.posterior_fossa_syndrome_cms ? 'Yes' : 'No'} | CN Deficits: ${patient.cranial_nerve_deficit_postop ? 'Yes' : 'No'} | CSF Leak/Shunt: ${patient.postop_hydrocephalus_shunt_required ? 'Yes' : 'No'}

MULTIDISCIPLINARY ONCOLOGY & FOLLOW-UP PLAN:
--------------------------------------------------------------------------------
1. Full case presentation at Paediatric Neuro-Oncology Multidisciplinary Team (MDT) meeting.
2. Adjuvant radiotherapy planning (Proton Beam Therapy referral / focal boost).
3. Systemic chemotherapy protocol to commence as per neuro-oncology scheduling.
4. Community neurorehabilitation: Physiotherapy, Occupational Therapy, and SLT support.
5. Family support: 24/7 oncology triage contact provided; MacMillan & Young Lives vs Cancer key worker active.

Dictated by: Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)
Consultant Paediatric Neurosurgeon
================================================================================
`.trim();
  }

  generateClinicLetter(patient, latestSurgery = null, latestDisc = null) {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
================================================================================
          ROYAL MANCHESTER PAEDIATRIC NEUROSURGERY & ONCOLOGY
                     OUTPATIENT ONCOLOGY REVIEW LETTER
================================================================================
Date of Review: ${today}
To: General Practitioner & Local Paediatrician
Consultant Neurosurgeon: ${patient.consultant_surgeon || 'Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)'}
Named Neuro-Oncologist: ${patient.consultant_neurooncologist || 'Dr Victoria Shaw'}

PATIENT CLINICAL SUMMARY:
--------------------------------------------------------------------------------
Child's Name:          ${patient.first_name || ''} ${patient.last_name || ''}
Hospital / NHS No:      ${patient.hospital_number || 'N/A'}
Study Identifier:      ${patient.study_id || 'N/A'}
DOB & Current Age:     ${patient.dob || 'N/A'} (${patient.age_at_presentation || 'N/A'} ${patient.age_unit || 'Years'})
Diagnosis & Grade:     ${patient.who_diagnosis_2021 || 'Paediatric Tumour'} (WHO Grade ${patient.who_grade || 'N/A'})
Molecular Profile:     ${patient.braf_status || 'BRAF wt'} | ${patient.histone_h3_status || 'H3 wt'} | ${patient.medulloblastoma_subgroup || patient.ependymoma_subgroup || 'Standard subgroup'}
Extent of Resection:   ${patient.extent_of_resection_achieved || 'Resection completed'}

CLINICAL & FUNCTIONAL ASSESSMENT TODAY:
--------------------------------------------------------------------------------
Performance Scale:     Lansky / Karnofsky: ${patient.current_performance_score || patient.baseline_lansky_kps || '80'}%
Functional Status:     PCPC: ${patient.pcpc_functional_grade || 'Grade 1: Normal'}
Neurological Exam:     Wound well-healed, non-tender. Cranial nerves intact. No papilledema. Gait: ${patient.ambulatory_status || 'Independently ambulant'}.
Disease Status:        ${patient.overall_disease_status || 'Complete Remission / Stable'}

SUMMARY OF MULTIDISCIPLINARY CARE & FAMILY CONSULTATION:
--------------------------------------------------------------------------------
Latest Family Discussion: ${latestDisc ? latestDisc.encounter_milestone + ' (' + latestDisc.discussion_date + ')' : 'Routine clinic review'}
Key Topics Discussed:  ${latestDisc?.key_topics_discussed || 'Review of clinical recovery, surveillance imaging schedule, and school reintegration.'}
Family Values / Goals: ${latestDisc?.family_preferences_and_goals || 'Prioritizing return to school and peer activities.'}
MDT Management Plan:   ${latestDisc?.agreed_management_plan || 'Continue surveillance protocol.'}

IMPRESSION & PLAN:
--------------------------------------------------------------------------------
1. Surveillance 3T volumetric MRI brain and spine in 3 months.
2. Continued neurorehabilitation with community physiotherapy and occupational therapy.
3. Educational healthcare plan (EHCP) review with school SENCO.
4. Next outpatient neurosurgical oncology review in 3 months.

Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)
Consultant Paediatric Neurosurgeon
================================================================================
`.trim();
  }

  // =========================================================================
  // STATA (.dta) & MULTI-SHEET EXCEL EXPORTERS
  // =========================================================================
  async generateStataDtaExport() {
    const patients = await this.getAllPatients();
    const surgeries = this.localDB.surgeries || [];
    const familyDiscs = this.localDB.family_discussions || [];

    const variables = [
      { name: "id", type: 24, label: "Record Identifier", fmt: "%24s" },
      { name: "study_id", type: 16, label: "Study Reference ID", fmt: "%16s" },
      { name: "hosp_num", type: 16, label: "Hospital / NHS Number", fmt: "%16s" },
      { name: "age_pres", type: 254, label: "Age at Presentation", fmt: "%9.2f" },
      { name: "gender", type: 8, label: "Gender", fmt: "%8s" },
      { name: "predisp_syn", type: 36, label: "Genetic Predisposition Syndrome", fmt: "%36s" },
      { name: "anat_site", type: 36, label: "Tumour Anatomical Category", fmt: "%36s" },
      { name: "who_diag", type: 36, label: "WHO 2021 CNS Diagnosis", fmt: "%36s" },
      { name: "who_grade", type: 251, label: "WHO Histological Grade (1-4)", fmt: "%9.0f" },
      { name: "ki67_pct", type: 254, label: "Ki-67 / MIB-1 Proliferation Index %", fmt: "%9.1f" },
      { name: "braf_stat", type: 24, label: "BRAF Alteration Status", fmt: "%24s" },
      { name: "h3_stat", type: 24, label: "Histone H3 Mutation Status", fmt: "%24s" },
      { name: "medullo_grp", type: 28, label: "Medulloblastoma Molecular Subgroup", fmt: "%28s" },
      { name: "epend_grp", type: 28, label: "Ependymoma Molecular Subgroup", fmt: "%28s" },
      { name: "smarcb1", type: 24, label: "SMARCB1 / INI1 Expression Status", fmt: "%24s" },
      
      // Surgical Outcomes
      { name: "eor_achiev", type: 36, label: "Extent of Resection (GTR/NTR/STR)", fmt: "%36s" },
      { name: "resid_vol", type: 254, label: "Residual Volume (cm3)", fmt: "%9.2f" },
      { name: "chang_m", type: 24, label: "Chang Metastatic Stage (M0-M4)", fmt: "%24s" },
      { name: "lansky_kps", type: 252, label: "Functional Score (Lansky/KPS %)", fmt: "%9.0f" },
      { name: "pcpc_grade", type: 24, label: "PCPC Functional Grade (1-5)", fmt: "%24s" },
      { name: "ambulatory", type: 32, label: "Ambulatory Status", fmt: "%32s" },
      
      // Complications
      { name: "cms_present", type: 251, label: "Cerebellar Mutism Syndrome (1=yes)", fmt: "%9.0f" },
      { name: "cn_deficit", type: 251, label: "Cranial Nerve Deficit (1=yes)", fmt: "%9.0f" },
      { name: "endo_deficit", type: 251, label: "Endocrine Failure (1=yes)", fmt: "%9.0f" },
      { name: "csf_leak", type: 251, label: "CSF Leak / Shunt Required (1=yes)", fmt: "%9.0f" },
      { name: "dis_status", type: 36, label: "Overall Disease Status (NED/Prog)", fmt: "%36s" },
      
      // Counts
      { name: "surg_count", type: 252, label: "Total Surgical Operations Count", fmt: "%9.0f" },
      { name: "disc_count", type: 252, label: "Family Consultations Count", fmt: "%9.0f" }
    ];

    const rows = patients.map(p => {
      const pSurgs = surgeries.filter(s => s.patient_id === p.id);
      const pDiscs = familyDiscs.filter(f => f.patient_id === p.id);

      return {
        id: p.id || '',
        study_id: p.study_id || '',
        hosp_num: p.hospital_number || '',
        age_pres: p.age_at_presentation !== undefined ? parseFloat(p.age_at_presentation) : null,
        gender: p.gender || 'Unknown',
        predisp_syn: p.predisposition_syndrome || 'None',
        anat_site: p.anatomical_category || '',
        who_diag: p.who_diagnosis_2021 || '',
        who_grade: p.who_grade ? parseInt(p.who_grade, 10) : null,
        ki67_pct: p.ki67_labeling_index_pct ? parseFloat(p.ki67_labeling_index_pct) : null,
        braf_stat: p.braf_status || 'Wildtype',
        h3_stat: p.histone_h3_status || 'Wildtype',
        medullo_grp: p.medulloblastoma_subgroup || 'N/A',
        epend_grp: p.ependymoma_subgroup || 'N/A',
        smarcb1: p.smarcb1_ini1_status || 'Retained',

        eor_achiev: p.extent_of_resection_achieved ? p.extent_of_resection_achieved.split('(')[0].trim() : '',
        resid_vol: p.residual_volume_cm3 ? parseFloat(p.residual_volume_cm3) : null,
        chang_m: p.metastatic_stage_chang ? p.metastatic_stage_chang.split(':')[0] : 'M0',
        lansky_kps: p.current_performance_score || p.baseline_lansky_kps ? parseInt(p.current_performance_score || p.baseline_lansky_kps, 10) : null,
        pcpc_grade: p.pcpc_functional_grade ? p.pcpc_functional_grade.split(':')[0] : 'Grade 1',
        ambulatory: p.ambulatory_status || '',

        cms_present: p.posterior_fossa_syndrome_cms ? 1 : 0,
        cn_deficit: p.cranial_nerve_deficit_postop ? 1 : 0,
        endo_deficit: p.endocrine_failure_postop ? 1 : 0,
        csf_leak: p.postop_hydrocephalus_shunt_required ? 1 : 0,
        dis_status: p.overall_disease_status || 'NED',

        surg_count: pSurgs.length,
        disc_count: pDiscs.length
      };
    });

    return buildStata114Binary(variables, rows, 'Paediatric Neuro-Oncology');
  }

  async generateExcelBackup() {
    const patients = await this.getAllPatients();
    const surgeries = this.localDB.surgeries || [];
    const familyDiscs = this.localDB.family_discussions || [];
    const oncology = this.localDB.oncology || [];
    const radiotherapy = this.localDB.radiotherapy || [];

    function escapeXml(unsafe) {
      if (unsafe === null || unsafe === undefined) return '';
      return String(unsafe).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    function createWorksheetXml(name, headers, rows) {
      let xml = `<Worksheet ss:Name="${escapeXml(name)}"><Table ss:DefaultRowHeight="20"><Row ss:StyleID="Header">`;
      for (const h of headers) xml += `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
      xml += `</Row>`;
      for (const row of rows) {
        xml += `<Row ss:StyleID="Default">`;
        for (const cell of row) {
          const isNum = typeof cell === 'number' && !isNaN(cell);
          xml += `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(cell)}</Data></Cell>`;
        }
        xml += `</Row>`;
      }
      xml += `</Table></Worksheet>`;
      return xml;
    }

    const patientHeaders = [
      "ID", "Study ID", "Hospital No", "First Name", "Last Name", "DOB", "Age", "Gender",
      "Syndrome", "Anatomical Site", "WHO Diagnosis 2021", "Grade", "Ki-67 %", "BRAF", "H3",
      "EOR Achieved", "Residual Vol (cm3)", "Chang Stage", "Lansky/KPS %", "PCPC Grade", "Disease Status"
    ];
    const patientRows = patients.map(p => [
      p.id, p.study_id, p.hospital_number, p.first_name, p.last_name, p.dob, p.age_at_presentation, p.gender,
      p.predisposition_syndrome, p.anatomical_category, p.who_diagnosis_2021, p.who_grade, p.ki67_labeling_index_pct,
      p.braf_status, p.histone_h3_status, p.extent_of_resection_achieved, p.residual_volume_cm3,
      p.metastatic_stage_chang, p.current_performance_score || p.baseline_lansky_kps, p.pcpc_functional_grade, p.overall_disease_status
    ]);

    const surgHeaders = ["Patient ID", "Procedure Type", "Date", "Surgeon", "Approach", "IONM", "Fluorescence", "Blood Loss (ml)", "Notes"];
    const surgRows = surgeries.map(s => [
      s.patient_id, s.surgery_type, s.operation_date, s.lead_surgeon, s.surgical_approach, s.intraop_neuromonitoring ? 'Yes' : 'No',
      s.fluorescence_guidance, s.blood_loss_ml, s.operative_notes
    ]);

    const discHeaders = ["Patient ID", "Discussion Date", "Milestone", "Clinician Lead", "CNS Present", "Family Members", "Topics Discussed", "Family Goals", "Agreed Plan"];
    const discRows = familyDiscs.map(f => [
      f.patient_id, f.discussion_date, f.encounter_milestone, f.clinician_lead, f.cns_present, f.family_members_present,
      f.key_topics_discussed, f.family_preferences_and_goals, f.agreed_management_plan
    ]);

    let fullXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1B365D" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Default"><Alignment ss:Vertical="Center"/></Style>
 </Styles>`;
    fullXml += createWorksheetXml("Patients Master Registry", patientHeaders, patientRows);
    fullXml += createWorksheetXml("Surgical Operations Register", surgHeaders, surgRows);
    fullXml += createWorksheetXml("Family Discussions Register", discHeaders, discRows);
    fullXml += `</Workbook>`;

    return fullXml;
  }
}

  return new DatabaseAdapterImpl();
}));
