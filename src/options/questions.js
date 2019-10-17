//TODO Refactor this file!!
//Its really badly written :/, But it works so meh

let _folderIndex = -1;

async function main() {
    let parasWhole = document.location.href.split('?')[1];
    let parasSplit = parasWhole.split('&');

    parasSplit.forEach(para => {
        let key = para.split('=')[0];
        let val = para.split('=')[1];
        if (key == 'index') {
            console.log('FOUND', val)
            _folderIndex = val;
            populate(val);
        }
    });

    let folder = await config.getFolder(_folderIndex);
    let title = document.querySelector('.title');
    let subtitle = document.querySelector('.subtitle');

    title.textContent = folder.name;
    subtitle.textContent = folder.description;
}

let isEditing = false;
async function editFolder(){
    let editBTN = document.getElementById('edit_folder');
    let title = document.querySelector('.title');
    let subtitle = document.querySelector('.subtitle');
    if(!isEditing){
        editBTN.classList.add('is-success');
        editBTN.querySelectorAll('span')[1].textContent = 'Save';
        title.contentEditable = 'true';
        subtitle.contentEditable = 'true';
        isEditing = true;
    }else{
        editBTN.classList.remove('is-success');
        editBTN.querySelectorAll('span')[1].textContent = 'Edit';
        title.contentEditable = 'false';
        subtitle.contentEditable = 'false';
        isEditing = false;

        let folder = await config.getFolder(_folderIndex);
        folder.name = title.textContent.replace(/↵/ig, '').trim();
        folder.description = subtitle.textContent.replace(/↵/ig, '').trim();
        await config.updateFolder(_folderIndex, folder);
    }
}

async function populate(index) {
    let folder = await config.getFolder(index);
    if (!folder)
        return;

    for (let index = 0; index < folder.questions.length; index++) {
        addQuestionUI(folder.questions[index]);
    }
}

async function addQuestion() {
    let folder = await config.getFolder(_folderIndex);
    let info = await showCreateQuestionModal();
    let question = new Question(info.name, info.answer, folder.questions.length, info.images);
    folder.questions.push(question);
    addQuestionUI(question);

    await config.updateFolder(_folderIndex, folder);
}

/**
 * 
 * @param {Question} question 
 */

async function addQuestionUI(question) {
    let folderSection = document.querySelector('.field.questions');
    let template = document.getElementById('card-template').content;
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
    clon.querySelector('.title').innerText = question.name;
    clon.querySelectorAll('.subtitle')[0].innerText = question.additional;
    clon.querySelectorAll('.subtitle')[1].innerText = question.answer;

    let btns = clon.querySelectorAll('.card-footer-item a');
    //Edit
    btns[0].onclick = async() => {
        let info = await showCreateQuestionModal(question).catch(err => {
        });

        if(!info)
            return;

        let tempINDEX = question.index;
        question = info;
        question.index = tempINDEX;

        let card = document.querySelectorAll('.card.question')[question.index];
        card.querySelector('.title').innerText = question.name;
        card.querySelectorAll('.subtitle')[0].innerText = question.additional;
        card.querySelectorAll('.subtitle')[1].innerText = question.answer;

        let folder = await config.getFolder(_folderIndex);
        folder.questions[question.index] = question;
        await config.updateFolder(_folderIndex, folder);

        document.querySelectorAll('.field.questions .columns.is-desktop').forEach(ele => {
            ele.parentElement.removeChild(ele);
        })
        for (let index = 0; index < folder.questions.length; index++) {
            addQuestionUI(folder.questions[index]);
        }
    }
    //Delete
    btns[1].onclick = async () => {
        let folder = await config.getFolder(_folderIndex);
        folder.questions.splice(question.index, 1);

        folder.questions.forEach((question, index) => {
            question.index = index;
        });
        await config.updateFolder(_folderIndex, folder)

        document.querySelectorAll('.field.questions .columns').forEach(ele => {
            ele.parentElement.removeChild(ele);
        })
        folder.questions.forEach(async question => {
            addQuestionUI(question);
        })
    }

    collumns.appendChild(clon);

    let allItems = collumns.querySelectorAll('.card.question');

    let amountOfImages = question.images.length;
    question.images.forEach((image, index) => {
        let img = document.createElement('img');
        img.src = image;
        if (index != amountOfImages - 1) {
            img.style.marginRight = `10px`;
        }
        if (amountOfImages > 1)
            img.style.width = `calc(${100/amountOfImages}% - ${10*(amountOfImages-1)/amountOfImages}px)`

        let children = allItems[allItems.length - 1].querySelector('.card-content').children;
        allItems[allItems.length - 1].querySelector('.card-content').insertBefore(img, children[children.length - 1])
    })
}

/**
 * 
 * @param {Question} question 
 */


async function showCreateQuestionModal(question = null) {
    return new Promise((res, rej) => {
        let createModal = document.getElementById('create_edit');
        createModal.classList.add('is-active');

        let btns = createModal.querySelectorAll('button');
        let nameEle = createModal.querySelector('.field.modal-name input');
        let addEle = createModal.querySelector('.field.modal-add textarea');
        let answerEle = createModal.querySelector('.field.modal-answer input');
        let imageEle = createModal.querySelector('.field.modal-image');
        let images = [];

        if(question != null){
            nameEle.value = question.name;
            addEle.value = question.additional;
            answerEle.value = question.answer;
            question.images.forEach((image, index) => {
                let img = document.createElement('img');
                img.src = image;
                img.setAttribute('data-index', index)
                img.onclick = (ev) => {
                    images.splice(img.getAttribute('data-index'), 1);
                    let index = 0;
                    img.parentElement.querySelectorAll('img').forEach(image => {
                        if(image != img){
                            image.setAttribute('data-index', index++);
                        }
                    })
                    img.parentElement.removeChild(img);
                }
                imageEle.insertBefore(img, btns[0]);
                images.push(image);
            });
        }

        console.log(btns)
        //Add image
        btns[0].onclick = (() => {
            let url = prompt('Enter link url!');
            if (!url)
                return;

            let img = document.createElement('img');
            img.src = url;
            img.onclick = (ev) => {
                images.splice(img.getAttribute('data-index'), 1);
                let index = 0;
                img.parentElement.querySelectorAll('img').forEach(image => {
                    if(image != img){
                        image.setAttribute('data-index', index++);
                    }
                })
                img.parentElement.removeChild(img);
            }
            imageEle.insertBefore(img, btns[0]);
            images.push(url);
        });
        //Save
        btns[1].onclick = (() => {
            res({
                name: nameEle.value,
                additional: addEle.value,
                answer: answerEle.value,
                images: images,
            });
            nameEle.value = '';
            addEle.value = '';
            answerEle.value = '';
            imageEle.innerHTML = `<label class="label">Image</label><button class="button is-success">Add Image (max 3)</button>`
            createModal.classList.remove('is-active');
        });
        //Cancel
        btns[2].onclick = (() => {
            rej('User pressed cancel');
            nameEle.value = '';
            addEle.value = '';
            answerEle.value = '';
            imageEle.innerHTML = `<label class="label">Image</label><button class="button is-success">Add Image (max 3)</button>`
            createModal.classList.remove('is-active');
        });
        //Add onclick to buttons with rej and res
    })
}

main();

document.getElementById('add_question').addEventListener('click', addQuestion);
document.getElementById('edit_folder').addEventListener('click', editFolder);