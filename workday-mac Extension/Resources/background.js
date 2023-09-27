(() => {
  const isChrome = (navigator.userAgent.indexOf('Chrome') >= 0);
  if (isChrome) {
    browser = chrome;
  }
  
  if (isChrome) {
    browser.action.setIcon({
      path: {
        "16": "images/toolbar-icon-16-colored.png",
        "19": "images/toolbar-icon-19-colored.png",
        "32": "images/toolbar-icon-32-colored.png",
        "38": "images/toolbar-icon-38-colored.png",
        "48": "images/toolbar-icon-48-colored.png",
        "72": "images/toolbar-icon-72-colored.png"
      },
    });
  }

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`Unknown request: ${request} ${sender}`);
    return true;
 });
}) ();
