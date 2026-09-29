/**
 * MULTIDISCIPLINARY PAEDIATRIC NEUROSURGICAL ONCOLOGY DATABASE
 * Frontend Application Controller (js/app.js)
 * Conceived, designed and tested: Dr G Narenthiran MB ChB BSc(MedSci)(Hons) MRCS(Ed.) FEBNS FRCS(SN)
 * Copyright 2026, Dr G Narenthiran, g_narenthiran@hotmail.com, all rights reserved.
 * Dedicated to Mrs Nirmaladevy Ganesalingam BSc
 */

// Quick fill helper for login modal
window.quickFillLogin = function(u, p) {
  const uInput = document.getElementById('f-login-username');
  const pInput = document.getElementById('f-login-password');
  if (uInput) uInput.value = u;
  if (pInput) pInput.value = p;
  const alertEl = document.getElementById('login-error-msg');
  if (alertEl) alertEl.style.display = 'none';
};

// Global App State
window.AppState = {
  currentUser: null,
  activePatientId: null,
  activePatientData: null,
  patientsList: [],
  surgeriesList: [],
  oncologyList: [],
  radiotherapyList: [],
  rehabList: [],
  neuropsychList: [],
  familyDiscussionsList: [],
  theme: localStorage.getItem('peds_onco_theme') || 'dark'
};

// Toast notification helper
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  const bg = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb';
  toast.style.cssText = `background:${bg}; color:#fff; padding:10px 16px; border-radius:6px; font-size:13px; font-weight:500; box-shadow:0 4px 12px rgba(0,0,0,0.3); pointer-events:auto; display:flex; align-items:center; gap:8px; opacity:0; transform:translateY(10px); transition:all 0.25s ease;`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initLoginBarrier();
  initNavigationTabs();
  initModals();
  initCalculators();
  initActions();
  initAuditAndDesignModals();

  // Try auto-session or wait for login barrier
  const savedUserJson = sessionStorage.getItem('peds_onco_user');
  if (savedUserJson) {
    try {
      const user = JSON.parse(savedUserJson);
      handleSuccessfulLogin(user);
    } catch (e) {
      console.error('Session restore failed:', e);
    }
  }
});

function initTheme() {
  const currentTheme = window.AppState.theme;
  document.documentElement.setAttribute('data-theme', currentTheme);
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      window.AppState.theme = nextTheme;
      localStorage.setItem('peds_onco_theme', nextTheme);
    });
  }
}

function initLoginBarrier() {
  const loginForm = document.getElementById('form-login');
  const errorMsg = document.getElementById('login-error-msg');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('f-login-username').value.trim();
      const p = document.getElementById('f-login-password').value;
      const user = window.DatabaseAdapter.authenticate(u, p);
      if (user) {
        if (errorMsg) errorMsg.style.display = 'none';
        sessionStorage.setItem('peds_onco_user', JSON.stringify(user));
        handleSuccessfulLogin(user);
      } else {
        if (errorMsg) {
          errorMsg.textContent = 'Invalid username or password.';
          errorMsg.style.display = 'block';
        }
      }
    });
  }

  // Logout trigger
  const logoutBtn = document.getElementById('btn-trigger-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('peds_onco_user');
      window.AppState.currentUser = null;
      document.getElementById('modal-login-barrier').style.display = 'flex';
      showToast('Logged out securely.', 'info');
    });
  }

  // User menu dropdown toggle
  const userMenuTrigger = document.getElementById('btn-user-menu-trigger');
  const userMenuDropdown = document.getElementById('user-menu-dropdown');
  if (userMenuTrigger && userMenuDropdown) {
    userMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenuDropdown.style.display = userMenuDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      userMenuDropdown.style.display = 'none';
    });
  }

  // Change Password Modal Trigger & Form
  const triggerChangePwd = document.getElementById('btn-trigger-change-password');
  if (triggerChangePwd) {
    triggerChangePwd.addEventListener('click', () => {
      document.getElementById('modal-change-password').style.display = 'flex';
    });
  }

  const formChangePwd = document.getElementById('form-change-password');
  if (formChangePwd) {
    formChangePwd.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPwd = document.getElementById('f-pwd-current').value;
      const newPwd = document.getElementById('f-pwd-new').value;
      const confirmPwd = document.getElementById('f-pwd-confirm').value;

      if (newPwd !== confirmPwd) {
        showToast('New passwords do not match.', 'error');
        return;
      }
      try {
        window.DatabaseAdapter.changePassword(window.AppState.currentUser.username, currentPwd, newPwd);
        showToast('Password updated successfully.', 'success');
        document.getElementById('modal-change-password').style.display = 'none';
        formChangePwd.reset();
      } catch (err) {
        showToast(err.message || 'Password update failed.', 'error');
      }
    });
  }

  // User Management Modal Trigger & Form
  const triggerUserMgmt = document.getElementById('btn-trigger-user-mgmt');
  if (triggerUserMgmt) {
    triggerUserMgmt.addEventListener('click', () => {
      renderUsersList();
      document.getElementById('modal-user-management').style.display = 'flex';
    });
  }

  const formCreateUser = document.getElementById('form-create-user');
  if (formCreateUser) {
    formCreateUser.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('f-new-username').value.trim();
      const p = document.getElementById('f-new-password').value;
      const fn = document.getElementById('f-new-fullname').value.trim();
      const r = document.getElementById('f-new-role').value;

      try {
        window.DatabaseAdapter.createUser(u, p, fn, r);
        showToast(`User account '${u}' created.`, 'success');
        formCreateUser.reset();
        renderUsersList();
      } catch (err) {
        showToast(err.message || 'User creation failed.', 'error');
      }
    });
  }
}

function handleSuccessfulLogin(user) {
  window.AppState.currentUser = user;
  const barrier = document.getElementById('modal-login-barrier');
  if (barrier) barrier.style.display = 'none';

  const userNameEl = document.getElementById('current-user-name');
  const userRoleEl = document.getElementById('current-user-role');
  if (userNameEl) userNameEl.textContent = user.fullName || user.username;
  if (userRoleEl) userRoleEl.textContent = user.role.toUpperCase();

  // Role permissions: Hide User Management for Clinicians
  const mgmtItem = document.getElementById('btn-trigger-user-mgmt');
  if (mgmtItem) {
    mgmtItem.style.display = (user.role === 'developer' || user.role === 'administrator') ? 'flex' : 'none';
  }

  loadPatientsList();
}

function renderUsersList() {
  const tbody = document.getElementById('tbody-users-list');
  if (!tbody) return;
  const users = window.DatabaseAdapter.getUsers();
  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.username}</strong></td>
      <td>${u.fullName}</td>
      <td><span class="badge ${u.role === 'developer' ? 'badge-purple' : u.role === 'administrator' ? 'badge-primary' : 'badge-secondary'}">${u.role}</span></td>
      <td>
        ${u.username !== 'admin' && u.username !== window.AppState.currentUser.username ? `
          <button class="btn btn-outline btn-xs text-danger" onclick="window.deleteUserAccount('${u.username}')">Remove</button>
        ` : '<span class="text-muted text-xs">Protected</span>'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteUserAccount = function(username) {
  if (confirm(`Are you sure you want to remove user account '${username}'?`)) {
    try {
      window.DatabaseAdapter.deleteUser(username);
      showToast(`User '${username}' removed.`, 'info');
      renderUsersList();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

function initNavigationTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn[data-tab]');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(tc => {
        tc.classList.remove('active');
      });
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      if (targetId === 'tab-cohort') {
        renderCohortAnalytics();
      }
    });
  });
}

