// Function to fetch the active tab's URL
async function getActiveTabUrl() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getActiveTabUrl" }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError));
            } else {
                resolve(response.url);
            }
        });
    });
}

// Listen for a specific message from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "warnUser") {
        alert(message.warning); // Display a warning message to the user
    }
});

// Optional: You can add functionality to warn users about unsafe sites
const unsafeSites = ["example.com", "malicious-site.com"]; // Add your unsafe sites here

// Check the current page URL against unsafe sites
const currentUrl = window.location.href;
if (unsafeSites.some(site => currentUrl.includes(site))) {
    chrome.runtime.sendMessage({ action: "warnUser", warning: "You are visiting an unsafe site!" });
}
