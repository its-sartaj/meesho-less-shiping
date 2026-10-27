/**
 * Universal Product Image Optimizer - Content Script (Manifest V3)
 * Provides safe, on-demand catalog image injection for Meesho Supplier Panel.
 * 
 * STRICT PRINCIPLES:
 * 1. Only attaches the user-approved optimized image to the product photo slot.
 * 2. NEVER modifies package weight, dimensions, prices, product descriptions, or shipping info.
 * 3. Never automatically submits or publishes listings.
 * 4. No fake calculations, no category assumptions, and no unsupported savings claims.
 */

(() => {
  console.log('[Product Image Optimizer] Content script ready on:', window.location.href);

  /**
   * Convert DataURL to a native File object
   */
  function dataUrlToFile(dataUrl, filename = 'optimized_product_photo.jpg') {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Scan for any user-uploaded catalog image preview currently in the draft form
   */
  function findCurrentDraftImage() {
    const imgs = Array.from(document.querySelectorAll('img'));
    for (const img of imgs) {
      const src = img.currentSrc || img.src || '';
      if (!src || src.startsWith('data:image/svg') || src.includes('.svg')) continue;

      // Skip logos, guidelines, avatars
      const srcLower = src.toLowerCase();
      const altLower = (img.alt || '').toLowerCase();
      if (
        srcLower.includes('logo') || srcLower.includes('guide') || srcLower.includes('banner') ||
        altLower.includes('logo') || altLower.includes('guide')
      ) {
        continue;
      }

      // Check if image is in an upload slot / preview container
      const container = img.closest('[class*="upload" i], [class*="preview" i], [class*="image" i], [class*="photo" i]');
      if (container || (img.naturalWidth > 120 && img.naturalHeight > 120)) {
        return src;
      }
    }
    return null;
  }

  /**
   * Attach user-approved image file to Meesho's photo upload slot
   * NEVER alters weight, dimensions, or price!
   */
  function applyApprovedImage(payload) {
    const { dataUrl, filename = 'optimized_product_photo.jpg' } = payload || {};
    if (!dataUrl) throw new Error('No image provided.');

    const file = dataUrlToFile(dataUrl, filename);
    let attached = false;

    // 1. Locate file inputs (e.g. input[type="file"])
    const fileInputs = Array.from(
      document.querySelectorAll('input[type="file"][accept*="image"], input[type="file"]')
    );

    if (fileInputs.length > 0) {
      const dt = new DataTransfer();
      dt.items.add(file);

      // Target primary/first file input
      const targetInput = fileInputs[0];
      targetInput.files = dt.files;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      attached = true;
    }

    // 2. Dispatch synthetic drop event to dropzones
    const dropzones = Array.from(
      document.querySelectorAll('[class*="upload-box" i], [class*="dropzone" i], [class*="ant-upload-drag" i], [class*="upload" i]')
    );

    if (dropzones.length > 0) {
      const dt = new DataTransfer();
      dt.items.add(file);
      const dropEvt = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt
      });

      try {
        dropzones[0].dispatchEvent(dropEvt);
        attached = true;
      } catch (e) {
        console.warn('[Product Image Optimizer] Dropzone dispatch note:', e);
      }
    }

    // 3. Update preview thumbnails if present in the page
    const previewImgs = Array.from(
      document.querySelectorAll('[class*="preview" i] img, [class*="upload" i] img')
    );
    if (previewImgs.length > 0) {
      previewImgs[0].src = dataUrl;
    }

    // 4. Show friendly confirmation notification
    showOnPageToast('✓ Optimized 1:1 studio photo attached. Weight, dimensions, and prices remain untouched.');

    return {
      success: attached,
      filename
    };
  }

  /**
   * Non-intrusive on-page notification
   */
  function showOnPageToast(message) {
    let toast = document.getElementById('product-optimizer-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'product-optimizer-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0f172a;
        color: #f8fafc;
        padding: 14px 20px;
        border-radius: 10px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
        z-index: 99999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid #10b981;
        max-width: 480px;
      `;
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #34d399; flex-shrink: 0;"></div>
      <div style="flex: 1; line-height: 1.4;">${message}</div>
      <button id="product-optimizer-toast-close" style="background: transparent; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 2px;">✕</button>
    `;

    document.getElementById('product-optimizer-toast-close')?.addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      toast?.remove();
    }, 6000);
  }

  /**
   * Scan page text/DOM for displayed shipping or delivery charges on Meesho
   */
  function detectMeeshoShipping() {
    try {
      // 1. Check text nodes with shipping, delivery, or courier keywords
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const txt = node.textContent?.trim() || '';
        if (/shipping|delivery|courier/i.test(txt)) {
          const parent = node.parentElement;
          if (parent) {
            const fullText = parent.textContent || '';
            const match = fullText.match(/₹\s*(\d{2,4})|(\d{2,4})\s*₹/);
            if (match) {
              const val = parseInt(match[1] || match[2], 10);
              if (val >= 25 && val <= 350) return val;
            }
          }
        }
      }

      // 2. Check input fields or shipping summary elements
      const candidates = document.querySelectorAll('[class*="shipping" i], [class*="delivery" i], [data-testid*="shipping" i]');
      for (const el of candidates) {
        const txt = el.textContent || '';
        const m = txt.match(/₹?\s*(\d{2,4})/);
        if (m) {
          const val = parseInt(m[1], 10);
          if (val >= 25 && val <= 350) return val;
        }
      }
    } catch (e) {
      console.warn('[Product Image Optimizer] Shipping detection note:', e);
    }
    return null;
  }

  // Runtime message listener
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'PING') {
        sendResponse({ status: 'PONG', active: true, url: window.location.href });
        return true;
      }

      if (request.action === 'GET_PAGE_IMAGE') {
        const imageUrl = findCurrentDraftImage();
        sendResponse({ success: true, imageUrl });
        return true;
      }

      if (request.action === 'DETECT_SHIPPING') {
        const shippingCharge = detectMeeshoShipping();
        sendResponse({ success: true, shippingCharge });
        return true;
      }

      if (request.action === 'APPLY_APPROVED_IMAGE') {
        try {
          const result = applyApprovedImage(request.payload);
          sendResponse(result);
        } catch (err) {
          console.error('[Product Image Optimizer] Error applying image:', err);
          sendResponse({ success: false, error: err.message });
        }
        return true;
      }

      return true;
    });
  } catch (e) {
    console.error('[Product Image Optimizer] Listener registration note:', e);
  }
})();
