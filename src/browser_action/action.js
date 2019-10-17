async function main() {
    let allFolders = await config.getFolder();
    allFolders.forEach(folder => {
        addFolderUI(folder);
    });
}

let started = false;

/**
 * 
 * @param {Folder} folder The folder
 */
function addFolderUI(folder) {
    let folderHolder = document.querySelector('.folderHolder');
    let template = document.querySelector('#folder-template').content;

    folderHolder.classList.contains

    let clone = template.cloneNode(true);
    clone.querySelector('.card').setAttribute('data-index', folder.index);
    clone.querySelector('.title').innerHTML = folder.name;
    clone.querySelector('.subtitle').innerHTML = folder.description + `<br> <p><small>Questions: ${folder.questions.length}</small></p>`;

    folderHolder.appendChild(clone);

    let children = folderHolder.children;
    children[children.length-1].addEventListener('click', (ele) => {
        for (let index = 0; index < children.length; index++) {
            const element = children[index];
            element.classList.remove('selected');
        }

        for (let index = 0; index < ele.path.length; index++) {
            const element = ele.path[index];
            if(element.classList.contains('card')){
                element.classList.add('selected');
                break;
            }
        }
    });
}

function updateTextSize(ele) {
    let val = ele.target.valueAsNumber;

    document.querySelector('.folderHolder').style.fontSize = `${val}%`
    document.querySelector('.sliderHolder p').textContent = `${val}%`
}

function saveSize(ele) {
    console.log('SAVING', ele.target.valueAsNumber)
    config.setStorage('textSize', ele.target.valueAsNumber);
}

function restoreSize() {
    chrome.storage.sync.get({
        textSize: 85
    }, (items) => {
        document.querySelector('.slider').valueAsNumber = items.textSize;
        updateTextSize({
            target: document.querySelector('.slider')
        });
    })
}

function getStatus() {
    chrome.runtime.sendMessage({text: 'getStatus'}, function (response) {
        console.log(response.status);
        started = response.status;

        let startBTN = document.querySelector('#start');
        if(started){
            startBTN.classList.remove('is-success')
            startBTN.classList.add('is-danger');
            startBTN.textContent = 'Stop';
        }else{
            startBTN.classList.remove('is-danger')
            startBTN.classList.add('is-success');
            startBTN.textContent = 'Start';
        }
    });
}

async function startStop(){
    let startBTN = document.querySelector('#start');
    if(!started){
        let selectedFolder = document.querySelector('.card.selected');

        if(!selectedFolder)
            return;

        let folder = await config.getFolder(selectedFolder.getAttribute('data-index'));

        startBTN.classList.remove('is-success')
        startBTN.classList.add('is-danger');
        chrome.runtime.sendMessage({text: 'Start', folder: folder});
        startBTN.textContent = 'Stop';
    }else{
        startBTN.classList.remove('is-danger')
        startBTN.classList.add('is-success');
        chrome.runtime.sendMessage({text: 'Stop'});
        startBTN.textContent = 'Start';
    }
    started = !started;
}

main();

document.querySelector('#start').addEventListener('click', startStop);
document.querySelector('.slider').addEventListener('mousemove', updateTextSize)
document.querySelector('.slider').addEventListener('change', (ele) => {
    saveSize(ele);
    updateTextSize(ele)
})

document.addEventListener('DOMContentLoaded', () => {restoreSize(); getStatus();});