const GOOGLE_ORIGIN = 'https://selfservice.wit.edu/';

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  
  if (url.origin === GOOGLE_ORIGIN) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'index.html',
      enabled: true
    });
  } else {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('/magic_link/verify')) {
    
    console.log('Magic link verification page detected');
    
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: extractAuthData
      });
      
      if (results && results[0]?.result) {
        const { token, user } = results[0].result;
        
        if (token && user) {
          await chrome.storage.local.set({
            jwt_token: token,
            user: user
          });
          
          console.log('Authentication successful!');
          
          setTimeout(() => {
            chrome.tabs.remove(tabId);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error during authentication:', error);
    }
  }
});

function extractAuthData() {
  const token = document.getElementById('jwt-token')?.value;
  const email = document.getElementById('user-email')?.value;
  const userId = document.getElementById('user-id')?.value;
  
  if (token && email && userId) {
    return {
      token: token,
      user: {
        id: userId,
        email: email
      }
    };
  }
  return null;
}

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));