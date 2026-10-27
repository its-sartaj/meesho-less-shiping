/**
 * Universal Product Image Optimizer - Background Service Worker (Manifest V3)
 * Handles extension lifecycle and message dispatching.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Universal Product Image Optimizer] Extension installed.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'PONG', timestamp: Date.now() });
    return true;
  }
  return false;
});
