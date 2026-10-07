/**
 * TrustCart AI - Background Service Worker (Manifest V3)
 */

import '../utils/scoring.js';
import '../utils/storage.js';

// Extension install / update lifecycle
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[TrustCart AI] Service Worker installed/updated. Reason:', details.reason);
  
  // Set default settings
  const existing = await chrome.storage.local.get(['trustcart_settings']);
  if (!existing.trustcart_settings) {
    await chrome.storage.local.set({
      trustcart_settings: {
        apiEndpoint: 'http://localhost:3000/api/analyze',
        autoScan: false,
        notifications: true,
        demoMode: false
      }
    });
  }

  // Set action badge
  chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
});

// Optional Sidepanel enabling on action click
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
}

// Background message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_SIDEPANEL') {
    if (sender.tab && sender.tab.id && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => {
        sendResponse({ success: true });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }
  }

  if (message.action === 'UPDATE_BADGE') {
    const score = message.score;
    const tabId = sender.tab ? sender.tab.id : undefined;
    if (score != null) {
      const text = String(score);
      const color = score >= 80 ? '#10b981' : (score >= 60 ? '#f59e0b' : '#ef4444');
      chrome.action.setBadgeText({ text, tabId });
      chrome.action.setBadgeBackgroundColor({ color, tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
    sendResponse({ success: true });
    return true;
  }
});
