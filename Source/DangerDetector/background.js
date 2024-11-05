const blockedSites = ['badsite.com', 'malicious.com'];
const unRedirectableSites = ['google.com', 'youtube.com', 'github.com', 'guthib.com'];

// Generator function for unique rule IDs
function* uniqueIdGenerator() {
  let id = 2;  // Start at 2 (ID = 1 is reserved for redirecting rules)
  while (true) {
    yield id++; // Yield the current ID and then increment it
  }
}

let redirectUrls = [];  // Store the URLs before redirecting them to the popup page

// Generate a new generator instance only once
const idGenerator = uniqueIdGenerator();

chrome.runtime.onInstalled.addListener(async () => {
  await removeExistingRules();  // Wait until the rules are removed
  await generateRules();  // Proceed to generate new rules after removal is done
  await showExistingRules();
});

async function removeExistingRules() {
  // Fetch all the dynamic rules
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  
  if (Array.isArray(rules)) {
    // If the result is an array, remove all the rules
    for (const rule of rules) {
      console.log("Removing Rule: ", rule);
      await removeRules([rule.id]);  // Wait until each rule is removed before proceeding
    }
  } else {
    console.error("Failed to fetch dynamic rules. The result is not an array.");
  }
}

async function generateRules() {
  // Create the universal redirecting rule (ID = 1)
  const rule = {
    id: 1,  // ID 1 is reserved for the universal redirecting rule
    priority: 1,
    action: { 
      type: 'redirect',
      redirect: {
        url: chrome.runtime.getURL('warning.html')
      }
    },
    condition: {
      urlFilter: '*',
      resourceTypes: ['main_frame']  // Block the main frame (page load)
    }
  };
  
  // Add the rule to the declarativeNetRequest rule set
  await updateRules({ addRules: [rule] });

  // Create rules for blocked sites, excluding unRedirectableSites
  for (site of blockedSites) {
    const blockingRuleId = idGenerator.next().value;
    await createBlockingRule(site, blockingRuleId);
  }

  // Create rules for unRedirectable sites that will be allowed
  for (site of unRedirectableSites) {
    const directingRuleId = idGenerator.next().value;
    await createNonDirectingRule(site, directingRuleId);
  }
}

// Function to update rules and handle the asynchronous operation properly
function updateRules(update) {
  return new Promise((resolve, reject) => {
    chrome.declarativeNetRequest.updateDynamicRules(update, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        resolve();
      }
    });
  });
}

// Function to create a blocking rule for a given URL substring
async function createBlockingRule(urlSubstring, ruleId) {
  const rule = {
    id: ruleId,
    priority: 2,
    action: { type: 'block' },
    condition: {
      urlFilter: urlSubstring,
      resourceTypes: ['main_frame']  // Block the main frame (page load)
    }
  };

  // Add the rule to the declarativeNetRequest rule set
  await updateRules({ addRules: [rule] });
  console.log(`Blocking rule added for: ${urlSubstring} with rule ID: ${ruleId}`);
}

// Function to create a non-blocking (allow) rule for a given URL substring
async function createNonDirectingRule(urlSubstring, ruleId) {
  const rule = {
    id: ruleId,
    priority: 2,
    action: { 
      type: 'allow',  // Allow the resource for these URLs
    },
    condition: {
      urlFilter: urlSubstring,
      resourceTypes: ['main_frame']  // Block the main frame (page load)
    }
  };

  // Add the rule to the declarativeNetRequest rule set
  await updateRules({ addRules: [rule] });
  console.log(`Allow rule added for: ${urlSubstring} with rule ID: ${ruleId}`);
}

// Wrapper for removing rules, which returns a Promise
function removeRules(ruleIds) {
  return new Promise((resolve, reject) => {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
    }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

async function showExistingRules() {
  // Now, after the rules have been removed and new ones are generated
  chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
    // Check if the rules are an array before iterating
    if (Array.isArray(rules)) {
      console.log("Existing Rule: ", rules);
    } else {
      console.error("Failed to fetch dynamic rules. The result is not an array.");
    }
  }).catch(error => {
    console.error("Error fetching dynamic rules: ", error);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);

  if (message.action === 'addToUnRedirectableSites') {
    const url = message.url;
    console.log(url);
    if (!unRedirectableSites.includes(url) && !blockedSites.includes(url)) {
      unRedirectableSites.push(url);
      const ruleId = idGenerator.next().value;
      createNonDirectingRule(url, ruleId);  // Add allow rule for unRedirectable sites
      console.log(`Site added to unRedirectableSites: ${url}`);
      sendResponse({ success: true });
    } else {
      console.log(`Site already in unRedirectableSites: ${url}`);
      sendResponse({ success: false });
    }
  }

  else if (message.action === 'getCapturedRedirectUrls') {
    sendResponse({ redirectUrls });
  }
  return true;
});


chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;

    // Capture the URL if it's not in the unRedirectableSites list
    if (!unRedirectableSites.some(site => url.includes(site)) && !blockedSites.some(site => url.includes(site))) {
      redirectUrls.push(url);  // Store the captured URL
      console.log("Captured list: ", redirectUrls);
    }
    else {
      redirectUrls = [];
    }
  },
  {
    urls: ["<all_urls>"],
  },
);
