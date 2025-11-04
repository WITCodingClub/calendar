chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('heron-selected-literally.ngrok-free.app/oauth/success')) {
    
    console.log('OAuth success page detected');
    
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: extractAuthData
      });
      
      if (results && results[0]?.result) {
        const { token, user } = results[0].result;
        
        if (token && user) {
          await chrome.storage.local.set({
            oauth_status: 'success',
          });
          
          console.log('Authentication successful!');
          
          setTimeout(() => {
            chrome.tabs.remove(tabId);
          }, 1000);
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