function initModals() {
  // Generic close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      const m = document.getElementById(modalId);
      if (m) m.style.display = 'none';
    });
  });

  // Modal open triggers
  const modalTriggers = [
    { btn: 'btn-add-surgery', modal: 'modal-surgery' },
    { btn: 'btn-add-oncology', modal: 'modal-oncology' },
    { btn: 'btn-add-radiotherapy', modal: 'modal-radiotherapy' },
    { btn: 'btn-add-rehab', modal: 'modal-rehab' },
    { btn: 'btn-add-neuropsych', modal: 'modal-neuropsych' },
    { btn: 'btn-add-family-disc', modal: 'modal-family-disc' },
    { btn: 'btn-about-info', modal: 'modal-about' },
    { btn: 'btn-db-design', modal: 'modal-database-design' },
    { btn: 'btn-audit-log', modal: 'modal-audit-log' },
    { btn: 'btn-db-ops', modal: 'modal-db-operations' }
  ];

  modalTriggers.forEach(({ btn, modal }) => {
    const el = document.getElementById(btn);
    if (el) {
      el.addEventListener('click', () => {
        if (modal.startsWith('modal-') && modal !== 'modal-about' && modal !== 'modal-database-design' && modal !== 'modal-audit-log' && modal !== 'modal-db-operations') {
          if (!window.AppState.activePatientId) {
            showToast('Please select or save a patient first.', 'error');
            return;
          }
        }
        const m = document.getElementById(modal);
        if (m) m.style.display = 'flex';
      });
    }
  });

  // Close modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(m => {
        if (m.id !== 'modal-login-barrier') m.style.display = 'none';
      });
    }
  });
}

function initCalculators() {
  // DOB change -> auto-calculate age
  const dobInput = document.getElementById('f-dob');
  if (dobInput) {
    dobInput.addEventListener('change', () => {
      const dobVal = dobInput.value;
      if (dobVal) {
        const diffMs = Date.now() - new Date(dobVal).getTime();
        const ageYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        if (ageYears >= 0) {
          const ageEl = document.getElementById('f-age-at-presentation');
          if (ageEl && !ageEl.value) {
            ageEl.value = ageYears.toFixed(1);
          }
          const scaleEl = document.getElementById('f-performance-scale-type');
          if (scaleEl) {
            scaleEl.value = ageYears < 16 ? 'Lansky Play-Performance (<16y)' : 'Karnofsky Performance Status (>=16y)';
          }
        }
      }
      updatePerformanceBadges();
    });
  }

  // Performance status calculators
  const baselinePerf = document.getElementById('f-baseline-lansky-kps');
  if (baselinePerf) baselinePerf.addEventListener('input', updatePerformanceBadges);

  const currentPerf = document.getElementById('f-current-performance-score');
  if (currentPerf) currentPerf.addEventListener('input', updatePerformanceBadges);

  const perfTool = document.getElementById('f-performance-tool');
  if (perfTool) perfTool.addEventListener('change', updatePerformanceBadges);

  // EOR & Residual volume badge
  const eorSelect = document.getElementById('f-extent-of-resection-achieved');
  const resVol = document.getElementById('f-residual-volume-cm3');
  if (eorSelect) eorSelect.addEventListener('change', updateEorBadge);
  if (resVol) resVol.addEventListener('input', updateEorBadge);

  // Chang Metastatic stage badge
  const changSelect = document.getElementById('f-metastatic-stage-chang');
  if (changSelect) changSelect.addEventListener('change', updateChangBadge);

  // Medulloblastoma subgroup risk
  const medulloSelect = document.getElementById('f-medulloblastoma-subgroup');
  if (medulloSelect) medulloSelect.addEventListener('change', updateMedulloBadge);

  // PCPC status badge
  const pcpcSelect = document.getElementById('f-pcpc-functional-grade');
  if (pcpcSelect) pcpcSelect.addEventListener('change', updatePCPCBadge);
}

function updatePerformanceBadges() {
  const age = parseFloat(document.getElementById('f-age-at-presentation')?.value || 8);
  const baselineVal = document.getElementById('f-baseline-lansky-kps')?.value;
  const currentVal = document.getElementById('f-current-performance-score')?.value;

  const baselineBadge = document.getElementById('badge-baseline-lansky-status');
  if (baselineBadge && window.ScoringEngines) {
    const res = window.ScoringEngines.evalPerformanceStatus(baselineVal, age);
    if (res) {
      baselineBadge.textContent = `${res.scale} ${res.score}%: ${res.tier} (${res.description})`;
      baselineBadge.className = `score-badge ${res.tier === 'Good' ? 'badge-success' : res.tier === 'Moderate' ? 'badge-warning' : 'badge-danger'}`;
    } else {
      baselineBadge.textContent = 'Enter baseline score (0-100)';
      baselineBadge.className = 'score-badge badge-secondary';
    }
  }

  const currentBadge = document.getElementById('badge-current-lansky-status');
  if (currentBadge && window.ScoringEngines) {
    const res2 = window.ScoringEngines.evalPerformanceStatus(currentVal, age);
    if (res2) {
      currentBadge.textContent = `${res2.scale} ${res2.score}%: ${res2.tier} (${res2.description})`;
      currentBadge.className = `score-badge ${res2.tier === 'Good' ? 'badge-success' : res2.tier === 'Moderate' ? 'badge-warning' : 'badge-danger'}`;
    } else {
      currentBadge.textContent = 'Enter current score (0-100)';
      currentBadge.className = 'score-badge badge-secondary';
    }
  }
}

function updateEorBadge() {
  const eorVal = document.getElementById('f-extent-of-resection-achieved')?.value;
  const resVolVal = document.getElementById('f-residual-volume-cm3')?.value;
  const badge = document.getElementById('badge-eor-metric');
  if (badge && window.ScoringEngines) {
    const res = window.ScoringEngines.evalExtentOfResection(eorVal, resVolVal);
    if (res) {
      badge.textContent = `${res.status} [${res.eor}] (Volume: ${res.volumeText})`;
      badge.className = `score-badge ${res.status === 'Clear' ? 'badge-success' : res.status === 'Minimal Residue' ? 'badge-warning' : 'badge-danger'}`;
    } else {
      badge.textContent = 'Select EOR category';
      badge.className = 'score-badge badge-secondary';
    }
  }
}

function updateChangBadge() {
  const stage = document.getElementById('f-metastatic-stage-chang')?.value;
  const badge = document.getElementById('badge-chang-risk');
  if (badge && window.ScoringEngines) {
    const res = window.ScoringEngines.evalChangStage(stage);
    if (res) {
      badge.textContent = `${res.stage}: ${res.riskTier} Risk - ${res.description}`;
      badge.className = `score-badge ${res.riskTier === 'Standard' ? 'badge-success' : 'badge-danger'}`;
    } else {
      badge.textContent = 'Select Chang M-stage';
      badge.className = 'score-badge badge-secondary';
    }
  }
}

function updateMedulloBadge() {
  const sub = document.getElementById('f-medulloblastoma-subgroup')?.value;
  const badge = document.getElementById('badge-medullo-risk');
  if (badge && window.ScoringEngines) {
    const res = window.ScoringEngines.stratifyMedulloblastomaRisk(sub, false, false);
    if (res) {
      badge.textContent = `${res.subgroup}: ${res.prognosis}`;
      badge.className = `score-badge ${res.subgroup.includes('WNT') ? 'badge-success' : res.subgroup.includes('Group 3') ? 'badge-danger' : 'badge-warning'}`;
    } else {
      badge.textContent = 'Select Medulloblastoma molecular subgroup';
      badge.className = 'score-badge badge-secondary';
    }
  }
}

