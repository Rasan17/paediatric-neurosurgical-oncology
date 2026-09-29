#!/usr/bin/env python3
"""
MULTIDISCIPLINARY PAEDIATRIC NEUROSURGICAL ONCOLOGY DATABASE - Stata (.dta) Exporter
Conceived, designed and tested: Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)
Copyright 2026, Dr G Narenthiran, g_narenthiran@hotmail.com, all rights reserved.
Dedicated to Mrs Nirmaladevy Ganesalingam BSc

This script reads an exported JSON registry backup or SQLite database and exports
native Stata (.dta format 114 / 118) datasets for biostatistical modeling,
survival analysis (Kaplan-Meier, Cox proportional hazards), and prognostic assessment.
"""

import sys
import os
import re
import json
import argparse
from datetime import datetime

try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


def safe_float(val):
    if val is None or val == "":
        return None
    try:
        m = re.search(r"[-+]?(?:\d*\.\d+|\d+)", str(val))
        return float(m.group(0)) if m else None
    except Exception:
        return None


def safe_int(val):
    if val is None or val == "":
        return None
    try:
        m = re.search(r"[-+]?\d+", str(val))
        return int(m.group(0)) if m else None
    except Exception:
        return None


def map_who_grade(grade_str):
    if not grade_str:
        return None
    if "Grade 1" in grade_str: return 1
    if "Grade 2" in grade_str: return 2
    if "Grade 3" in grade_str: return 3
    if "Grade 4" in grade_str: return 4
    return None


def map_eor(eor_str):
    if not eor_str:
        return None
    if "Gross Total" in eor_str or "GTR" in eor_str: return 1
    if "Near Total" in eor_str or "NTR" in eor_str: return 2
    if "Subtotal" in eor_str or "STR" in eor_str: return 3
    if "Partial" in eor_str or "PR" in eor_str: return 4
    if "Biopsy" in eor_str: return 5
    return None


def map_disease_status(status_str):
    if not status_str:
        return None
    if "Complete Remission" in status_str: return 1
    if "Stable" in status_str: return 2
    if "Partial Response" in status_str: return 3
    if "Progressive" in status_str: return 4
    return None


def convert_patient_records(patients_data):
    rows = []
    for p in patients_data:
        pres = p.get("presentation", {}) or {}
        path = p.get("pathology", {}) or {}
        out = p.get("outcomes", {}) or {}

        # Age in years
        age = safe_float(p.get("age_at_presentation"))

        row = {
            "study_id": str(p.get("study_id", "")),
            "age_pres": age,
            "gender": 1 if p.get("gender") == "Male" else 2 if p.get("gender") == "Female" else 3,
            "baseline_perf": safe_int(p.get("baseline_lansky_kps")),
            "predisposition": 0 if "None" in str(p.get("predisposition_syndrome", "")) else 1,
            "site_category": 1 if "Posterior Fossa" in str(pres.get("anatomical_category", "")) else
                             2 if "Supratentorial" in str(pres.get("anatomical_category", "")) else
                             3 if "Spinal" in str(pres.get("anatomical_category", "")) else
                             4 if "Peripheral" in str(pres.get("anatomical_category", "")) else 5,
            "symp_duration_wks": safe_float(pres.get("symptom_duration_weeks")),
            "raised_icp": 1 if pres.get("headache_raised_icp") == "Yes" or pres.get("vomiting_morning") == "Yes" else 0,
            "ataxia": 1 if pres.get("cerebellar_ataxia_dysmetria") == "Yes" else 0,
            "cn_palsy": 0 if str(pres.get("cranial_nerve_palsy", "")) == "None" else 1,
            "spinal_weakness": 0 if str(pres.get("spinal_motor_weakness", "")) == "None" else 1,
            "who_grade": map_who_grade(path.get("who_grade")),
            "ki67_pct": safe_float(path.get("ki67_labeling_index_pct")),
            "braf_mutant": 1 if "V600E" in str(path.get("braf_status", "")) else 2 if "Fusion" in str(path.get("braf_status", "")) else 0,
            "h3_mutant": 1 if "K27M" in str(path.get("histone_h3_status", "")) or "G34" in str(path.get("histone_h3_status", "")) else 0,
            "smarcb1_deficient": 1 if "Deficient" in str(path.get("smarcb1_ini1_status", "")) else 0,
            "eor": map_eor(out.get("extent_of_resection_achieved")),
            "residual_vol_cm3": safe_float(out.get("residual_volume_cm3")),
            "chang_stage": 0 if "M0" in str(out.get("metastatic_stage_chang", "")) else
                           1 if "M1" in str(out.get("metastatic_stage_chang", "")) else
                           2 if "M2" in str(out.get("metastatic_stage_chang", "")) else
                           3 if "M3" in str(out.get("metastatic_stage_chang", "")) else 4,
            "current_perf": safe_int(out.get("current_performance_score")),
            "cms_pfs": 0 if str(out.get("posterior_fossa_syndrome_cms", "")) == "None" else 1,
            "postop_shunt": 0 if "No" in str(out.get("postop_hydrocephalus_shunt_required", "")) else 1,
            "endocrine_fail": 0 if "Normal" in str(out.get("endocrine_failure_postop", "")) else 1,
            "disease_status": map_disease_status(out.get("overall_disease_status"))
        }
        rows.append(row)
    return rows


