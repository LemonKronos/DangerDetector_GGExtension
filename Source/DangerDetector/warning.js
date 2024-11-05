document.getElementById('proceedButton').addEventListener('click', () => {
    // Send a request to get the captured redirect URLs
    chrome.runtime.sendMessage({ action: 'getCapturedRedirectUrls' }, (response) => {
      if (response && response.redirectUrls && response.redirectUrls.length > 0) {
        const redirectUrl = response.redirectUrls[0];  // Get the first captured URL
        console.log("Captured URL: ", redirectUrl);
        
        // Send a message to add this site to unRedirectableSites
        chrome.runtime.sendMessage({ action: 'addToUnRedirectableSites', url: redirectUrl }, (response) => {
          if (response && response.success) {
            console.log("Redirecting to: ", redirectUrl);
            window.location.href = redirectUrl;  // Perform the redirect to the original URL
          } else {
            console.error("Failed to add site to unRedirectableSites.");
          }
        });
      } else {
        console.error("No captured redirect URL found");
      }
    });
});

document.getElementById('goBackButton').addEventListener('click', () => {
    window.history.back();  // Navigate back to the previous page
});