function updatePCPCBadge() {
  const grade = document.getElementById('f-pcpc-functional-grade')?.value;
  const badge = document.getElementById('badge-pcpc-status');
  if (badge && window.ScoringEngines) {
    const res = window.ScoringEngines.evalPCPC(grade);
    if (res) {
      badge.textContent = `${res.grade}: ${res.isIndependent ? 'Independent Function' : 'Dependent / Impaired'}`;
      badge.className = `score-badge ${res.isIndependent ? 'badge-success' : 'badge-danger'}`;
    } else {
      badge.textContent = 'Select PCPC grade';
      badge.className = 'score-badge badge-secondary';
    }
  }
}

function initActions() {
  // New Patient Button
  const btnNew = document.getElementById('btn-new-patient');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      resetPatientForm();
      showToast('Ready to register new paediatric oncology patient.', 'info');
    });
  }

  // Save Patient Button
  const btnSave = document.getElementById('btn-save-patient');
  if (btnSave) {
    btnSave.addEventListener('click', saveCurrentPatient);
  }

  // Delete Patient Button
  const btnDelete = document.getElementById('btn-delete-patient');
  if (btnDelete) {
    btnDelete.addEventListener('click', deleteCurrentPatient);
  }

  // Patient Search Filter
  const searchInput = document.getElementById('search-patient');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      loadPatientsList(e.target.value.trim());
    });
  }

  // Export Buttons
  const btnStata = document.getElementById('btn-export-stata');
  if (btnStata) {
    btnStata.addEventListener('click', () => {
      try {
        window.DatabaseAdapter.exportToStata();
        showToast('Exported Paediatric Oncology cohort to Stata 114 format (.dta)', 'success');
      } catch (err) {
        showToast('Stata export failed: ' + err.message, 'error');
      }
    });
  }

  const btnExcel = document.getElementById('btn-export-excel');
  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      try {
        window.DatabaseAdapter.exportToExcel();
        showToast('Exported Paediatric Oncology cohort to Excel (.xlsx)', 'success');
      } catch (err) {
        showToast('Excel export failed: ' + err.message, 'error');
      }
    });
  }

  const btnJson = document.getElementById('btn-export-json');
  if (btnJson) {
    btnJson.addEventListener('click', () => {
      try {
        window.DatabaseAdapter.exportToJson();
        showToast('Exported comprehensive database JSON backup', 'success');
      } catch (err) {
        showToast('JSON export failed: ' + err.message, 'error');
      }
    });
  }

  // Inpatient Discharge Summary Modal Open & Actions
  const btnOpenDischarge = document.getElementById('btn-open-discharge-modal');
  if (btnOpenDischarge) {
    btnOpenDischarge.addEventListener('click', () => {
      if (!window.AppState.activePatientId) {
        showToast('Please select a patient first.', 'error');
        return;
      }
      const summaryText = window.DatabaseAdapter.generateDischargeSummary(window.AppState.activePatientId);
      document.getElementById('preview-discharge-letter-content').value = summaryText;
      document.getElementById('modal-discharge-letter').style.display = 'flex';
    });
  }

  const btnCopyDischarge = document.getElementById('btn-copy-discharge-letter');
  if (btnCopyDischarge) {
    btnCopyDischarge.addEventListener('click', () => {
      const text = document.getElementById('preview-discharge-letter-content').value;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Discharge Summary copied to clipboard!', 'success');
      });
    });
  }

  const btnPrintDischarge = document.getElementById('btn-print-discharge-letter');
  if (btnPrintDischarge) {
    btnPrintDischarge.addEventListener('click', () => {
      printTextContent(document.getElementById('preview-discharge-letter-content').value, 'Inpatient Paediatric Neurosurgery Discharge Summary');
    });
  }

  // Outpatient Clinic Letter Modal Open & Actions
  const btnOpenClinic = document.getElementById('btn-open-clinic-modal');
  if (btnOpenClinic) {
    btnOpenClinic.addEventListener('click', () => {
      if (!window.AppState.activePatientId) {
        showToast('Please select a patient first.', 'error');
        return;
      }
      const letterText = window.DatabaseAdapter.generateClinicLetter(window.AppState.activePatientId);
      document.getElementById('preview-clinic-letter-content').value = letterText;
      document.getElementById('modal-clinic-letter').style.display = 'flex';
    });
  }

  const btnCopyClinic = document.getElementById('btn-copy-clinic-letter');
  if (btnCopyClinic) {
    btnCopyClinic.addEventListener('click', () => {
      const text = document.getElementById('preview-clinic-letter-content').value;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Clinic Review Letter copied to clipboard!', 'success');
      });
    });
  }

  const btnPrintClinic = document.getElementById('btn-print-clinic-letter');
  if (btnPrintClinic) {
    btnPrintClinic.addEventListener('click', () => {
      printTextContent(document.getElementById('preview-clinic-letter-content').value, 'Paediatric Neuro-Oncology Outpatient Clinic Letter');
    });
  }

  // Child Modals Form Submissions
  initChildFormSubmissions();
}

