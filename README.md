# 🚀 Meesho Less Shipping - 5 Variations & Shipping Fee Optimizer

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://its-sartaj.github.io/meesho-less-shiping/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-its--sartaj%2Fmeesho--less--shiping-blue?style=for-the-badge&logo=github)](https://github.com/its-sartaj/meesho-less-shiping)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-orange?style=for-the-badge&logo=googlechrome)](manifest.json)

> **Created & Maintained by [@its-sartaj](https://github.com/its-sartaj)**  
> **Live Web App URL:** [https://its-sartaj.github.io/meesho-less-shiping/](https://its-sartaj.github.io/meesho-less-shiping/)

---

## 📌 Overview

**Meesho Less Shipping** is an open-source tool and Manifest V3 Chrome Extension created to help e-commerce sellers empirically test whether their product catalog photograph framing, background, and whitespace affect Meesho's automated shipping fee calculation.

Often, Meesho's automated courier assignment algorithms quote a default shipping estimate of **₹80** if a photo contains excessive background clutter or an unoptimized bounding box. By testing **5 clean, studio-grade variations** with calibrated whitespace and framing ratios, sellers can empirically test if Meesho quotes lower shipping rates such as **₹45, ₹50, or ₹56**, saving up to **44% on courier charges**.

---

## 🌟 Key Features

- **🌐 Live Web App + 🧩 Chrome Extension**: Use directly in your browser without installation, or load the extension for 1-click Meesho tab sync and automated fee detection.
- **🖼️ 5 Smart Studio Variations**:
  1. **Variation 1 (Standard Pure White)**: 82% scale, crisp centering, `#FFFFFF` pure studio white backdrop with ground contact shadow.
  2. **Variation 2 (Soft Studio Vignette)**: 80% scale, daylight soft studio gradient (`#FFFFFF` to `#F1F5F9`) with grounded contact shadow.
  3. **Variation 3 (Tight Framing)**: 88% tight scale, maximizing visible product details, surface texture, and edges.
  4. **Variation 4 (Generous Whitespace)**: 74% relaxed scale, providing clean whitespace margins to test low bounding-box density.
  5. **Variation 5 (Warm Studio Matte)**: 84% scale on clean warm-white `#FAF9F6` backdrop with ground contact shadow.
- **🔒 100% Authentic Product Preservation**: Preserves true product proportions, colors, shape, and textures. Never artificially distorts or shrinks items.
- **⚡ Client-Side & Private**: All image processing runs 100% locally in your browser using HTML5 Canvas. No photos are ever uploaded to third-party servers.
- **📊 Empirical Shipping Fee Tracker & Savings Calculator**:
  - 1-Click quick recording chips (`[₹45] [₹50] [₹56] [₹80]`) and custom fee input.
  - Automatically ranks variations from lowest verified charge to highest verified charge.
  - Highlights winning variation with exact rupee and percentage savings (e.g. ₹80 → ₹45, saving ₹35 / -44%).
- **⚖️ Honest & Ethical**: Transparent reporting that changing an image alone does not guarantee lower shipping charges; all results reflect actual Meesho quotes.

---

## 🚀 Two Ways to Use

### Option 1: Live Web App (Zero Install)

Run the studio directly in your browser on mobile, tablet, or desktop:

👉 **[Launch Live Web Studio](https://its-sartaj.github.io/meesho-less-shiping/)**

1. Open the [Live Web App](https://its-sartaj.github.io/meesho-less-shiping/).
2. Drag and drop any raw product image (Apparel, Footwear, Jewelry, Electronics, Home & Kitchen, etc.).
3. The tool generates all 5 studio variations instantly.
4. Click **Download JPG** to get clean 1080×1080 high-resolution images.
5. Upload each variation to your Meesho draft listing to check the updated shipping rate.
6. Click the fee chips (`₹45`, `₹50`, `₹56`, `₹80`) to record the quoted shipping charge and view your savings ranking!

---

### Option 2: Chrome Extension (Developer Mode)

For seamless 1-click photo sync and shipping fee detection directly inside [supplier.meesho.com](https://supplier.meesho.com):

#### 1. Clone or Download Repository
```bash
git clone https://github.com/its-sartaj/meesho-less-shiping.git
```
*(Or click **Code** > **Download ZIP** on GitHub and extract the folder).*

#### 2. Load into Chrome / Edge / Brave
1. Open Google Chrome (or Edge / Brave) and go to:
   ```
   chrome://extensions
   ```
2. In the top-right corner, toggle **Developer mode** to **ON**.
3. In the top-left menu, click **Load unpacked**.
4. Select the folder containing `manifest.json`.
5. Pin the **Meesho Less Shipping** extension to your browser toolbar.

#### 3. Use on Meesho Supplier Panel
1. Open [supplier.meesho.com](https://supplier.meesho.com) and go to your catalog upload / draft page.
2. Click the extension icon.
3. Click **Detect Page Fee** to read the courier charge displayed on the page.
4. Click **Test on Meesho** to attach any variation directly to your draft photo slot!

---

## 📁 Repository Structure

```
meesho-less-shiping/
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions automated Pages deployment
├── icons/
│   ├── icon16.png            # Extension toolbar icon (16x16)
│   ├── icon48.png            # Extension management icon (48x48)
│   └── icon128.png           # Chrome Web Store & HiDPI icon (128x128)
├── background.js             # Manifest V3 service worker
├── content.js                # Safe Meesho draft interaction script
├── index.html                # Live Web App entry point (GitHub Pages)
├── manifest.json             # Manifest V3 configuration
├── popup.css                 # Responsive stylesheet (Web & Extension)
├── popup.html                # Chrome Extension popup interface
├── popup.js                  # Canvas generation & fee tracking logic
├── LICENSE                   # MIT License
└── README.md                 # Project documentation
```

---

## 🛡️ Ethics & Compliance

- **No Fraudulent Modification**: Never modifies package weights, dimensions, product descriptions, or listing prices.
- **No Auto-Publishing**: Never automatically submits catalogs or publishes listings.
- **Empirical Transparency**: If an image variation does not reduce shipping charges, the seller is informed honestly.

---

## 👨‍💻 Author & Credits

- **Author**: Sartaj ([@its-sartaj](https://github.com/its-sartaj))
- **Repository**: [https://github.com/its-sartaj/meesho-less-shiping](https://github.com/its-sartaj/meesho-less-shiping)
- **Live Link**: [https://its-sartaj.github.io/meesho-less-shiping/](https://its-sartaj.github.io/meesho-less-shiping/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) &copy; 2026 [its-sartaj](https://github.com/its-sartaj). Feel free to use, modify, and contribute!
