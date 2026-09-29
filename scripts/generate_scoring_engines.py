import os

engines_content = """/**
 * PAEDIATRIC NEUROSURGICAL ONCOLOGY SCORING & PROGNOSTIC ENGINES
 * Conceived, designed and tested: Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)
 * Dedicated to Mrs Nirmaladevy Ganesalingam BSc
 * Includes:
 * 1. Lansky Play-Performance & Karnofsky Scale Engine
 * 2. Extent of Resection (EOR) & Residual Volume Metric
 * 3. Chang Metastatic Staging Evaluator (M0 - M4)
 * 4. Medulloblastoma & Ependymoma Molecular Risk Stratifier
 * 5. Paediatric Cerebral Performance Category (PCPC) Evaluator
 */

export const ScoringEngines = {
  /**
   * Evaluates Functional Play-Performance Status
   * Lansky (<16 years) or Karnofsky (>=16 years)
   */
  evalPerformanceStatus(score, ageYears = 8) {
    const s = parseInt(score, 10);
    if (isNaN(s)) return null;

    const isLansky = ageYears < 16;
    let description = "";
    let tier = "Good";

    if (isLansky) {
      if (s === 100) { description = "Fully active, normal play and activity"; tier = "Excellent"; }
      else if (s === 90) { description = "Minor restrictions in physically strenuous activity"; tier = "Good"; }
      else if (s === 80) { description = "Active, but tires more easily"; tier = "Good"; }
      else if (s === 70) { description = "Both greater restrictions and less time spent in play"; tier = "Moderate"; }
      else if (s === 60) { description = "Up and around, but active play minimal; keeps busy with quiet activity"; tier = "Moderate"; }
      else if (s === 50) { description = "Gets dressed, but lies around much of the day; no active play"; tier = "Poor"; }
      else if (s === 40) { description = "Mostly in bed; participates in quiet activities if assisted"; tier = "Poor"; }
      else if (s === 30) { description = "In bed; needs assistance even for quiet play"; tier = "Severe"; }
      else if (s === 20) { description = "Often sleeping; play entirely limited to passive activities"; tier = "Severe"; }
      else if (s === 10) { description = "No play; does not get out of bed"; tier = "Critical"; }
      else { description = "Unresponsive / Comatose"; tier = "Critical"; }
    } else {
      if (s >= 80) { description = "Able to carry on normal activity and to work; no special care needed"; tier = "Good"; }
      else if (s >= 50) { description = "Unable to work; able to live at home and care for most personal needs"; tier = "Moderate"; }
      else { description = "Unable to care for self; requires equivalent of institutional or hospital care"; tier = "Severe"; }
    }

    return {
      score: s,
      scaleType: isLansky ? 'Lansky Play-Performance (<16y)' : 'Karnofsky Performance (≥16y)',
      description,
      tier
    };
  },

  /**
   * Evaluates Extent of Resection (EOR) and Residual Status
   */
  evalExtentOfResection(eorCategory, residualVolumeCm3 = 0) {
    const vol = parseFloat(residualVolumeCm3) || 0;
    let classification = "Unknown";
    let isComplete = false;

    if (eorCategory.includes("Gross Total Resection") || eorCategory.includes("GTR")) {
      classification = "Complete Resection (GTR: 100% macroscopic clearance)";
      isComplete = true;
    } else if (eorCategory.includes("Near Total Resection") || eorCategory.includes("NTR")) {
      classification = `Near-Total Resection (>90% removed; residual vol ~${vol.toFixed(1)} cm³)`;
    } else if (eorCategory.includes("Subtotal Resection") || eorCategory.includes("STR")) {
      classification = `Subtotal Resection (50-90% removed; residual vol ~${vol.toFixed(1)} cm³)`;
    } else if (eorCategory.includes("Partial Resection")) {
      classification = "Partial Debulking (<50% removed)";
    } else if (eorCategory.includes("Biopsy")) {
      classification = "Diagnostic Biopsy Only (Tissue specimen acquired)";
    }

    return {
      classification,
      isComplete,
      residualVolumeCm3: vol
    };
  },

  /**
   * Evaluates Modified Chang Metastatic Staging
   */
  evalChangStage(mStage) {
    if (!mStage) return null;
    let riskTier = "Standard Risk";
    let summary = "";

    if (mStage.startsWith("M0")) {
      riskTier = "Non-Metastatic / Localized (M0)";
      summary = "No subarachnoid or hematogenous dissemination on neuraxis MRI or CSF cytology.";
    } else if (mStage.startsWith("M1")) {
      riskTier = "High Risk (M1)";
      summary = "Microscopic malignant cells identified on lumbar CSF cytology; imaging clear.";
    } else if (mStage.startsWith("M2")) {
      riskTier = "High Risk (M2)";
      summary = "Gross nodular tumour seeding in intracranial subarachnoid space or ventricles.";
    } else if (mStage.startsWith("M3")) {
      riskTier = "Very High Risk (M3 - Spinal Drop Metastasis)";
      summary = "Gross nodular tumour seeding in the spinal subarachnoid space (cauda equina / cord).";
    } else if (mStage.startsWith("M4")) {
      riskTier = "Extraneural Metastasis (M4)";
      summary = "Disseminated disease outside the central nervous system (e.g. bone marrow, peritoneum via shunt).";
    }

    return {
      stage: mStage.split(':')[0],
      riskTier,
      summary
    };
  },

  /**
   * Medulloblastoma Molecular Subgroup Prognostic Stratifier
   */
  stratifyMedulloblastomaRisk(subgroup, mycAmplified = false, tp53Mutant = false) {
    if (!subgroup || subgroup === 'Not Applicable') return null;

    let prognosis = "Standard Risk";
    let keyFeatures = "";

    if (subgroup.includes("WNT")) {
      prognosis = "Favourable / Low Risk (>95% 5-year OS)";
      keyFeatures = "Nuclear beta-catenin positive; CTNNB1 mutation; Monosomy 6; rare in infants, common in older children.";
    } else if (subgroup.includes("SHH")) {
      if (tp53Mutant) {
        prognosis = "Very High / Poor Risk (<40% 5-year OS)";
        keyFeatures = "SHH pathway activated with TP53 mutation (often germline Li-Fraumeni); high genomic instability.";
      } else {
        prognosis = "Intermediate Risk (70-80% 5-year OS)";
        keyFeatures = "SHH pathway activated, TP53 wildtype; PTCH1/SUFU/SMO mutations; excellent target for Smoothened inhibitors.";
      }
    } else if (subgroup.includes("Group 3")) {
      if (mycAmplified) {
        prognosis = "High / Very High Risk (<50% 5-year OS)";
        keyFeatures = "Group 3 with MYC amplification; highest metastatic rate at diagnosis; aggressive therapy required.";
      } else {
        prognosis = "Intermediate Risk (55-65% 5-year OS)";
        keyFeatures = "Photoreceptor gene expression; frequent isochromosome 17q.";
      }
    } else if (subgroup.includes("Group 4")) {
      prognosis = "Standard / Intermediate Risk (75-85% 5-year OS)";
      keyFeatures = "Most common subgroup (35-40%); PRDM6 enhancer hijacking / KDM6A mutations; Isochromosome 17q.";
    }

    return {
      subgroup,
      prognosis,
      keyFeatures
    };
  },

  /**
   * Paediatric Cerebral Performance Category (PCPC)
   */
  evalPCPC(grade) {
    if (!grade) return null;
    let label = grade.split(':')[0].trim();
    let isIndependent = label === 'Grade 1' || label === 'Grade 2';
    return {
      grade: label,
      isIndependent
    };
  }
};
"""

with open("js/scoring-engines.js", "w", encoding="utf-8") as f:
    f.write(engines_content)

print("Saved js/scoring-engines.js for Paediatric Oncology!")