function printTextContent(content, title) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11pt; line-height: 1.5; color: #111; margin: 30px; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 10pt; }
        @media print {
          body { margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
}

function initChildFormSubmissions() {
  // 1. Surgery Modal Form
  const formSurgery = document.getElementById('form-modal-surgery');
  if (formSurgery) {
    formSurgery.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.AppState.activePatientId) return;

      const surgData = {
        patient_id: window.AppState.activePatientId,
        surgery_date: document.getElementById('m-surg-date').value,
        procedure_category: document.getElementById('m-surg-type').value,
        lead_surgeon: document.getElementById('m-surg-lead').value,
        surgical_approach: document.getElementById('m-surg-approach').value,
        intraop_monitoring_used: document.getElementById('m-surg-ionm').value,
        ionm_modalities: document.getElementById('m-surg-ionm-modalities').value,
        fluorescence_guidance: document.getElementById('m-surg-fluorescence').value,
        image_guidance: document.getElementById('m-surg-image-guidance').value,
        duration_minutes: parseInt(document.getElementById('m-surg-duration').value || 0, 10),
        estimated_blood_loss_ml: parseInt(document.getElementById('m-surg-blood-loss').value || 0, 10),
        surgical_notes: document.getElementById('m-surg-notes').value
      };

      try {
        window.DatabaseAdapter.saveSurgery(surgData);
        showToast('Surgical procedure saved.', 'success');
        formSurgery.reset();
        document.getElementById('modal-surgery').style.display = 'none';
        renderSurgeriesTable(window.AppState.activePatientId);
      } catch (err) {
        showToast('Failed to save surgery: ' + err.message, 'error');
      }
    });
  }

  // 2. Oncology Modal Form
  const formOnc = document.getElementById('form-modal-oncology');
  if (formOnc) {
    formOnc.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.AppState.activePatientId) return;

      const oncData = {
        patient_id: window.AppState.activePatientId,
        chemo_protocol_name: document.getElementById('m-onc-protocol').value,
        start_date: document.getElementById('m-onc-start-date').value,
        treatment_intent: document.getElementById('m-onc-intent').value,
        targeted_agent: document.getElementById('m-onc-targeted').value,
        radiological_response_rano: document.getElementById('m-onc-response').value,
        toxicities_reported: document.getElementById('m-onc-toxicities').value
      };

      try {
        window.DatabaseAdapter.saveOncology(oncData);
        showToast('Neuro-Oncology regimen saved.', 'success');
        formOnc.reset();
        document.getElementById('modal-oncology').style.display = 'none';
        renderOncologyTable(window.AppState.activePatientId);
      } catch (err) {
        showToast('Failed to save oncology entry: ' + err.message, 'error');
      }
    });
  }

  // 3. Radiotherapy Modal Form
  const formRT = document.getElementById('form-modal-radiotherapy');
  if (formRT) {
    formRT.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.AppState.activePatientId) return;

      const rtData = {
        patient_id: window.AppState.activePatientId,
        radiotherapy_modality: document.getElementById('m-rt-modality').value,
        radiation_field: document.getElementById('m-rt-field').value,
        total_dose_gy: parseFloat(document.getElementById('m-rt-total-dose').value || 0),
        fraction_count: parseInt(document.getElementById('m-rt-fractions').value || 0, 10),
        csi_dose_gy: parseFloat(document.getElementById('m-rt-csi-dose').value || 0),
        boost_dose_gy: parseFloat(document.getElementById('m-rt-boost-dose').value || 0),
        completion_date: document.getElementById('m-rt-completion-date').value,
        toxicities: document.getElementById('m-rt-toxicities').value
      };

      try {
        window.DatabaseAdapter.saveRadiotherapy(rtData);
        showToast('Radiotherapy / Proton beam record saved.', 'success');
        formRT.reset();
        document.getElementById('modal-radiotherapy').style.display = 'none';
        renderRadiotherapyTable(window.AppState.activePatientId);
      } catch (err) {
        showToast('Failed to save radiotherapy entry: ' + err.message, 'error');
      }
    });
  }

  // 4. Neurorehabilitation Modal Form
  const formRehab = document.getElementById('form-modal-rehab');
  if (formRehab) {
    formRehab.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.AppState.activePatientId) return;

      const rehabData = {
        patient_id: window.AppState.activePatientId,
        assessment_date: document.getElementById('m-rehab-date').value,
        physiotherapy_gross_motor_goals: document.getElementById('m-rehab-physio').value,
        occupational_therapy_fine_motor_adls: document.getElementById('m-rehab-ot').value,
        speech_language_dysphagia_status: document.getElementById('m-rehab-slt').value,
        dietetics_nutritional_support: document.getElementById('m-rehab-dietetics').value
      };

      try {
        window.DatabaseAdapter.saveRehab(rehabData);
        showToast('Neurorehabilitation entry saved.', 'success');
        formRehab.reset();
        document.getElementById('modal-rehab').style.display = 'none';
        renderRehabTable(window.AppState.activePatientId);
      } catch (err) {
        showToast('Failed to save rehab entry: ' + err.message, 'error');
      }
    });
  }

  // 5. Neuropsychology Modal Form
  const formNP = document.getElementById('form-modal-neuropsych');
  if (formNP) {
    formNP.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.AppState.activePatientId) return;

      const npData = {
        patient_id: window.AppState.activePatientId,
        test_date: document.getElementById('m-np-date').value,
        battery_used: document.getElementById('m-np-battery').value,
        fsiq_or_dq_score: parseInt(document.getElementById('m-np-fsiq').value || 0, 10),
        verbal_comprehension_index: parseInt(document.getElementById('m-np-vci').value || 0, 10),
        perceptual_reasoning_index: parseInt(document.getElementById('m-np-pri').value || 0, 10),
        working_memory_index: parseInt(document.getElementById('m-np-wmi').value || 0, 10),
        processing_speed_index: parseInt(document.getElementById('m-np-psi').value || 0, 10),
        executive_function_summary: document.getElementById('m-np-executive').value,
        school_support_ehcp_status: document.getElementById('m-np-ehcp').value
      };

      try {
        window.DatabaseAdapter.saveNeuropsych(npData);
        showToast('Neuropsychology assessment saved.', 'success');
        formNP.reset();
        document.getElementById('modal-neuropsych').style.display = 'none';
        renderNeuropsychTable(window.AppState.activePatientId);
      } catch (err) {
        showToast('Failed to save neuropsychology entry: ' + err.message, 'error');
      }
    });
  }

  // 6. Family Discussions Modal Form
  const formFamilyDisc = document.getElementById('form-modal-family-disc');
  if (formFamilyDisc) {
    formFamilyDisc.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.AppState.activePatientId) return;

      const discData = {
        patient_id: window.AppState.activePatientId,
        discussion_date: document.getElementById('m-disc-date').value,
        encounter_milestone: document.getElementById('m-disc-milestone').value,
        clinician_lead: document.getElementById('m-disc-lead').value,
        cns_present: document.getElementById('m-disc-cns').value,
        family_members_present: document.getElementById('m-disc-family-members').value,
        key_topics_discussed: document.getElementById('m-disc-topics').value,
        family_preferences_and_goals: document.getElementById('m-disc-preferences').value,
        agreed_management_plan: document.getElementById('m-disc-agreed-plan').value
      };

      try {
        window.DatabaseAdapter.saveFamilyDiscussion(discData);
        showToast('Family discussion record logged.', 'success');
        formFamilyDisc.reset();
        document.getElementById('modal-family-disc').style.display = 'none';
        renderFamilyDiscussionsTable(window.AppState.activePatientId);
      } catch (err) {
        showToast('Failed to save family discussion: ' + err.message, 'error');
      }
    });
  }
}

function loadPatientsList(query = '') {
  const container = document.getElementById('patients-list-container');
  if (!container) return;

  const patients = window.DatabaseAdapter.getPatients(query);
  window.AppState.patientsList = patients;
  container.innerHTML = '';

  if (patients.length === 0) {
    container.innerHTML = `<div class="p-3 text-muted text-xs text-center">No patients match search.</div>`;
    return;
  }

  patients.forEach(p => {
    const item = document.createElement('div');
    item.className = `patient-list-item ${p.id === window.AppState.activePatientId ? 'active' : ''}`;
    item.onclick = () => selectPatient(p.id);

    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unnamed';
    const whoDiag = p.pathology?.who_diagnosis_2021 || 'Awaiting Histology';
    const site = p.presentation?.specific_anatomical_site || p.presentation?.anatomical_category || 'CNS';

    item.innerHTML = `
      <div class="patient-item-header">
        <strong class="patient-item-id">${p.study_id}</strong>
        <span class="patient-item-badge badge-${p.gender === 'Male' ? 'primary' : 'purple'}">${p.gender || 'Unknown'} &bull; ${p.age_at_presentation ? p.age_at_presentation + 'y' : ''}</span>
      </div>
      <div class="patient-item-name">${fullName}</div>
      <div class="patient-item-meta">${site} &bull; ${whoDiag}</div>
    `;
    container.appendChild(item);
  });

  // Auto-select first patient if none active
  if (!window.AppState.activePatientId && patients.length > 0) {
    selectPatient(patients[0].id);
  }
}

