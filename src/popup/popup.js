async function setQuestionStuff() {
    let params = document.location.href.split('?')[1].split('&');
    let folderIndex = -1;
    let questionIndex = -1;

    params.forEach(para => {
        let key = para.split('=')[0];
        let val = para.split('=')[1];

        if (key == 'F')
            folderIndex = val;
        else if (key == 'Q')
            questionIndex = val;
    })

    let folder = await config.getFolder(folderIndex);
    let question = folder.questions[questionIndex];

    document.querySelector('.title').textContent = question.name;
    document.querySelector('.subtitle').textContent = question.additional;
    question.images.forEach((image, index) => {
        let img = document.createElement('img');
        img.src = image;
        if (index != question.images.length - 1) {
            img.style.marginRight = `10px`;
        }
        if (question.images.length > 1)
            img.style.width = `calc(${100/question.images.length}% - ${10*(question.images.length-1)/question.images.length}px)`

        document.querySelector('.card-content').insertBefore(img, document.querySelector('input'));
    })
}

function submitAnswer(canceld = false) {
    let answer = document.querySelector('input').value;

    chrome.runtime.getBackgroundPage(function (bgWindow) {
        bgWindow.checkAnswer(answer, canceld);
        window.close(); // Close dialog
    });
}

document.addEventListener('DOMContentLoaded', setQuestionStuff);
document.querySelector('#save').addEventListener('click', () => submitAnswer());
document.querySelector('#cancel').addEventListener('click', () => submitAnswer(true));