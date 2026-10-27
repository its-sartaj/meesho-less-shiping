/**
 * Meesho Shipping Fixer - 5 Variations & Empirical Shipping Tester
 * Manifest V3 Extension Popup Controller
 * 
 * Generates 5 realistic product image variations with different framing, whitespace,
 * and clean backgrounds. Records actual shipping charges shown by Meesho to find out
 * whether shipping can genuinely be reduced (e.g. from ₹80 to ₹45, ₹50, or ₹56).
 */

const VARIATION_CONFIGS = [
  {
    id: 'var-1',
    name: 'Variation 1: Standard Pure White',
    shortLabel: 'Standard White (82%)',
    description: 'Clean #FFFFFF studio backdrop with standard 82% scale and ground shadow.',
    scale: 0.82,
    bgType: 'white',
    contactShadow: true
  },
  {
    id: 'var-2',
    name: 'Variation 2: Soft Studio Vignette',
    shortLabel: 'Soft Studio (80%)',
    description: 'Soft daylight studio gradient (#FFF to #F1F5F9) with 80% scale.',
    scale: 0.80,
    bgType: 'soft',
    contactShadow: true
  },
  {
    id: 'var-3',
    name: 'Variation 3: Tight Fit Presentation',
    shortLabel: 'Tight Framing (88%)',
    description: '88% tight scale maximizing visible product texture and surface details.',
    scale: 0.88,
    bgType: 'white',
    contactShadow: true
  },
  {
    id: 'var-4',
    name: 'Variation 4: Generous Whitespace',
    shortLabel: 'Generous Whitespace (74%)',
    description: '74% relaxed scale with generous whitespace boundaries to test density.',
    scale: 0.74,
    bgType: 'white',
    contactShadow: false
  },
  {
    id: 'var-5',
    name: 'Variation 5: Warm Studio Matte',
    shortLabel: 'Warm Studio (84%)',
    description: '84% scale on warm-white #FAF9F6 matte background with grounded contact shadow.',
    scale: 0.84,
    bgType: 'warm',
    contactShadow: true
  }
];

// Extension State
const state = {
  currentTabId: null,
  isMeeshoTab: false,
  originalImage: null,
  originalFilename: 'product_photo.jpg',
  baselineShipping: 80,
  variations: [],
  isGenerating: false,
  pendingApplyVariation: null
};

// DOM References
const el = {
  connectionStatus: document.getElementById('connectionStatus'),
  connectionText: document.getElementById('connectionText'),
  toastMessage: document.getElementById('toastMessage'),

  // Upload Section
  uploadSection: document.getElementById('uploadSection'),
  fileInput: document.getElementById('fileInput'),
  dropzoneArea: document.getElementById('dropzoneArea'),
  btnSelectFile: document.getElementById('btnSelectFile'),
  tabImportNotice: document.getElementById('tabImportNotice'),
  btnImportTabPhoto: document.getElementById('btnImportTabPhoto'),

  // Variations Section
  variationsSection: document.getElementById('variationsSection'),
  btnResetImage: document.getElementById('btnResetImage'),
  btnGenerate5: document.getElementById('btnGenerate5'),
  btnGenerate5Text: document.getElementById('btnGenerate5Text'),
  inputBaselineShipping: document.getElementById('inputBaselineShipping'),
  lowestVerifiedBanner: document.getElementById('lowestVerifiedBanner'),
  lowestChargeText: document.getElementById('lowestChargeText'),
  lowestVarText: document.getElementById('lowestVarText'),
  lowestSavingsText: document.getElementById('lowestSavingsText'),
  generatingOverlay: document.getElementById('generatingOverlay'),
  generatingStatusText: document.getElementById('generatingStatusText'),

  imgOriginalThumb: document.getElementById('imgOriginalThumb'),
  origMeta: document.getElementById('origMeta'),
  btnReadMeeshoShipping: document.getElementById('btnReadMeeshoShipping'),

  variationsList: document.getElementById('variationsList'),
  rankedSection: document.getElementById('rankedSection'),
  rankedList: document.getElementById('rankedList'),
  testedCountLabel: document.getElementById('testedCountLabel'),

  // Modal
  confirmModal: document.getElementById('confirmModal'),
  modalVariationDesc: document.getElementById('modalVariationDesc'),
  btnCancelModal: document.getElementById('btnCancelModal'),
  btnConfirmApply: document.getElementById('btnConfirmApply')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTabConnection();
  bindEvents();
});