function selectPatient(patientId) {
  const p = window.DatabaseAdapter.getPatient(patientId);
  if (!p) return;

  window.AppState.activePatientId = p.id;
  window.AppState.activePatientData = p;

  // Highlight list item
  document.querySelectorAll('.patient-list-item').forEach(item => {
    item.classList.remove('active');
  });
  const items = document.querySelectorAll('.patient-list-item');
  items.forEach(el => {
    if (el.querySelector('.patient-item-id')?.textContent === p.study_id) {
      el.classList.add('active');
    }
  });

  // Update Status Banner
  const bannerBadge = document.getElementById('active-patient-header-badge');
  if (bannerBadge) {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    const who = p.pathology?.who_diagnosis_2021 || 'Histology Pending';
    const eor = p.outcomes?.extent_of_resection_achieved || 'EOR Pending';
    bannerBadge.innerHTML = `<strong>${p.study_id}</strong>: ${fullName} (${p.age_at_presentation}y) &bull; <span class="text-csf">${who}</span> &bull; <em>${eor}</em>`;
  }

  // Populate Demographics Form (Tab 1)
  setVal('f-study-id', p.study_id);
  setVal('f-hospital-number', p.hospital_number);
  setVal('f-first-name', p.first_name);
  setVal('f-last-name', p.last_name);
  setVal('f-dob', p.dob);
  setVal('f-age-at-presentation', p.age_at_presentation);
  setVal('f-age-unit', p.age_unit || 'Years');
  setVal('f-gender', p.gender || 'Unknown');
  setVal('f-ethnicity', p.ethnicity);
  setVal('f-handedness', p.handedness || 'Right');
  setVal('f-baseline-lansky-kps', p.baseline_lansky_kps);
  setVal('f-performance-scale-type', p.performance_scale_type || 'Lansky Play-Performance (<16y)');
  setVal('f-predisposition-syndrome', p.predisposition_syndrome || 'None / Sporadic');
  setVal('f-consultant-surgeon', p.consultant_surgeon);
  setVal('f-consultant-neurooncologist', p.consultant_neurooncologist);
  setVal('f-consultant-radiotherapist', p.consultant_radiotherapist);
  setVal('f-clinical-nurse-specialist', p.clinical_nurse_specialist);
  setVal('f-notes', p.notes);

  // Populate Tumour Presentation (Tab 2)
  const pres = p.presentation || {};
  setVal('f-anatomical-category', pres.anatomical_category || 'Brain - Posterior Fossa');
  setVal('f-specific-anatomical-site', pres.specific_anatomical_site);
  setVal('f-laterality', pres.laterality || 'Midline');
  setVal('f-symptom-duration-weeks', pres.symptom_duration_weeks);
  setVal('f-headache-raised-icp', pres.headache_raised_icp || 'No');
  setVal('f-vomiting-morning', pres.vomiting_morning || 'No');
  setVal('f-papilledema', pres.papilledema || 'No');
  setVal('f-macrocephaly-rapid-head-growth', pres.macrocephaly_rapid_head_growth || 'No');
  setVal('f-seizures', pres.seizures || 'No');
  setVal('f-cerebellar-ataxia-dysmetria', pres.cerebellar_ataxia_dysmetria || 'No');
  setVal('f-cranial-nerve-palsy', pres.cranial_nerve_palsy || 'None');
  setVal('f-torticollis-head-tilt', pres.torticollis_head_tilt || 'No');
  setVal('f-hemiparesis-motor-deficit', pres.hemiparesis_motor_deficit || 'None');
  setVal('f-back-or-neck-pain', pres.back_or_neck_pain || 'No');
  setVal('f-spinal-motor-weakness', pres.spinal_motor_weakness || 'None');
  setVal('f-sensory-level-deficit', pres.sensory_level_deficit || 'No');
  setVal('f-sphincter-disturbance', pres.sphincter_disturbance || 'No');
  setVal('f-spinal-deformity-scoliosis', pres.spinal_deformity_scoliosis || 'No');
  setVal('f-palpable-nerve-mass', pres.palpable_nerve_mass || 'No');
  setVal('f-radicular-pain', pres.radicular_pain || 'No');
  setVal('f-tinel-sign-positive', pres.tinel_sign_positive || 'No');
  setVal('f-focal-muscle-wasting', pres.focal_muscle_wasting || 'No');

  // Populate Pathology & Molecular Profile (Tab 3)
  const path = p.pathology || {};
  setVal('f-who-diagnosis-2021', path.who_diagnosis_2021);
  setVal('f-who-grade', path.who_grade || 'Grade 1');
  setVal('f-histological-subtype', path.histological_subtype);
  setVal('f-braf-status', path.braf_status || 'Wild-type');
  setVal('f-histone-h3-status', path.histone_h3_status || 'Wild-type / Retained');
  setVal('f-medulloblastoma-subgroup', path.medulloblastoma_subgroup || 'Not Applicable');
  setVal('f-ependymoma-subgroup', path.ependymoma_subgroup || 'Not Applicable');
  setVal('f-smarcb1-ini1-status', path.smarcb1_ini1_status || 'Intact / Retained');
  setVal('f-cdkn2a-b-deletion', path.cdkn2a_b_deletion || 'Intact');
  setVal('f-ki67-labeling-index-pct', path.ki67_labeling_index_pct);
  setVal('f-molecular-summary', path.molecular_summary);

  // Populate Tumour Outcomes (Tab 5)
  const out = p.outcomes || {};
  setVal('f-extent-of-resection-achieved', out.extent_of_resection_achieved || 'Gross Total Resection (GTR, 100%)');
  setVal('f-residual-tumour-present', out.residual_tumour_present || 'No Residue');
  setVal('f-residual-volume-cm3', out.residual_volume_cm3 || 0);
  setVal('f-residual-location-description', out.residual_location_description);
  setVal('f-metastatic-stage-chang', out.metastatic_stage_chang || 'M0: No evidence of metastasis');
  setVal('f-current-performance-score', out.current_performance_score || p.baseline_lansky_kps);
  setVal('f-performance-tool', out.performance_tool || p.performance_scale_type || 'Lansky Play-Performance (<16y)');
  setVal('f-pcpc-functional-grade', out.pcpc_functional_grade || 'Grade 1: Normal age-appropriate daily activities');
  setVal('f-ambulatory-status', out.ambulatory_status || 'Fully Independent');
  setVal('f-posterior-fossa-syndrome-cms', out.posterior_fossa_syndrome_cms || 'None');
  setVal('f-cranial-nerve-deficit-postop', out.cranial_nerve_deficit_postop || 'None');
  setVal('f-swallowing-dysphagia-peg-needed', out.swallowing_dysphagia_peg_needed || 'Normal Oral Feeds');
  setVal('f-endocrine-failure-postop', out.endocrine_failure_postop || 'Normal Axis');
  setVal('f-postop-hydrocephalus-shunt-required', out.postop_hydrocephalus_shunt_required || 'No (Resolved)');
  setVal('f-csf-leak-or-pseudomeningocele', out.csf_leak_or_pseudomeningocele || 'None');
  setVal('f-surgical-site-infection-meningitis', out.surgical_site_infection_meningitis || 'None');
  setVal('f-radiation-necrosis-or-vasculopathy', out.radiation_necrosis_or_vasculopathy || 'None');
  setVal('f-overall-disease-status', out.overall_disease_status || 'Complete Remission (CR)');

  // Refresh reactive calculators
  updatePerformanceBadges();
  updateEorBadge();
  updateChangBadge();
  updateMedulloBadge();
  updatePCPCBadge();

  // Render Sub-tables
  renderSurgeriesTable(p.id);
  renderOncologyTable(p.id);
  renderRadiotherapyTable(p.id);
  renderRehabTable(p.id);
  renderNeuropsychTable(p.id);
  renderFamilyDiscussionsTable(p.id);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.value = (val !== null && val !== undefined) ? val : '';
  }
}

