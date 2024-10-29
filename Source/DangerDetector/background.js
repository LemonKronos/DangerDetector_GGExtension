// List of blocked domains
const blockedDomains = ["example.com", "phishing.com"];

// Check if the domain is in the list
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    let url = new URL(details.url);
    if (blockedDomains.includes(url.hostname)) {
      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Warn if the domain is not official
chrome.webRequest.onCompleted.addListener(
  function(details) {
    let url = new URL(details.url);
    if (!url.hostname.endsWith("official.com")) {
      chrome.action.openPopup();
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [{
    id: 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "example.com",
      resourceTypes: ["main_frame"]
    }
  }],
  removeRuleIds: [1]
});