/**
 * Tab connection check
 */
async function initTabConnection() {
  try {
    if (typeof chrome === 'undefined' || !chrome?.tabs?.query) {
      setConnectionStatus(true, 'Web Studio Active');
      return;
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.id) {
      setConnectionStatus(true, 'Web Studio Active');
      return;
    }

    state.currentTabId = currentTab.id;
    const url = currentTab.url || '';
    const isMeesho = url.includes('supplier.meesho.com') || url.includes('meesho.com') || url.includes('localhost');

    if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
      setConnectionStatus(false, 'Extension Active');
      return;
    }

    if (isMeesho) {
      state.isMeeshoTab = true;
      setConnectionStatus(true, 'Meesho Draft Connected');
      el.btnReadMeeshoShipping?.classList.remove('hidden');

      // Check for existing photo on tab
      try {
        const resp = await chrome.tabs.sendMessage(state.currentTabId, { action: 'GET_PAGE_IMAGE' });
        if (resp && resp.imageUrl) {
          el.tabImportNotice?.classList.remove('hidden');
          el.btnImportTabPhoto?.addEventListener('click', () => {
            loadImageUrl(resp.imageUrl, 'meesho_draft_photo.jpg');
          });
        }
      } catch (e) {
        // Content script initializing
      }
    } else {
      setConnectionStatus(false, 'Universal Mode');
    }
  } catch (err) {
    console.warn('Tab initialization warning:', err);
    setConnectionStatus(false, 'Universal Mode');
  }
}

function setConnectionStatus(connected, label) {
  if (!el.connectionStatus || !el.connectionText) return;
  el.connectionText.textContent = label;
  if (connected) {
    el.connectionStatus.classList.add('connected');
  } else {
    el.connectionStatus.classList.remove('connected');
  }
}

function showToast(msg, isError = false, duration = 4000) {
  if (!el.toastMessage) return;
  el.toastMessage.textContent = msg;
  el.toastMessage.className = `toast ${isError ? 'error' : ''}`;
  setTimeout(() => {
    el.toastMessage.classList.add('hidden');
  }, duration);
}

/**
 * Event bindings
 */
