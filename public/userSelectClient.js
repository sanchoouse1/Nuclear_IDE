window.onload = function() {
    document.getElementById("firstCreatedFile").classList.add("active");
    let firstCreatedFile = document.getElementById("firstCreatedFile");
    let numStart = 1;
    firstCreatedFile.setAttribute("data-num", numStart);
    const textareaForCode = document.getElementById('code');                  // для функции сохранения
    const saveButton = document.getElementById('SaveButton');
    let createFileButton = document.getElementById('buttonCreateFile');
    let countFiles = 2;


    console.log("usernameURL = " + usernameURL);

    // Реализация выгрузки всех файлов из БД
    fetch(`/${usernameURL}/upload`)
        .then(response => response.json())
        .then(data => {
            // Обработка полученных данных
            console.log('Произошла выгрузка файлов из базы данных.')
            data.forEach(elem => { // проходим по всем JSON объектам
            const files = JSON.parse(elem.filesInDB); // парсит каждый JSON-объект в объект JavaScript.
            Object.values(files).forEach(file => {
                // Создание элемента <div>
                if(file.name == 1) // если номер файла равен единице - то выгружаем содержимое только первого файла из БД
                {
                    console.log('происходит выгрузка первого файла:')
                    fetch(`/${usernameURL}/file/${numStart}`)
                    .then(response => response.text())
                    .then(data => {
                        console.log(`data = ${data}`);
                        document.getElementById("code").value = data;
                    })
                    .catch(error => console.log(error));
                } else { // иначе, если номер файла больше 1, то:
                    const fileOfDB = document.createElement('div'); // создаём div
                    fileOfDB.innerHTML = '<p>NewFile.py</p>'; // внутри дива абзац
                    console.log(`file.content = ${file.content}`);
                    console.log(`проверка номера файла ${file.name}`)
                    fileOfDB.setAttribute("id", "createdFile"); // присвоили атрибут id
                    fileOfDB.setAttribute("class", "new-element-class"); // присвоили класс
                    fileOfDB.setAttribute("data-num", countFiles); // присвоили атрибут data-num (>= 2)

                    // не совсем понимаю зачем я это сюда всунул. Но работает. Потом разберусь ##################################################################################
                    fileOfDB.addEventListener("click", function(){
                        let activeButton = document.querySelector(".active");
                        activeButton.classList.remove("active");
                        this.classList.add("active");
                        let num = this.getAttribute("data-num"); // взял значение атрибута data-num и присвоили переменной
                        fetch(`/${usernameURL}/file/${num}`)
                            .then(response => response.text())
                            .then(data => {
                                console.log(`Нажатие на созданный файл, data = ${data}`);
                                document.getElementById("code").value = data;
                            })
                            .catch(error => console.log(error));
                        });
                    let parentNode = document.getElementById("files");
                    parentNode.appendChild(fileOfDB); // добавляем в хтмл
                    countFiles++;
                }

            });
        });

    });


    // // Реализация выгрузки стартового файла из БД с его содержимым
    // fetch(`/${usernameURL}/file/${numStart}`)
    //     .then(response => response.text())
    //     .then(data => {
    //         console.log(`data = ${data}`);
    //         document.getElementById("code").value = data;
    //     })
    //     .catch(error => console.log(error));


    // Реализация создания файлов и добавления их в базу данных
    createFileButton.addEventListener("click", createNewElement);
    function createNewElement() {
        // добавление новых файлов + становление активными.
            let newP = document.createElement("div");
            let activeButton = document.querySelector("#files .active");
            activeButton.classList.remove("active");
            newP.setAttribute("id", "createdFile");
            newP.setAttribute("class", "new-element-class")
            newP.classList.add("active");
            newP.innerHTML = '<p>NewFile.py</p>';
            newP.setAttribute("data-num", countFiles); // добавил атрибуту data-num номер файла


            // API создания файлов на сервере в БД.
            fetch('/add-file', {
                method: 'POST',
                body: JSON.stringify({
                    countFiles: countFiles, username: usernameURL
                  }),
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              .then(res => res.json())
              .then(data => {
                document.getElementById("code").value = '';
                console.log("Создал файл, " + data)
              })
              .catch(error => console.error(error));


            // Нажатие на созданный файл
            newP.addEventListener("click", function(){
                let activeButton = document.querySelector(".active");
                activeButton.classList.remove("active");
                this.classList.add("active");
                let num = this.getAttribute("data-num"); // взял значение атрибута data-num и присвоили переменной
                fetch(`/${usernameURL}/file/${num}`)
                    .then(response => response.text())
                    .then(data => {
                        console.log(`Нажатие на созданный файл, data = ${data}`);
                        document.getElementById("code").value = data;
                    })
                    .catch(error => console.log(error));
            });
            let parentNode = document.getElementById("files");
            parentNode.appendChild(newP);
            countFiles++;
    }

    // взаимодействие с первым файлом(нажатие): первый файл всегда созданный - его сразу выгружаем из БД
    firstCreatedFile.addEventListener("click", function() {
        let activeButton = document.querySelector("#files .active");
        activeButton.classList.remove("active");
        let num = 1;
        firstCreatedFile.classList.add("active");
        fetch(`/${usernameURL}/file/${num}`)
            .then(response => response.text())
            .then(data => {
                console.log(`data = ${data}`);
                document.getElementById("code").value = data;
            })
            .catch(error => console.log(error));
    })


    // Реализация сохранения содержимого в Базе данных:
    saveButton.addEventListener("click", () => {
        const codeTextareaContent = textareaForCode.value;
        let activeButton = document.querySelector("#files .active");
        let numFile = activeButton.getAttribute("data-num");
        console.log(`Содержимое файла: ${codeTextareaContent}`);
        const dataObject = {num: numFile, content: codeTextareaContent, username: usernameURL};
        fetch('/save-contentOfFile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataObject)
        })
        .then(response => response.json())
        .then(data => console.log('Success:', data))
        .catch(error => console.error('Error:', error));
    })


    const runButton = document.getElementById('RUN');
    runButton.addEventListener("click", compileCode);
    function compileCode() {
        var code = document.getElementById("code").value;
        //  Отправляем код на сервер для компиляции
        fetch('/compile', {
            method: 'POST',
            body: JSON.stringify({code: code}),
            headers:{ 'Content-Type': 'application/json' }
        })
        .then(res => res.json())
        .then(response => {
            console.log('Success:', JSON.stringify(response))
            // Получим элемент textarea для отображения результата
            const outputTextarea = document.getElementById("output-textarea");
            // Запишите результат компиляции в textarea
            outputTextarea.value = response.result;
        })
        .catch(error => console.error('Error:', error));
    }

}

