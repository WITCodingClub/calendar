chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('https://heron-selected-literally.ngrok-free.app/oauth/success')) {
    
    console.log('OAuth success page detected');
    
    try {
      await chrome.storage.local.set({
        oauth_status: 'success',
      });
      chrome.tabs.remove(tabId);
    } catch (error) {
      console.error('Error during authentication:', error);
    }
  }
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));