function bindEvents() {
  // Dropzone clicks
  el.dropzoneArea?.addEventListener('click', () => el.fileInput?.click());
  el.btnSelectFile?.addEventListener('click', (e) => {
    e.stopPropagation();
    el.fileInput?.click();
  });

  // Drag and drop
  ['dragenter', 'dragover'].forEach((evt) => {
    el.dropzoneArea?.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.dropzoneArea.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    el.dropzoneArea?.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.dropzoneArea.classList.remove('dragover');
    });
  });

  el.dropzoneArea?.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  // File input change
  el.fileInput?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  // Reset to upload another photo
  el.btnResetImage?.addEventListener('click', () => {
    state.originalImage = null;
    state.variations = [];
    if (el.fileInput) el.fileInput.value = '';
    el.variationsSection?.classList.add('hidden');
    el.uploadSection?.classList.remove('hidden');
  });

  // Generate 5 variations button
  el.btnGenerate5?.addEventListener('click', () => {
    generateAll5Variations();
  });

  // Baseline shipping input
  el.inputBaselineShipping?.addEventListener('change', (e) => {
    state.baselineShipping = Number(e.target.value) || 80;
    updateRankingsAndBanner();
  });

  // Detect live shipping from open Meesho tab
  el.btnReadMeeshoShipping?.addEventListener('click', async () => {
    if (!state.currentTabId) return;
    try {
      const resp = await chrome.tabs.sendMessage(state.currentTabId, { action: 'DETECT_SHIPPING' });
      if (resp && resp.shippingCharge) {
        showToast(`✓ Detected Meesho page shipping charge: ₹${resp.shippingCharge}`);
      } else {
        showToast('Could not find shipping charge on current page. Please enter it manually.', false);
      }
    } catch (e) {
      showToast('Could not query Meesho tab. Please enter fee manually.', true);
    }
  });

  // Modal actions
  el.btnCancelModal?.addEventListener('click', () => {
    el.confirmModal?.classList.add('hidden');
    state.pendingApplyVariation = null;
  });

  el.btnConfirmApply?.addEventListener('click', async () => {
    el.confirmModal?.classList.add('hidden');
    const v = state.pendingApplyVariation;
    if (!v || !state.currentTabId) return;

    try {
      const cleanName = state.originalFilename.replace(/\.[^/.]+$/, '');
      const filename = `meesho_1080_${v.id}_${cleanName}.jpg`;

      const res = await chrome.tabs.sendMessage(state.currentTabId, {
        action: 'APPLY_APPROVED_IMAGE',
        payload: {
          dataUrl: v.dataUrl,
          filename
        }
      });

      if (res && res.success) {
        showToast(`✓ Attached ${v.shortLabel} to Meesho upload slot!`);
      } else {
        showToast('Image generated. Please drop downloaded file onto Meesho form.', false);
      }
    } catch (err) {
      console.warn('Apply error:', err);
      showToast('Could not reach Meesho tab. Please click Download and attach manually.', true);
    } finally {
      state.pendingApplyVariation = null;
    }
  });
}

function handleFileSelected(file) {
  state.originalFilename = file.name || 'product_photo.jpg';
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result;
    if (dataUrl) {
      loadImageUrl(dataUrl, file.name);
    }
  };
  reader.readAsDataURL(file);
}

function loadImageUrl(url, filename = 'product_photo.jpg') {
  state.originalFilename = filename;
  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    state.originalImage = img;
    if (el.imgOriginalThumb) el.imgOriginalThumb.src = url;
    if (el.origMeta) {
      el.origMeta.textContent = `${img.naturalWidth} × ${img.naturalHeight} px (Original Photo)`;
    }

    el.uploadSection?.classList.add('hidden');
    el.variationsSection?.classList.remove('hidden');

    // Generate 5 variations
    generateAll5Variations();
  };

  img.onerror = () => {
    showToast('Failed to load image. Please try another file.', true);
  };

  img.src = url;
}

/**
 * Generate 5 realistic variations with distinct backgrounds and framing
 */
async function generateAll5Variations() {
  if (!state.originalImage || state.isGenerating) return;

  state.isGenerating = true;
  el.generatingOverlay?.classList.remove('hidden');
  if (el.btnGenerate5) el.btnGenerate5.disabled = true;

  try {
    const vars = [];

    for (let i = 0; i < VARIATION_CONFIGS.length; i++) {
      const cfg = VARIATION_CONFIGS[i];
      if (el.generatingStatusText) {
        el.generatingStatusText.textContent = `Generating ${cfg.name}...`;
      }

      // Small async tick
      await new Promise((r) => setTimeout(r, 40));

      const dataUrl = await renderStudioCanvas(state.originalImage, cfg);
      vars.push({
        ...cfg,
        dataUrl,
        tested: false,
        testedShipping: undefined
      });
    }

    state.variations = vars;
    renderVariationsList();
    updateRankingsAndBanner();
    showToast('✓ Generated 5 realistic product variations ready for testing!');
  } catch (err) {
    console.error('Error generating 5 variations:', err);
    showToast('Failed to generate all variations.', true);
  } finally {
    state.isGenerating = false;
    el.generatingOverlay?.classList.add('hidden');
    if (el.btnGenerate5) el.btnGenerate5.disabled = false;
  }
}

/**
 * Render high-resolution 1080x1080 canvas for given variation spec
 */
