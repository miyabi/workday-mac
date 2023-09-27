(() => {
  const isChrome = (navigator.userAgent.indexOf('Chrome') >= 0);
  if (isChrome) {
    window.browser = window.chrome;
  }

  const config = {
    workdayUrl: 'https://www.myworkday.com/unitytech/d/home.htmld',
  };
  
  function getMainContentElement() {
    return document.getElementById('main');
  }
  
  function getLoadingContentElement() {
    return document.getElementById('loading');
  }
  
  function getSpreadsheetIdElement() {
    return document.getElementById('spreadsheet-id');
  }
  
  function getWebAppUrlElement() {
    return document.getElementById('web-app-url');
  }
  
  function getBreakStartTimeElement() {
    return document.getElementById('break-start-time');
  }
  
  function getBreakEndTimeElement() {
    return document.getElementById('break-end-time');
  }
  
  function getWaitingTimeAdjustmentElement() {
    return document.getElementById('waiting-time-adjustment');
  }
  
  function getOpenSpreadsheetButton() {
    return document.getElementById('open-spreadsheet-button');
  }

  function displayMainContent() {
    getMainContentElement().style.display = 'block';
    getLoadingContentElement().style.display = 'none';
  }
  
  function displayLoadingContent() {
    getMainContentElement().style.display = 'none';
    getLoadingContentElement().style.display = 'block';
  }
  
  async function initialize() {
    const values = await browser.storage.local.get({
      spreadsheetId: '',
      webAppUrl: '',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      waitingTimeAdjustment: '0',
    });
    
    const spreadsheetIdElement = getSpreadsheetIdElement();
    spreadsheetIdElement.value = values.spreadsheetId;
    spreadsheetIdElement.addEventListener('change', onSpreadsheetIdChanged);
    
    const webAppUrlElement = getWebAppUrlElement();
    webAppUrlElement.value = values.webAppUrl;
    webAppUrlElement.addEventListener('change', onWebAppUrlChanged);
    
    const breakStartTimeElement = getBreakStartTimeElement();
    breakStartTimeElement.value = values.breakStartTime;
    breakStartTimeElement.addEventListener('change', onBreakStartTimeChanged);
    
    const breakEndTimeElement = getBreakEndTimeElement();
    breakEndTimeElement.value = values.breakEndTime;
    breakEndTimeElement.addEventListener('change', onBreakEndTimeChanged);
    
    const waitingTimeAdjustmentElement = getWaitingTimeAdjustmentElement();
    waitingTimeAdjustmentElement.value = values.waitingTimeAdjustment;
    waitingTimeAdjustmentElement.addEventListener('change', onWaitingTimeAdjustmentChanged);

    document.getElementById('enter-time-button').addEventListener('click', onEnterTimeButtonClicked);
    document.getElementById('open-workday-button').addEventListener('click', onOpenWorkdayButtonClicked);
    getOpenSpreadsheetButton().addEventListener('click', onOpenSpreadsheetButtonClicked);
  }
  
  async function getActiveTab() {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    return tabs[0];
  }
  
  async function onSpreadsheetIdChanged(e) {
    const spreadsheetId = e.target.value;
    getOpenSpreadsheetButton().disabled = (spreadsheetId === '');
    await browser.storage.local.set({spreadsheetId});
  }
  
  async function onWebAppUrlChanged(e) {
    await browser.storage.local.set({webAppUrl: e.target.value});
  }
  
  async function onBreakStartTimeChanged(e) {
    await browser.storage.local.set({breakStartTime: e.target.value});
  }
  
  async function onBreakEndTimeChanged(e) {
    await browser.storage.local.set({breakEndTime: e.target.value});
  }
  
  async function onWaitingTimeAdjustmentChanged(e) {
    await browser.storage.local.set({waitingTimeAdjustment: e.target.value});
  }

  function onUpdate(busy, message) {
    if (!busy) {
      displayMainContent();
      return;
    }
    
    getLoadingContentElement().innerHTML = message;
    displayLoadingContent();
  }
  
  async function onEnterTimeButtonClicked(e) {
    const spreadsheetId = getSpreadsheetIdElement().value;
    const webAppUrl = getWebAppUrlElement().value;
    const breakStartTime = getBreakStartTimeElement().value;
    const breakEndTime = getBreakEndTimeElement().value;
    const waitingTimeAdjustment = getWaitingTimeAdjustmentElement().value;

    const activeTab = await getActiveTab();
    browser.tabs.sendMessage(activeTab.id, {
      type: 'onEnterTimeButtonClicked',
      spreadsheetId,
      webAppUrl,
      breakStartTime,
      breakEndTime,
      waitingTimeAdjustment,
    }).catch((e) => {
      console.log(e);
    });
  }
  
  function onOpenWorkdayButtonClicked() {
    browser.tabs.create({url: config.workdayUrl});
  }
  
  function onOpenSpreadsheetButtonClicked() {
    const spreadsheetId = getSpreadsheetIdElement().value;
    browser.tabs.create({url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`});
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
  });
  
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'onUpdate') {
      const {busy, message} = request;
      onUpdate(busy, message);
      return true;
    }
    
    console.log(`Unknown request: ${request} ${sender}`);
    return true;
  });
}) ();
