// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

let started = false;
let isShowing = false;
let timeBetween = 300000;
let lastAnswerd = -1;
let popupID = -1;
let questions = [];
let folderIndex = -1;

chrome.storage.onChanged.addListener(function(changes, area) {
  console.log(changes)
  if (area == "sync" && "timeInterval" in changes) {
      timeBetween = changes.timeInterval.newValue;
  }
});
chrome.storage.sync.get({
  timeInterval: 300000,
}, function (items) {
  timeBetween = items.timeInterval;
});

setInterval(() => {
  if (!isShowing && started && questions.length > 0 && new Date().getTime() >= lastAnswerd+timeBetween) {
    isShowing = true;
    createPopup(questions[0].index);
  }
}, 300);

function createPopup(questionindex){
  chrome.tabs.create({
    url: chrome.extension.getURL('src/popup/index.html') + `?F=${folderIndex}&Q=${questionindex}`,
    active: false
  }, function (tab) {
    // After the tab has been created, open a window to inject the tab
    chrome.windows.create({
      tabId: tab.id,
      type: 'popup',
      focused: true,
      width: 750,
      height: 500,
    }, (o) => {
      console.log(o);
      popupID = o.id;
    });
  });
}

function checkAnswer(answer, canceld) {
  console.log(answer,questions[0].answer, canceld, questions[0]);

  let options = {
    type: "basic",
    title: questions[0].name,
    message: answer + " is Correct!",
    iconUrl: chrome.runtime.getURL("icons/true.png"),
    silent: true
  }

  console.log(options)

  if(answer.toLowerCase() === questions[0].answer.toLowerCase()){
    console.log('Correct!');
    questions.splice(0,1);
    
  }else{
    console.log('Incorrect!');
    options.message = answer + " is Incorrect!\r\nThe Correct answer is " + questions[0].answer;
    options.iconUrl = chrome.runtime.getURL("icons/false.png");
    
    questions[questions.length] = questions[0];
    questions.splice(0,1);
  }
  console.log(options)
  chrome.notifications.create('answerNot' + +new Date(), options)
  //TODO Show Notification!


  isShowing = false;
  lastAnswerd = new Date().getTime();
  if(questions.length == 0)
    started = false;
}

chrome.windows.onRemoved.addListener((ev) => {
  if (ev == popupID) {
    isShowing = false;
    lastAnswerd = new Date().getTime();
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.text) {
    case 'Start': {
      started = true;
      folderIndex = request.folder.index;
      let questionAmount = request.folder.questions.length;
      questions = [];
      for (let index = 0; index < questionAmount; index++) {
        let question = request.folder.questions[index];
        questions.push({index: index, answer: question.answer, name: question.name});
      }
      questions.sort((a,b) => {
        return Math.random() - Math.random();
      })
      console.log(questions)
      break;
    }
    case 'Stop': {
      started = false;
      folderIndex = -1;
      chrome.windows.remove(popupID, () => {
        console.log("Removed", popupID)
      });
      break;
    }
    case 'getStatus': {
      sendResponse({
        status: started
      });
      break;
    }

    default:
      break;
  }
});