async function renderStudioCanvas(srcImg, spec) {
  const nw = srcImg.naturalWidth || 800;
  const nh = srcImg.naturalHeight || 800;

  // Offscreen sample for foreground bounding box
  const sampleCanvas = document.createElement('canvas');
  const sampleScale = Math.min(1, 800 / Math.max(nw, nh));
  const sw = Math.round(nw * sampleScale);
  const sh = Math.round(nh * sampleScale);
  sampleCanvas.width = sw;
  sampleCanvas.height = sh;
  const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  sCtx.drawImage(srcImg, 0, 0, sw, sh);

  const imgData = sCtx.getImageData(0, 0, sw, sh);
  const pixels = imgData.data;

  // Detect corner background color
  const corners = [
    getPixel(pixels, sw, 0, 0),
    getPixel(pixels, sw, sw - 1, 0),
    getPixel(pixels, sw, 0, sh - 1),
    getPixel(pixels, sw, sw - 1, sh - 1)
  ];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const c of corners) {
    bgR += c.r; bgG += c.g; bgB += c.b;
  }
  bgR = Math.round(bgR / 4);
  bgG = Math.round(bgG / 4);
  bgB = Math.round(bgB / 4);

  let minX = sw, minY = sh, maxX = 0, maxY = 0;
  const threshold = 24;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      const diff = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      if (diff > threshold && a > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX >= maxX || minY >= maxY) {
    minX = 0; minY = 0; maxX = sw; maxY = sh;
  }

  const origBox = {
    x: Math.max(0, Math.floor(minX / sampleScale)),
    y: Math.max(0, Math.floor(minY / sampleScale)),
    w: Math.min(nw, Math.ceil((maxX - minX + 1) / sampleScale)),
    h: Math.min(nh, Math.ceil((maxY - minY + 1) / sampleScale))
  };

  const outSize = 1080;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outSize;
  outCanvas.height = outSize;
  const outCtx = outCanvas.getContext('2d');

  // Background
  if (spec.bgType === 'white') {
    outCtx.fillStyle = '#FFFFFF';
    outCtx.fillRect(0, 0, outSize, outSize);
  } else if (spec.bgType === 'warm') {
    outCtx.fillStyle = '#FAF9F6';
    outCtx.fillRect(0, 0, outSize, outSize);
  } else if (spec.bgType === 'soft') {
    const grad = outCtx.createRadialGradient(outSize / 2, outSize / 2, 80, outSize / 2, outSize / 2, outSize * 0.72);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#F1F5F9');
    outCtx.fillStyle = grad;
    outCtx.fillRect(0, 0, outSize, outSize);
  }

  // Framing scale
  const targetScale = spec.scale || 0.82;
  const maxSubjectDim = outSize * targetScale;
  const subjectAspect = origBox.w / origBox.h;
  let targetW, targetH;

  if (subjectAspect >= 1) {
    targetW = maxSubjectDim;
    targetH = targetW / subjectAspect;
  } else {
    targetH = maxSubjectDim;
    targetW = targetH * subjectAspect;
  }

  const destX = (outSize - targetW) / 2;
  const destY = (outSize - targetH) / 2;

  // Soft ground contact shadow
  if (spec.contactShadow) {
    outCtx.save();
    const shadowY = destY + targetH;
    const shadowRadiusX = targetW * 0.42;
    const shadowRadiusY = Math.max(6, targetH * 0.035);

    const shadowGrad = outCtx.createRadialGradient(
      outSize / 2, shadowY - shadowRadiusY * 0.3,
      1,
      outSize / 2, shadowY,
      shadowRadiusX
    );
    shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.16)');
    shadowGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.08)');
    shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    outCtx.fillStyle = shadowGrad;
    outCtx.beginPath();
    outCtx.ellipse(outSize / 2, shadowY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
    outCtx.fill();
    outCtx.restore();
  }

  // Draw subject centered with authentic proportions
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  const boxRatio = (origBox.w * origBox.h) / (nw * nh);
  if (boxRatio > 0.94) {
    const fullAspect = nw / nh;
    let fw, fh;
    if (fullAspect >= 1) {
      fw = maxSubjectDim;
      fh = fw / fullAspect;
    } else {
      fh = maxSubjectDim;
      fw = fh * fullAspect;
    }
    outCtx.drawImage(srcImg, (outSize - fw) / 2, (outSize - fh) / 2, fw, fh);
  } else {
    outCtx.drawImage(
      srcImg,
      origBox.x, origBox.y, origBox.w, origBox.h,
      destX, destY, targetW, targetH
    );
  }

  return outCanvas.toDataURL('image/jpeg', 0.92);
}