def export_to_stata(json_path, output_dta_path):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    patients = data.get("patients", [])
    if isinstance(data, list):
        patients = data

    rows = convert_patient_records(patients)

    if not HAS_PANDAS:
        print("Error: pandas is required for advanced Stata export with variable labels.")
        sys.exit(1)

    df = pd.DataFrame(rows)

    # Variable labels for Stata
    variable_labels = {
        "study_id": "Patient Study Identifier",
        "age_pres": "Age at initial tumour presentation (years)",
        "gender": "Patient Gender (1=Male, 2=Female, 3=Other)",
        "baseline_perf": "Baseline Lansky/KPS Performance Score (0-100)",
        "predisposition": "Cancer Predisposition Syndrome (0=No, 1=Yes)",
        "site_category": "Anatomical Site Category (1=PostFossa, 2=Supratentorial, 3=Spinal, 4=Nerve, 5=Other)",
        "symp_duration_wks": "Symptom duration prior to diagnosis (weeks)",
        "raised_icp": "Signs/symptoms of raised ICP (0=No, 1=Yes)",
        "ataxia": "Cerebellar ataxia / dysmetria (0=No, 1=Yes)",
        "cn_palsy": "Cranial nerve deficit at presentation (0=No, 1=Yes)",
        "spinal_weakness": "Spinal motor weakness at presentation (0=No, 1=Yes)",
        "who_grade": "WHO CNS 2021 Histological Grade (1-4)",
        "ki67_pct": "Ki-67 / MIB-1 Proliferation Index (%)",
        "braf_mutant": "BRAF Status (0=WT, 1=V600E, 2=Fusion)",
        "h3_mutant": "Histone H3 Mutation (0=WT, 1=Mutant K27/G34)",
        "smarcb1_deficient": "SMARCB1/INI1 Protein Loss (0=Intact, 1=Deficient)",
        "eor": "Extent of Resection (1=GTR, 2=NTR, 3=STR, 4=PR, 5=Biopsy)",
        "residual_vol_cm3": "Postoperative Residual Tumour Volume (cm3)",
        "chang_stage": "Chang Metastatic Stage (0=M0, 1=M1, 2=M2, 3=M3, 4=M4)",
        "current_perf": "Latest Functional Performance Score (0-100)",
        "cms_pfs": "Cerebellar Mutism / Posterior Fossa Syndrome (0=No, 1=Yes)",
        "postop_shunt": "Postoperative CSF Shunt Required (0=No, 1=Yes)",
        "endocrine_fail": "Post-treatment Endocrine Failure (0=No, 1=Yes)",
        "disease_status": "Overall Oncological Status (1=CR, 2=SD, 3=PR, 4=PD)"
    }

    # Value labels
    val_labels = {
        "gender": {1: "Male", 2: "Female", 3: "Other"},
        "site_category": {1: "Post Fossa", 2: "Supratentorial", 3: "Spinal", 4: "Peripheral Nerve", 5: "Other"},
        "who_grade": {1: "Grade 1", 2: "Grade 2", 3: "Grade 3", 4: "Grade 4"},
        "braf_mutant": {0: "Wild-type", 1: "V600E", 2: "KIAA1549-BRAF Fusion"},
        "eor": {1: "GTR (100%)", 2: "NTR (>90%)", 3: "STR (50-90%)", 4: "PR (<50%)", 5: "Biopsy"},
        "chang_stage": {0: "M0 (No mets)", 1: "M1 (CSF pos)", 2: "M2 (Intracranial)", 3: "M3 (Spine drop)", 4: "M4 (Extraneural)"},
        "disease_status": {1: "Complete Remission", 2: "Stable Disease", 3: "Partial Response", 4: "Progressive Disease"}
    }

    df.to_stata(
        output_dta_path,
        version=117,
        variable_labels=variable_labels,
        value_labels=val_labels,
        write_index=False
    )
    print(f"Successfully exported {len(df)} paediatric oncology patient records to Stata (.dta): {output_dta_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export Paediatric Neurosurgical Oncology database to Stata (.dta)")
    parser.add_argument("input_json", help="Path to input JSON backup")
    parser.add_argument("output_dta", help="Path to output Stata (.dta) file")
    args = parser.parse_args()

    export_to_stata(args.input_json, args.output_dta)