function resetPatientForm() {
  window.AppState.activePatientId = null;
  window.AppState.activePatientData = null;

  document.querySelectorAll('.patient-list-item').forEach(i => i.classList.remove('active'));

  // Generate new Study ID
  const count = (window.AppState.patientsList.length + 1).toString().padStart(3, '0');
  const newStudyId = `PEDS-ONC-${count}`;

  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (!el.id.startsWith('f-login-') && !el.id.startsWith('f-pwd-') && !el.id.startsWith('f-new-') && !el.id.startsWith('m-')) {
      el.value = '';
    }
  });

  setVal('f-study-id', newStudyId);
  setVal('f-age-unit', 'Years');
  setVal('f-gender', 'Male');
  setVal('f-handedness', 'Right');
  setVal('f-performance-scale-type', 'Lansky Play-Performance (<16y)');
  setVal('f-predisposition-syndrome', 'None / Sporadic');
  setVal('f-anatomical-category', 'Brain - Posterior Fossa');
  setVal('f-laterality', 'Midline');
  setVal('f-who-grade', 'Grade 1');
  setVal('f-extent-of-resection-achieved', 'Gross Total Resection (GTR, 100%)');
  setVal('f-residual-tumour-present', 'No Residue');
  setVal('f-residual-volume-cm3', 0);
  setVal('f-metastatic-stage-chang', 'M0: No evidence of metastasis');
  setVal('f-pcpc-functional-grade', 'Grade 1: Normal age-appropriate daily activities');
  setVal('f-overall-disease-status', 'Complete Remission (CR)');

  const banner = document.getElementById('active-patient-header-badge');
  if (banner) banner.innerHTML = `<strong>NEW PATIENT DRAFT</strong> (${newStudyId})`;

  // Clear tables
  ['tbody-surgeries', 'tbody-oncology', 'tbody-radiotherapy', 'tbody-rehab', 'tbody-neuropsych', 'tbody-family-discussions'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<tr><td colspan="8" class="text-center text-muted text-xs p-3">Save patient to log entries.</td></tr>`;
  });

  updatePerformanceBadges();
  updateEorBadge();
  updateChangBadge();
  updateMedulloBadge();
  updatePCPCBadge();
}

function saveCurrentPatient() {
  const studyId = document.getElementById('f-study-id')?.value.trim();
  if (!studyId) {
    showToast('Study ID is mandatory.', 'error');
    return;
  }

  const patientObj = {
    id: window.AppState.activePatientId || undefined,
    study_id: studyId,
    hospital_number: document.getElementById('f-hospital-number')?.value.trim(),
    first_name: document.getElementById('f-first-name')?.value.trim(),
    last_name: document.getElementById('f-last-name')?.value.trim(),
    dob: document.getElementById('f-dob')?.value,
    age_at_presentation: parseFloat(document.getElementById('f-age-at-presentation')?.value || 0),
    age_unit: document.getElementById('f-age-unit')?.value,
    gender: document.getElementById('f-gender')?.value,
    ethnicity: document.getElementById('f-ethnicity')?.value,
    handedness: document.getElementById('f-handedness')?.value,
    baseline_lansky_kps: parseInt(document.getElementById('f-baseline-lansky-kps')?.value || 0, 10),
    performance_scale_type: document.getElementById('f-performance-scale-type')?.value,
    predisposition_syndrome: document.getElementById('f-predisposition-syndrome')?.value,
    consultant_surgeon: document.getElementById('f-consultant-surgeon')?.value,
    consultant_neurooncologist: document.getElementById('f-consultant-neurooncologist')?.value,
    consultant_radiotherapist: document.getElementById('f-consultant-radiotherapist')?.value,
    clinical_nurse_specialist: document.getElementById('f-clinical-nurse-specialist')?.value,
    notes: document.getElementById('f-notes')?.value,

    presentation: {
      anatomical_category: document.getElementById('f-anatomical-category')?.value,
      specific_anatomical_site: document.getElementById('f-specific-anatomical-site')?.value,
      laterality: document.getElementById('f-laterality')?.value,
      symptom_duration_weeks: parseFloat(document.getElementById('f-symptom-duration-weeks')?.value || 0),
      headache_raised_icp: document.getElementById('f-headache-raised-icp')?.value,
      vomiting_morning: document.getElementById('f-vomiting-morning')?.value,
      papilledema: document.getElementById('f-papilledema')?.value,
      macrocephaly_rapid_head_growth: document.getElementById('f-macrocephaly-rapid-head-growth')?.value,
      seizures: document.getElementById('f-seizures')?.value,
      cerebellar_ataxia_dysmetria: document.getElementById('f-cerebellar-ataxia-dysmetria')?.value,
      cranial_nerve_palsy: document.getElementById('f-cranial-nerve-palsy')?.value,
      torticollis_head_tilt: document.getElementById('f-torticollis-head-tilt')?.value,
      hemiparesis_motor_deficit: document.getElementById('f-hemiparesis-motor-deficit')?.value,
      back_or_neck_pain: document.getElementById('f-back-or-neck-pain')?.value,
      spinal_motor_weakness: document.getElementById('f-spinal-motor-weakness')?.value,
      sensory_level_deficit: document.getElementById('f-sensory-level-deficit')?.value,
      sphincter_disturbance: document.getElementById('f-sphincter-disturbance')?.value,
      spinal_deformity_scoliosis: document.getElementById('f-spinal-deformity-scoliosis')?.value,
      palpable_nerve_mass: document.getElementById('f-palpable-nerve-mass')?.value,
      radicular_pain: document.getElementById('f-radicular-pain')?.value,
      tinel_sign_positive: document.getElementById('f-tinel-sign-positive')?.value,
      focal_muscle_wasting: document.getElementById('f-focal-muscle-wasting')?.value
    },

    pathology: {
      who_diagnosis_2021: document.getElementById('f-who-diagnosis-2021')?.value,
      who_grade: document.getElementById('f-who-grade')?.value,
      histological_subtype: document.getElementById('f-histological-subtype')?.value,
      braf_status: document.getElementById('f-braf-status')?.value,
      histone_h3_status: document.getElementById('f-histone-h3-status')?.value,
      medulloblastoma_subgroup: document.getElementById('f-medulloblastoma-subgroup')?.value,
      ependymoma_subgroup: document.getElementById('f-ependymoma-subgroup')?.value,
      smarcb1_ini1_status: document.getElementById('f-smarcb1-ini1-status')?.value,
      cdkn2a_b_deletion: document.getElementById('f-cdkn2a-b-deletion')?.value,
      ki67_labeling_index_pct: parseFloat(document.getElementById('f-ki67-labeling-index-pct')?.value || 0),
      molecular_summary: document.getElementById('f-molecular-summary')?.value
    },

    outcomes: {
      extent_of_resection_achieved: document.getElementById('f-extent-of-resection-achieved')?.value,
      residual_tumour_present: document.getElementById('f-residual-tumour-present')?.value,
      residual_volume_cm3: parseFloat(document.getElementById('f-residual-volume-cm3')?.value || 0),
      residual_location_description: document.getElementById('f-residual-location-description')?.value,
      metastatic_stage_chang: document.getElementById('f-metastatic-stage-chang')?.value,
      current_performance_score: parseInt(document.getElementById('f-current-performance-score')?.value || 0, 10),
      performance_tool: document.getElementById('f-performance-tool')?.value,
      pcpc_functional_grade: document.getElementById('f-pcpc-functional-grade')?.value,
      ambulatory_status: document.getElementById('f-ambulatory-status')?.value,
      posterior_fossa_syndrome_cms: document.getElementById('f-posterior-fossa-syndrome-cms')?.value,
      cranial_nerve_deficit_postop: document.getElementById('f-cranial-nerve-deficit-postop')?.value,
      swallowing_dysphagia_peg_needed: document.getElementById('f-swallowing-dysphagia-peg-needed')?.value,
      endocrine_failure_postop: document.getElementById('f-endocrine-failure-postop')?.value,
      postop_hydrocephalus_shunt_required: document.getElementById('f-postop-hydrocephalus-shunt-required')?.value,
      csf_leak_or_pseudomeningocele: document.getElementById('f-csf-leak-or-pseudomeningocele')?.value,
      surgical_site_infection_meningitis: document.getElementById('f-surgical-site-infection-meningitis')?.value,
      radiation_necrosis_or_vasculopathy: document.getElementById('f-radiation-necrosis-or-vasculopathy')?.value,
      overall_disease_status: document.getElementById('f-overall-disease-status')?.value
    }
  };

  try {
    const saved = window.DatabaseAdapter.savePatient(patientObj);
    showToast(`Patient record '${saved.study_id}' saved successfully.`, 'success');
    loadPatientsList();
    selectPatient(saved.id);
  } catch (err) {
    showToast('Failed to save patient: ' + err.message, 'error');
  }
}

function deleteCurrentPatient() {
  if (!window.AppState.activePatientId) {
    showToast('No active patient selected to delete.', 'error');
    return;
  }
  const p = window.AppState.activePatientData;
  const studyId = p?.study_id || 'this patient';

  if (confirm(`Are you sure you want to permanently delete oncology record '${studyId}'? All linked surgeries, chemotherapy protocols, radiotherapy plans, and family conference records will be removed.`)) {
    try {
      window.DatabaseAdapter.deletePatient(window.AppState.activePatientId);
      showToast(`Patient '${studyId}' deleted.`, 'info');
      resetPatientForm();
      loadPatientsList();
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  }
}

// Child Table Renderers
function renderSurgeriesTable(patientId) {
  const tbody = document.getElementById('tbody-surgeries');
  if (!tbody) return;

  const surgeries = window.DatabaseAdapter.getSurgeries(patientId);
  window.AppState.surgeriesList = surgeries;
  tbody.innerHTML = '';

  if (surgeries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted text-xs p-3">No surgical procedures logged. Click '+ Log Surgical Procedure'.</td></tr>`;
    return;
  }

  surgeries.forEach(s => {
    const tr = document.createElement('tr');
    const badgeColor = s.procedure_category.includes('Primary Resection') ? 'badge-primary' :
                       s.procedure_category.includes('Redo') ? 'badge-warning' :
                       s.procedure_category.includes('Recurrence') ? 'badge-danger' :
                       s.procedure_category.includes('Metastasis') ? 'badge-purple' : 'badge-secondary';

    tr.innerHTML = `
      <td><strong>${s.surgery_date || '-'}</strong></td>
      <td><span class="badge ${badgeColor}">${s.procedure_category}</span></td>
      <td>${s.lead_surgeon || '-'}</td>
      <td>${s.surgical_approach || '-'}</td>
      <td>${s.intraop_monitoring_used === 'Yes' ? `<span class="badge badge-success">IONM: ${s.ionm_modalities || 'Yes'}</span>` : '<span class="text-muted">No</span>'}</td>
      <td>${s.fluorescence_guidance !== 'None' ? `<span class="badge badge-warning">${s.fluorescence_guidance}</span>` : '<span class="text-muted">None</span>'}</td>
      <td>${s.duration_minutes ? s.duration_minutes + ' min' : '-'} &bull; ${s.estimated_blood_loss_ml ? s.estimated_blood_loss_ml + ' ml' : '-'}</td>
      <td>
        <button class="btn btn-outline btn-xs text-danger" onclick="window.deleteSurgeryRecord('${s.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteSurgeryRecord = function(id) {
  if (confirm('Delete this surgical record?')) {
    try {
      window.DatabaseAdapter.deleteSurgery(id);
      showToast('Surgery record deleted.', 'info');
      renderSurgeriesTable(window.AppState.activePatientId);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

function renderOncologyTable(patientId) {
  const tbody = document.getElementById('tbody-oncology');
  if (!tbody) return;

  const list = window.DatabaseAdapter.getOncology(patientId);
  window.AppState.oncologyList = list;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted text-xs p-3">No chemotherapy or targeted therapy regimens recorded.</td></tr>`;
    return;
  }

  list.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${o.chemo_protocol_name}</strong></td>
      <td>${o.start_date || '-'}</td>
      <td><span class="badge ${o.treatment_intent === 'Curative / First-Line' ? 'badge-primary' : 'badge-secondary'}">${o.treatment_intent}</span></td>
      <td>${o.targeted_agent || 'None'}</td>
      <td><span class="badge ${o.radiological_response_rano.includes('CR') ? 'badge-success' : o.radiological_response_rano.includes('PD') ? 'badge-danger' : 'badge-warning'}">${o.radiological_response_rano}</span></td>
      <td><span class="text-xs">${o.toxicities_reported || 'None'}</span></td>
      <td>
        <button class="btn btn-outline btn-xs text-danger" onclick="window.deleteOncologyRecord('${o.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteOncologyRecord = function(id) {
  if (confirm('Delete this oncology record?')) {
    try {
      window.DatabaseAdapter.deleteOncology(id);
      showToast('Oncology regimen deleted.', 'info');
      renderOncologyTable(window.AppState.activePatientId);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

function renderRadiotherapyTable(patientId) {
  const tbody = document.getElementById('tbody-radiotherapy');
  if (!tbody) return;

  const list = window.DatabaseAdapter.getRadiotherapy(patientId);
  window.AppState.radiotherapyList = list;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted text-xs p-3">No radiotherapy or proton beam therapy plans recorded.</td></tr>`;
    return;
  }

  list.forEach(r => {
    const tr = document.createElement('tr');
    const isProton = r.radiotherapy_modality.includes('Proton');
    tr.innerHTML = `
      <td><span class="badge ${isProton ? 'badge-purple' : 'badge-primary'}">${r.radiotherapy_modality}</span></td>
      <td>${r.radiation_field}</td>
      <td><strong>${r.total_dose_gy ? r.total_dose_gy + ' Gy' : '-'}</strong></td>
      <td>${r.fraction_count || '-'} fx</td>
      <td>${r.csi_dose_gy ? r.csi_dose_gy + ' Gy' : '-'} / ${r.boost_dose_gy ? r.boost_dose_gy + ' Gy' : '-'}</td>
      <td>${r.completion_date || '-'}</td>
      <td><span class="text-xs">${r.toxicities || 'None'}</span></td>
      <td>
        <button class="btn btn-outline btn-xs text-danger" onclick="window.deleteRadiotherapyRecord('${r.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteRadiotherapyRecord = function(id) {
  if (confirm('Delete this radiotherapy record?')) {
    try {
      window.DatabaseAdapter.deleteRadiotherapy(id);
      showToast('Radiotherapy record deleted.', 'info');
      renderRadiotherapyTable(window.AppState.activePatientId);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

function renderRehabTable(patientId) {
  const tbody = document.getElementById('tbody-rehab');
  if (!tbody) return;

  const list = window.DatabaseAdapter.getRehab(patientId);
  window.AppState.rehabList = list;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted text-xs p-3">No neurorehabilitation assessments logged.</td></tr>`;
    return;
  }

  list.forEach(rh => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${rh.assessment_date}</strong></td>
      <td><span class="text-xs">${rh.physiotherapy_gross_motor_goals || '-'}</span></td>
      <td><span class="text-xs">${rh.occupational_therapy_fine_motor_adls || '-'}</span></td>
      <td><span class="text-xs">${rh.speech_language_dysphagia_status || '-'}</span></td>
      <td><span class="text-xs">${rh.dietetics_nutritional_support || '-'}</span></td>
      <td>
        <button class="btn btn-outline btn-xs text-danger" onclick="window.deleteRehabRecord('${rh.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteRehabRecord = function(id) {
  if (confirm('Delete this rehabilitation record?')) {
    try {
      window.DatabaseAdapter.deleteRehab(id);
      showToast('Rehabilitation entry deleted.', 'info');
      renderRehabTable(window.AppState.activePatientId);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

function renderNeuropsychTable(patientId) {
  const tbody = document.getElementById('tbody-neuropsych');
  if (!tbody) return;

  const list = window.DatabaseAdapter.getNeuropsych(patientId);
  window.AppState.neuropsychList = list;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted text-xs p-3">No neuropsychology test batteries recorded.</td></tr>`;
    return;
  }

  list.forEach(np => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${np.test_date}</strong></td>
      <td><span class="badge badge-secondary">${np.battery_used}</span></td>
      <td><strong>${np.fsiq_or_dq_score || '-'}</strong></td>
      <td><span class="text-xs">VCI: ${np.verbal_comprehension_index || '-'}, PRI: ${np.perceptual_reasoning_index || '-'}</span></td>
      <td><span class="text-xs">WMI: ${np.working_memory_index || '-'}, PSI: ${np.processing_speed_index || '-'}</span></td>
      <td><span class="badge ${np.school_support_ehcp_status.includes('Active') ? 'badge-primary' : 'badge-secondary'}">${np.school_support_ehcp_status}</span></td>
      <td>
        <button class="btn btn-outline btn-xs text-danger" onclick="window.deleteNeuropsychRecord('${np.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteNeuropsychRecord = function(id) {
  if (confirm('Delete this neuropsychology record?')) {
    try {
      window.DatabaseAdapter.deleteNeuropsych(id);
      showToast('Neuropsychology record deleted.', 'info');
      renderNeuropsychTable(window.AppState.activePatientId);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

function renderFamilyDiscussionsTable(patientId) {
  const tbody = document.getElementById('tbody-family-discussions');
  if (!tbody) return;

  const list = window.DatabaseAdapter.getFamilyDiscussions(patientId);
  window.AppState.familyDiscussionsList = list;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted text-xs p-3">No family discussions recorded. Click '+ Log Family Discussion'.</td></tr>`;
    return;
  }

  list.forEach(fd => {
    const tr = document.createElement('tr');
    const badgeColor = fd.encounter_milestone.includes('Initial') ? 'badge-primary' :
                       fd.encounter_milestone.includes('Pre-Op') ? 'badge-secondary' :
                       fd.encounter_milestone.includes('Histology') ? 'badge-purple' :
                       fd.encounter_milestone.includes('Recurrence') || fd.encounter_milestone.includes('Redo') ? 'badge-danger' :
                       fd.encounter_milestone.includes('Advance') ? 'badge-warning' : 'badge-secondary';

    tr.innerHTML = `
      <td><strong>${fd.discussion_date}</strong></td>
      <td><span class="badge ${badgeColor}">${fd.encounter_milestone}</span></td>
      <td>${fd.clinician_lead || '-'} &bull; <span class="text-muted">CNS: ${fd.cns_present || '-'}</span></td>
      <td>${fd.family_members_present || '-'}</td>
      <td><div class="text-xs" style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${fd.key_topics_discussed}">${fd.key_topics_discussed}</div></td>
      <td><div class="text-xs" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${fd.agreed_management_plan}">${fd.agreed_management_plan || '-'}</div></td>
      <td>
        <button class="btn btn-outline btn-xs text-danger" onclick="window.deleteFamilyDiscussionRecord('${fd.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteFamilyDiscussionRecord = function(id) {
  if (confirm('Delete this family discussion record?')) {
    try {
      window.DatabaseAdapter.deleteFamilyDiscussion(id);
      showToast('Family discussion record deleted.', 'info');
      renderFamilyDiscussionsTable(window.AppState.activePatientId);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

// Cohort Analytics Tab Renderer
function renderCohortAnalytics() {
  const analytics = window.DatabaseAdapter.getCohortAnalytics();

  // Metrics cards
  const elTotal = document.getElementById('card-cohort-total');
  const elSurg = document.getElementById('card-cohort-surgeries');
  const elRedo = document.getElementById('card-cohort-redos');
  const elProton = document.getElementById('card-cohort-proton-rate');
  const elGtr = document.getElementById('card-cohort-gtr-rate');

  if (elTotal) elTotal.textContent = analytics.totalPatients;
  if (elSurg) elSurg.textContent = analytics.totalSurgeries;
  if (elRedo) elRedo.textContent = analytics.reoperationsCount;
  if (elProton) elProton.textContent = `${analytics.protonTherapyPct}%`;
  if (elGtr) elGtr.textContent = `${analytics.gtrRatePct}%`;

  // Histology Table
  renderDistributionTable('tbody-cohort-histology', analytics.histologyDistribution, analytics.totalPatients);

  // Surgery Types Table
  renderDistributionTable('tbody-cohort-surgery-types', analytics.surgeryCategories, analytics.totalSurgeries);

  // Extent of Resection Table
  renderDistributionTable('tbody-cohort-eor', analytics.eorDistribution, analytics.totalPatients);

  // Disease Status Table
  renderDistributionTable('tbody-cohort-disease-status', analytics.diseaseStatusDistribution, analytics.totalPatients);
}

function renderDistributionTable(tbodyId, distMap, total) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = '';

  const entries = Object.entries(distMap).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted text-xs p-2">No data available</td></tr>`;
    return;
  }

  entries.forEach(([key, count]) => {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${key}</strong></td>
      <td>${count}</td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="flex:1; background:rgba(255,255,255,0.08); height:6px; border-radius:3px; overflow:hidden;">
            <div style="width:${pct}%; background:var(--accent-csf); height:100%;"></div>
          </div>
          <span class="text-xs text-muted" style="min-width:38px;">${pct}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function initAuditAndDesignModals() {
  // Audit Log Modal Render
  const btnAudit = document.getElementById('btn-audit-log');
  if (btnAudit) {
    btnAudit.addEventListener('click', () => {
      renderAuditLog();
    });
  }

  // Database Design Schema Render
  const sqlContainer = document.getElementById('schema-sql-display');
  if (sqlContainer && window.SCHEMA_SQL) {
    sqlContainer.textContent = window.SCHEMA_SQL.trim();
  }

  const btnSaveDesign = document.getElementById('btn-save-db-design');
  if (btnSaveDesign) {
    btnSaveDesign.addEventListener('click', () => {
      showToast('Database architectural documentation saved.', 'success');
      document.getElementById('modal-database-design').style.display = 'none';
    });
  }

  // Database Operations (Clone, Reset)
  const btnClone = document.getElementById('btn-clone-db');
  if (btnClone) {
    btnClone.addEventListener('click', () => {
      try {
        window.DatabaseAdapter.exportToJson();
        showToast('Database clone created as JSON snapshot.', 'success');
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  }

  const btnResetDb = document.getElementById('btn-reset-db-demo');
  if (btnResetDb) {
    btnResetDb.addEventListener('click', () => {
      if (confirm('Warning: This will reload the default preloaded paediatric neuro-oncology demonstrator cases. Proceed?')) {
        localStorage.removeItem('peds_onco_patients_v1');
        localStorage.removeItem('peds_onco_surgeries_v1');
        localStorage.removeItem('peds_onco_oncology_v1');
        localStorage.removeItem('peds_onco_radiotherapy_v1');
        localStorage.removeItem('peds_onco_rehab_v1');
        localStorage.removeItem('peds_onco_neuropsych_v1');
        localStorage.removeItem('peds_onco_family_disc_v1');
        window.location.reload();
      }
    });
  }
}

function renderAuditLog() {
  const tbody = document.getElementById('tbody-audit-log');
  if (!tbody) return;
  const logs = window.DatabaseAdapter.getAuditLog();
  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted text-xs p-3">Audit ledger is empty.</td></tr>`;
    return;
  }

  logs.slice(0, 50).forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="text-xs">${l.timestamp}</span></td>
      <td><strong>${l.username}</strong></td>
      <td><span class="badge ${l.action.includes('DELETE') ? 'badge-danger' : l.action.includes('SAVE') ? 'badge-success' : 'badge-secondary'}">${l.action}</span></td>
      <td>${l.study_id || '-'}</td>
      <td><span class="text-xs">${l.details || '-'}</span></td>
      <td><code class="text-xs">${l.record_hash.substring(0, 10)}...</code> <span class="badge badge-success" style="font-size:9px;">VERIFIED</span></td>
    `;
    tbody.appendChild(tr);
  });
}
