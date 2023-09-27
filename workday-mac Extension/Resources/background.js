if (navigator.userAgent.indexOf('Chrome') >= 0) {
  browser = chrome;
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
});