function getPixel(pixels, width, x, y) {
  const i = (y * width + x) * 4;
  return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], a: pixels[i + 3] };
}

/**
 * Render Variations Cards
 */
function renderVariationsList() {
  if (!el.variationsList) return;
  el.variationsList.innerHTML = '';

  state.variations.forEach((v) => {
    const card = document.createElement('div');
    card.className = `variation-item ${v.tested ? 'tested' : ''}`;
    card.id = `card-${v.id}`;

    card.innerHTML = `
      <div class="var-header">
        <div class="var-title-row">
          <strong>${v.name}</strong>
          <span class="badge ${v.tested ? 'badge-success' : 'badge-neutral'}">
            ${v.tested ? `Verified: ₹${v.testedShipping}` : 'Untested'}
          </span>
        </div>
        <p class="var-desc">${v.description}</p>
      </div>

      <div class="var-body">
        <div class="var-thumb-wrapper">
          <img src="${v.dataUrl}" alt="${v.name}" class="var-img">
        </div>

        <div class="var-controls">
          <div class="var-btn-row">
            <button type="button" class="btn btn-outline btn-xs btn-download-var" data-id="${v.id}">
              Download JPG
            </button>
            <button type="button" class="btn btn-primary btn-xs btn-test-var" data-id="${v.id}">
              Test on Meesho
            </button>
          </div>

          <div class="shipping-record-box">
            <span class="record-label">Record Meesho Shipping Shown:</span>
            <div class="quick-chips">
              <button type="button" class="chip ${v.testedShipping === 45 ? 'active' : ''}" data-id="${v.id}" data-fee="45">₹45</button>
              <button type="button" class="chip ${v.testedShipping === 50 ? 'active' : ''}" data-id="${v.id}" data-fee="50">₹50</button>
              <button type="button" class="chip ${v.testedShipping === 56 ? 'active' : ''}" data-id="${v.id}" data-fee="56">₹56</button>
              <button type="button" class="chip ${v.testedShipping === 80 ? 'active' : ''}" data-id="${v.id}" data-fee="80">₹80</button>
            </div>
            <div class="custom-fee-row">
              <span>₹</span>
              <input type="number" class="fee-input" id="fee-input-${v.id}" placeholder="other" value="${v.testedShipping || ''}">
              <button type="button" class="btn btn-secondary btn-xs btn-save-fee" data-id="${v.id}">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;

    el.variationsList.appendChild(card);
  });

  // Bind buttons inside cards
  document.querySelectorAll('.btn-download-var').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      const v = state.variations.find((item) => item.id === id);
      if (v) downloadVariation(v);
    });
  });

  document.querySelectorAll('.btn-test-var').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      const v = state.variations.find((item) => item.id === id);
      if (v) {
        if (!state.currentTabId || typeof chrome === 'undefined' || !chrome?.tabs?.sendMessage) {
          downloadVariation(v);
          showToast(`✓ Downloaded ${v.shortLabel}! Upload it to your Meesho catalog draft to check the updated shipping rate.`, false, 4500);
          return;
        }
        state.pendingApplyVariation = v;
        if (el.modalVariationDesc) {
          el.modalVariationDesc.textContent = `Attach ${v.name} (${v.shortLabel}) to the catalog draft upload slot on your open Meesho tab.`;
        }
        el.confirmModal?.classList.remove('hidden');
      }
    });
  });

  document.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const fee = Number(e.target.dataset.fee);
      recordVariationShipping(id, fee);
    });
  });

  document.querySelectorAll('.btn-save-fee').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const input = document.getElementById(`fee-input-${id}`);
      const val = Number(input?.value);
      if (val > 0) {
        recordVariationShipping(id, val);
      }
    });
  });
}

function recordVariationShipping(varId, fee) {
  const v = state.variations.find((item) => item.id === varId);
  if (v) {
    v.testedShipping = fee;
    v.tested = true;
    renderVariationsList();
    updateRankingsAndBanner();
    showToast(`✓ Recorded ₹${fee} for ${v.shortLabel}`);
  }
}

function downloadVariation(v) {
  const a = document.createElement('a');
  a.href = v.dataUrl;
  const cleanName = state.originalFilename.replace(/\.[^/.]+$/, '');
  a.download = `${v.id}_${cleanName}_1080.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`✓ Downloaded ${v.shortLabel}`);
}

/**
 * Update Lowest Verified Banner and Ranked Results List
 */
function updateRankingsAndBanner() {
  const tested = state.variations.filter((v) => v.tested && v.testedShipping !== undefined);
  const untested = state.variations.filter((v) => !v.tested);

  const sortedTested = [...tested].sort((a, b) => a.testedShipping - b.testedShipping);
  const lowest = sortedTested.length > 0 ? sortedTested[0] : null;

  // Banner
  if (lowest && el.lowestVerifiedBanner) {
    el.lowestVerifiedBanner.classList.remove('hidden');
    if (el.lowestChargeText) el.lowestChargeText.textContent = `Lowest Verified: ₹${lowest.testedShipping}`;
    if (el.lowestVarText) el.lowestVarText.textContent = `${lowest.name} (${lowest.shortLabel})`;

    const diff = state.baselineShipping - lowest.testedShipping;
    if (el.lowestSavingsText) {
      if (diff > 0) {
        const pct = Math.round((diff / state.baselineShipping) * 100);
        el.lowestSavingsText.textContent = `-₹${diff} (-${pct}%)`;
        el.lowestSavingsText.className = 'savings-tag positive';
      } else if (diff === 0) {
        el.lowestSavingsText.textContent = 'Baseline (0)';
        el.lowestSavingsText.className = 'savings-tag neutral';
      } else {
        el.lowestSavingsText.textContent = `+₹${Math.abs(diff)}`;
        el.lowestSavingsText.className = 'savings-tag negative';
      }
    }
  } else if (el.lowestVerifiedBanner) {
    el.lowestVerifiedBanner.classList.add('hidden');
  }

  // Ranked List
  if (tested.length > 0 && el.rankedSection && el.rankedList) {
    el.rankedSection.classList.remove('hidden');
    if (el.testedCountLabel) {
      el.testedCountLabel.textContent = `${tested.length} of ${state.variations.length} Tested`;
    }

    el.rankedList.innerHTML = '';

    sortedTested.forEach((v, idx) => {
      const diff = v.testedShipping - state.baselineShipping;
      const row = document.createElement('div');
      row.className = 'ranked-row';
      row.innerHTML = `
        <div class="ranked-left">
          <span class="rank-num ${idx === 0 ? 'winner' : ''}">${idx + 1}</span>
          <span class="rank-name">${v.name}</span>
        </div>
        <div class="ranked-right">
          <strong class="rank-charge">₹${v.testedShipping}</strong>
          <span class="rank-diff ${diff < 0 ? 'green' : diff === 0 ? 'gray' : 'amber'}">
            ${diff < 0 ? `-₹${Math.abs(diff)}` : diff === 0 ? '(₹0)' : `+₹${diff}`}
          </span>
        </div>
      `;
      el.rankedList.appendChild(row);
    });

    untested.forEach((v) => {
      const row = document.createElement('div');
      row.className = 'ranked-row untested';
      row.innerHTML = `
        <div class="ranked-left">
          <span class="rank-num">-</span>
          <span class="rank-name">${v.name}</span>
        </div>
        <span class="untested-label">Untested</span>
      `;
      el.rankedList.appendChild(row);
    });
  } else if (el.rankedSection) {
    el.rankedSection.classList.add('hidden');
  }
}
