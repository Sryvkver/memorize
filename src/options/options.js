// Saves options to chrome.storage
function save_options() {
    let timeInterval = document.querySelector('.field.remindtime input').valueAsNumber;

    chrome.storage.sync.set({
        timeInterval: timeInterval,
    }, function () {
        // Update status to let user know options were saved.
        showNotification()
    });
}

/**
 * Structure
 * 
 * folders: [{name: The earth, description: test, questions: [{question: test?, answer: no}]}, {}]
 */

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        timeInterval: 300000,
        folders: []
    }, function (items) {
        console.log(items)
        document.querySelector('.field.remindtime input').valueAsNumber = items.timeInterval;

        for (let index = 0; index < items.folders.length; index++) {
            addFolderUI(items.folders[index])
        }
        //document.querySelector('.field.json textarea').value = JSON.stringify(items.anime, undefined, 4);
    });
}

let timeout = null;

function showNotification() {
    let allNots = document.querySelectorAll('.notification .delete');
    if (allNots.length > 0) {
        clearInterval(timeout);
        timeout = setTimeout(() => {
            allNots[allNots.length - 1].click();
        }, 2500);
        return;
    }

    let temp = document.getElementById('save-not-template');
    let clon = temp.content.cloneNode(true);
    document.body.appendChild(clon);

    allNots = document.querySelectorAll('.notification .delete');

    allNots[allNots.length - 1].addEventListener('click', () => {
        let ele = allNots[allNots.length - 1];
        let parent = ele.parentNode;
        parent.parentNode.removeChild(parent);
    })

    timeout = setTimeout(() => {
        allNots[allNots.length - 1].click();
    }, 2500);
}

async function addNewFolder() {
    let folderInfo = await showCreateModal().catch(err => {
        return;
    })
    if (!folderInfo || folderInfo.name == '' || folderInfo.description == '')
        return

    console.log(folderInfo);
    let folder = await config.createFolder(folderInfo.name, folderInfo.description);
    addFolderUI(folder);
}

async function addFolderUI(folder){
    let folderSection = document.querySelector('.field.folders');
    let template = document.getElementById('folder-template').content;
    let collumns = folderSection.querySelector('.columns:last-child');
    if (!collumns || collumns.children.length % 4 == 0) {
        //add new collumn
        collumns = document.createElement('div');
        collumns.classList.add('columns');
        collumns.classList.add('is-desktop');
        collumns.style.margin = 0;
        collumns.style.marginBottom = '10px';
        folderSection.appendChild(collumns);
    }
    let clon = template.cloneNode(true);
    clon.querySelector('.title').innerText = folder.name;
    clon.querySelector('.subtitle').innerText = folder.description;

    let btns = clon.querySelectorAll('.card-footer-item a');
    //Edit
    btns[0].onclick = () => {
        let url = document.location.href;
        let splits = url.split('/');
        splits[splits.length-1] = 'questions.html?index=' + folder.index;
        url = splits.join('/');
        document.location.href = url;
    }
    //Delete
    btns[1].onclick = async () => {
        await config.deleteFolder(folder.index);
        document.querySelectorAll('.field.folders .columns').forEach(ele => {
            ele.parentElement.removeChild(ele);
        })
        let allFolders = await config.getFolder();
        allFolders.forEach(async folder => {
            await addFolderUI(folder);
        })
    }
    collumns.appendChild(clon);
}

function showCreateModal() {
    return new Promise((res, rej) => {
        let createModal = document.getElementById('create-modal');
        createModal.classList.add('is-active');

        let btns = createModal.querySelectorAll('button');
        let nameEle = createModal.querySelector('.field.modal-name input');
        let descriptionEle = createModal.querySelector('.field.modal-description input');
        //Save
        btns[0].onclick = (() => {
            res({
                name: nameEle.value,
                description: descriptionEle.value
            });
            nameEle.value = '';
            descriptionEle.value = '';
            createModal.classList.remove('is-active');
        });
        //Cancel
        btns[1].onclick = (() => {
            rej('User pressed cancel');
            nameEle.value = '';
            descriptionEle.value = '';
            createModal.classList.remove('is-active');
        });
        //Add onclick to buttons with rej and res
    })
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('add_folder').addEventListener('click', addNewFolder);
document.getElementById('clear_data').addEventListener('click', config.clear);
document.querySelector('.field.remindtime input').addEventListener('change', save_options);
//document.querySelector('.field.login .button').addEventListener('click', login);