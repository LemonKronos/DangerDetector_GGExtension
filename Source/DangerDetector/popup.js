document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleButton');
  
    // Get the current state (enabled/disabled) from chrome.storage
    chrome.storage.local.get('enabled', function(data) {
      if (data.enabled) {
        toggleButton.textContent = 'Disable';
      } else {
        toggleButton.textContent = 'Enable';
      }
    });
  
    // Listen for button click to toggle state
    toggleButton.addEventListener('click', function() {
      chrome.storage.local.get('enabled', function(data) {
        const newState = !data.enabled;
        chrome.storage.local.set({ 'enabled': newState }, function() {
          // Update the button text based on the new state
          toggleButton.textContent = newState ? 'Disable' : 'Enable';
          
          // Send message to background.js to update the state
          chrome.runtime.sendMessage({ action: newState ? 'enable' : 'disable' });
        });
      });
    });
  });
  