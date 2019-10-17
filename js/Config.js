let config = {
    getFolder: (index) => {
        return getFolder(index);
    },
    createFolder: (name, description) => {
        return createFolder(name, description);
    },
    updateFolder: (index, newFolder) => {
        return updateFolder(index, newFolder);
    },
    deleteFolder: (index) => {
        return deleteFolder(index);
    },
    setStorage: (key, val) => {
        return new Promise((res, rej) => {
            chrome.storage.sync.set({
                [key]: val
            }, () => {
                console.log(key, val);
                res();
            })
        })
    },
    clear: () => {
        console.log('CLEARING!!')
        chrome.storage.sync.clear()
    }
}

/**
 * 
 * @param {String} name The folder name
 * @param {String} name The folder description
 */
function createFolder(name, description) {
    return new Promise(async (res, rej) => {
        let folders = await getFolder();
        let newFolder = new Folder(name, description, folders.length);
        folders.push(newFolder);
        await config.setStorage('folders', folders);
        res(newFolder);
    });
}

/**
 * 
 * @param {Number} index The folder index
 * @param {Folder} newFolder The new Folder object
 */
function updateFolder(index, newFolder) {
    return new Promise(async (res, rej) => {
        let folders = await getFolder();
        folders[index] = newFolder;
        await config.setStorage('folders', folders);
        res();
    });
}

/**
 * 
 * @param {Number} index The folder index
 */
function deleteFolder(index) {
    return new Promise(async (res, rej) => {
        let folders = await getFolder();
        console.log(folders);
        folders.splice(index, 1);

        folders.forEach((folder, index) => {
            folder.index = index;
        });
        await config.setStorage('folders', folders);
        res();
    });
}

/**
 * 
 * @param {Number} index The folder id, if not supplied returns all
 * @returns {Folder|Array<Folder>} The Folder
 */
function getFolder(index = -1) {
    return new Promise((res, rej) => {
        chrome.storage.sync.get({
            folders: []
        }, function (items) {
            if (index == -1) {
                res(items.folders);
                return;
            }

            if (!items.folders[index] || items.folders[index] == null) {
                rej();
                return;
            }

            res(items.folders[index]);
        });
    })
}

class Folder {
    constructor(name, description, index) {
        this.name = name;
        this.description = description;
        this.index = index;
        this.questions = [];

        this.addQuestion = (async(name, answer, images=[]) => {
            let question = new Question(name, answer, this.questions.length, images);
            this.questions.push(question);
    
            let folders = await getFolder();
            folders[this.index].questions = this.questions;
            await config.setStorage('folders', folders);
        })
    }
}

class Question {
    constructor(name, additional, answer, index, images=[]) {
        this.name = name;
        this.additional = additional;
        this.answer = answer;
        this.index = index;
        this.images = images;
    }
}