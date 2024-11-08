// List of blocked domains
const blockedDomains = ["example.com", "phishing.com"];

// Warn if the domain is not official
const officialDomains = ["officialsite.com", "anotherofficialsite.com"];

// Check if the domain is in the list
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    let url = new URL(details.url);
    if (blockedDomains.includes(url.hostname)) {
      // Show a warning notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Warning',
        message: 'This site is unsafe!',
        buttons: [{ title: 'Dismiss' }],
        priority: 2
      });
      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

chrome.webRequest.onCompleted.addListener(
  function(details) {
    let url = new URL(details.url);
    if (!officialDomains.some(domain => url.hostname.endsWith(domain))) {
      // Show a warning notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Warning',
        message: 'This site may not be official.',
        buttons: [{ title: 'Dismiss' }],
        priority: 2
      });
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
  if (buttonIndex === 0) {
    chrome.notifications.clear(notificationId);
  }
});

// Manage network request blocking rules
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

// Monitor downloads and notify user
chrome.downloads.onCreated.addListener(function(downloadItem) {
  console.log('Download started:', downloadItem);
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon.png'),
    title: 'Download Started',
    message: `Downloading: ${downloadItem.filename}`,
    priority: 1
  });
});

chrome.downloads.onChanged.addListener(function(downloadDelta) {
  console.log('Download changed:', downloadDelta);
  if (downloadDelta.state && downloadDelta.state.current === 'complete') {
    chrome.downloads.search({id: downloadDelta.id}, function(results) {
      console.log('Download search results:', results);
      if (results.length > 0) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icon.png'),
          title: 'Download Complete',
          message: `Download finished: ${results[0].filename}`,
          priority: 1
        });
      }
    });
  }
});

chrome.notifications.create({
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon.png'),
  title: 'Download Started',
  message: `Downloading: ${downloadItem.filename}`,
  priority: 1
});
