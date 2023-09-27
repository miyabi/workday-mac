(() => {
  const isChrome = (navigator.userAgent.indexOf('Chrome') >= 0);
  if (isChrome) {
    window.browser = window.chrome;
  }

  const config = {
    dateRangeSelector: 'h2.WJIE',
    calendarSelector: 'div.WG13[role=application]',
    cellSelector: 'div[role=cell]',
    cellPattern: '^calendarDateCell-(\\d+)-(\\d+)$',
    popupSelector: 'div.WCU[role=dialog]',
    inputSelector: 'input[type=text]',
    okButtonSelector: 'button[title=OK]',
    waitingTimeUntilPopupOpens: 3500,
    waitingTimeUntilSubmissionCompletes: 3500,
    updatingMessagePrefixes: [
      '&#x2615;',  // ☕
      '&#x1F32D;', // 🌭
      '&#x1F32E;', // 🌮
      '&#x1F32F;', // 🌯
      '&#x1F354;', // 🍔
      '&#x1F355;', // 🍕
      '&#x1F359;', // 🍙
      '&#x1F369;', // 🍩
      '&#x1F36A;', // 🍪
      '&#x1F370;', // 🍰
      '&#x1F375;', // 🍵
      '&#x1F379;', // 🍹
      '&#x1F37A;', // 🍺
      '&#x1F95E;', // 🥞
      '&#x1F964;', // 🥤
      '&#x1F9C1;', // 🧁
      '&#x1F9C9;', // 🧉
      '&#x1F9CB;', // 🧋
      '&#x1FAD6;', // 🫖
    ],
  };
  
  const mouseDownEvent = new MouseEvent('mousedown', { view: window, bubbles: true });
  const mouseUpEvent = new MouseEvent('mouseup', { view: window, bubbles: true });
  const focusEvent = new Event('focus');
  const blurEvent = new Event('blur');
  
  function onUpdate(busy, message) {
    browser.runtime.sendMessage({type: 'onUpdate', busy, message});
  }
  
  function wait(milliseconds) {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }
  
  function timeToNumber(time) {
    return parseInt(time.replace(':', ''));
  }
  
  function randomUpdatingMessagePrefix() {
    return config.updatingMessagePrefixes[Math.floor(Math.random() * (config.updatingMessagePrefixes.length - 1))];
  }
  
  function getDateRange() {
    return document.querySelector(config.dateRangeSelector).textContent;
  }
  
  function getYearAndMonth(dateRange) {
    const [month, year] = dateRange.split(' ');
    const date = new Date(`1 ${month}, ${year}`);
    return [date.getFullYear(), date.getMonth() + 1];
  }
  
  function getCalendar() {
    return document.querySelector(config.calendarSelector);
  }
  
  function getCells(calendar) {
    const regexp = new RegExp(config.cellPattern);
    const [, month] = getYearAndMonth(getDateRange());
    const monthString = String(month - 1);
    
    const result = {};
    calendar.querySelectorAll(config.cellSelector).forEach((cell) => {
      const matches = cell.getAttribute('data-automation-id').match(regexp);
      if (matches[1] === monthString) {
        result[matches[2]] = cell;
      }
    });
    return result;
  }
  
  function clickCell(cell) {
    cell.dispatchEvent(mouseDownEvent);
    cell.dispatchEvent(mouseUpEvent);
  }
  
  function getPopup() {
    return document.querySelector(config.popupSelector);
  }
  
  function getInputs(popup) {
    return popup.querySelectorAll(config.inputSelector);
  }
  
  function getOkButton(popup) {
    return popup.querySelector(config.okButtonSelector);
  }
  
  function enterTime(input, time) {
    input.dispatchEvent(focusEvent);
    input.value = time;
    input.dispatchEvent(blurEvent);
  }
  
  function enterAndSubmitTime(inTime, outTime) {
    const popup = getPopup();
    if (!popup) {
      return false;
    }

    const [inInput, outInput] = getInputs(popup);
    if (!inInput || !outInput) {
      return false;
    }

    enterTime(inInput, inTime);
    enterTime(outInput, outTime);

    const okButton = getOkButton(popup);
    if (!okButton) {
      return false;
    }

    okButton.click();
    return true;
  }
  
  function getSheetName() {
    try {
      const [year, month] = getYearAndMonth(getDateRange());
      return `${year}/${String(month).padStart(2, '0')}`;
    } catch (e) {
      console.log(e);
      window.alert('Go to Entry Time page.');
      return null;
    }
  }

  async function fetchSpreadsheetContents(webAppUrl, spreadsheetId, year, month) {
    try {
      const url = `${webAppUrl}?mode=get&spreadsheetId=${spreadsheetId}&year=${year}&month=${month}`
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        const {error} = data;
        console.log(data);
        window.alert(`Failed to fetch data from spreadsheet.\nError: ${error.code} ${error.message}`);
        return null;
      }
      
      return data;
    } catch (e) {
      console.log(e);
      window.alert('Failed to fetch data from spreadsheet.');
      return null;
    }
  }
  
  function getTimeData(data) {
    try {
      const dayRegexp = /^\d+$/;
      const timeRegexp = /^\d{1,2}:\d{2}$/;
      
      return data.values.reduce((accumulator, row) => {
        const [day, , startTime, endTime] = row;
        if (dayRegexp.exec(day) !== null && timeRegexp.exec(startTime) !== null && timeRegexp.exec(endTime) !== null) {
          accumulator.push({day, startTime, endTime});
        }
        return accumulator;
      }, []);
    } catch (e) {
      console.log(e);
      window.alert('Failed to extract time data.');
      return null;
    }
  }
  
  async function enterAndSubmitTimeForDay(day, inTime, outTime, waitingTimeAdjustment) {
    try {
      const prefix = randomUpdatingMessagePrefix();
      const progress = `Day:${day} In:${inTime} Out:${outTime}`;
      onUpdate(true, `${prefix} Entering time...<br />${progress}`);

      var cells = getCells(getCalendar());
      if (cells[day]) {
        clickCell(cells[day]);
        await wait(config.waitingTimeUntilPopupOpens + waitingTimeAdjustment);
        if (enterAndSubmitTime(inTime, outTime)) {
          await wait(config.waitingTimeUntilSubmissionCompletes + waitingTimeAdjustment);
          return [true];
        }
      }

      return [false, progress];
    } catch (e) {
      console.log(e);
      return [false, progress];
    }
  }

  async function fetchAndEnterTime(webAppUrl, spreadsheetId, breakStartTime, breakEndTime, waitingTimeAdjustment) {
    let year, month;

    try {
      [year, month] = getYearAndMonth(getDateRange());
    } catch (e) {
      console.log(e);
      onUpdate(false);
      window.alert('Go to Entry Time page.');
      return;
    }

    onUpdate(true, 'Fetching data from spreadsheet...');
    
    const data = await fetchSpreadsheetContents(webAppUrl, spreadsheetId, year, month);
    if (data === null) {
      onUpdate(false);
      return;
    }
    
    const timeData = getTimeData(data);
    if (timeData === null) {
      onUpdate(false);
      return;
    }
    
    const errors = [];
    
    for (var i=0; i<timeData.length; i++) {
      const {day, startTime, endTime} = timeData[i];

      if (timeToNumber(startTime) < timeToNumber(breakStartTime) &&
          timeToNumber(endTime) > timeToNumber(breakEndTime)) {
        let [success, error] = await enterAndSubmitTimeForDay(day, startTime, breakStartTime, waitingTimeAdjustment);
        if (error !== undefined) {
          // Failed
          errors.push(error);
        }
  
        [success, error] = await enterAndSubmitTimeForDay(day, breakEndTime, endTime, waitingTimeAdjustment);
        if (error !== undefined) {
          // Failed
          errors.push(error);
        }
      } else {
        const [success, error] = await enterAndSubmitTimeForDay(day, startTime, endTime, waitingTimeAdjustment);
        if (error !== undefined) {
          // Failed
          errors.push(error);
        }
      }
    }
    
    onUpdate(false);

    let message;
    if (errors.length === 0) {
      message = '✅ Complete!';
    } else {
      const combinedErrors = errors.join('\n');
      message = `⚠️ Could not enter for some days.\n${combinedErrors}`;
    }
    window.alert(message);
  }
  
  browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'onEnterTimeButtonClicked') {
      const {webAppUrl, spreadsheetId, breakStartTime, breakEndTime, waitingTimeAdjustment} = request;
      await fetchAndEnterTime(webAppUrl, spreadsheetId, breakStartTime, breakEndTime, parseInt(waitingTimeAdjustment));
      return true;
    }
    
    console.log(`Unknown request: ${request} ${sender}`);
    return true;
  });
}) ();
