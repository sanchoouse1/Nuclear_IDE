window.onload = function() {
    document.getElementById("firstCreatedFile").classList.add("active");
    let firstCreatedFile = document.getElementById("firstCreatedFile");
    let numStart = 1;
    firstCreatedFile.setAttribute("data-num", numStart);
    const textareaForCode = document.getElementById('code');                  // для функции сохранения
    const saveButton = document.getElementById('SaveButton');
    let createFileButton = document.getElementById('buttonCreateFile');
    const outputTextarea = document.getElementById("output-textarea");
    const resultCode = document.getElementById('resultCode');
    //let countFiles = localStorage.getItem('countFiles') || 1;
    const highlightedCode = document.getElementById("highlighted-code");
    const renameBtn = document.getElementById("RenameButton");
    const textareaNotes = document.getElementById('NotesTextarea');
    const NotesSaveButton = document.querySelector('#NotesSaveButton');


    console.log("usernameURL = " + usernameURL);


    // Реализация выгрузки всех файлов из БД
    fetch(`/${usernameURL}/upload`)
        .then(response => response.json())
        .then(data => {
            // Обработка полученных данных

            //Установка ранее выбранной цветовой темы:
            var select = document.querySelector("select[name='Color Theme']");
            var selectedValue = localStorage.getItem("color-theme");
            if (selectedValue) {
                select.value = selectedValue;
                var link = document.querySelector("link[rel='stylesheet']");
                link.setAttribute("type", "text/css");
                link.setAttribute("href", "/css/" + selectedValue + "UserSelected.css");
            }
            //Выгрузка текста в блокнот
            textareaNotes.value = localStorage.getItem('notes') || '';

            console.log('Произошла выгрузка файлов из базы данных.')
            data.forEach(elem => { // проходим по всем JSON объектам
            const files = JSON.parse(elem.filesInDB); // парсит каждый JSON-объект в объект JavaScript.
            Object.values(files).forEach(file => {
                // Создание элемента <div>
                if(file.name == 1) // если номер файла равен единице - то выгружаем содержимое только первого файла из БД
                {
                    const newName = localStorage.getItem(numStart);
                    if (newName) {
                        const element = document.querySelector(`[data-num="${numStart}"]`);
                        element.querySelector("p").textContent = newName + ".py";
                    }
                    console.log('происходит выгрузка первого файла: COUNTFILE = 1')
                    fetch(`/${usernameURL}/file/${numStart}`)
                    .then(response => response.text())
                    .then(data => {
                        console.log(`data = ${data}`);
                        textareaForCode.value = data;
                        highlightedCode.innerHTML = Prism.highlight(
                            textareaForCode.value,
                            Prism.languages.python,
                            "python"
                            );
                    })
                    .catch(error => console.log(error));
                } else { // иначе, если номер файла больше 1, то:
                    const fileOfDB = document.createElement('div'); // создаём div
                    fileOfDB.innerHTML = '<p>NewFile.py</p>'; // внутри дива абзац
                    console.log(`file.content = ${file.content}`);
                    console.log(`проверка номера файла ${file.name}`)
                    fileOfDB.setAttribute("id", "createdFile"); // присвоили атрибут id
                    fileOfDB.setAttribute("class", "new-element-class"); // присвоили класс
                    fileOfDB.setAttribute("data-num", file.name); // присвоили атрибут data-num (>= 2)

                    // не совсем понимаю зачем я это сюда всунул. Но работает. Потом разберусь ##################################################################################
                    fileOfDB.addEventListener("click", function(){
                        outputTextarea.value = "";
                        let activeButton = document.querySelector(".active");
                        activeButton.classList.remove("active");
                        this.classList.add("active");
                        let num = this.getAttribute("data-num"); // взял значение атрибута data-num и присвоили переменной
                        fetch(`/${usernameURL}/file/${num}`)
                            .then(response => response.text())
                            .then(data => {
                                console.log(`Нажатие на созданный файл, data = ${data}`);
                                textareaForCode.value = data;
                                highlightedCode.innerHTML = Prism.highlight(
                                    textareaForCode.value,
                                    Prism.languages.python,
                                    "python"
                                    );
                            })
                            .catch(error => console.log(error));
                        });
                    let parentNode = document.getElementById("files");
                    parentNode.appendChild(fileOfDB); // добавляем в хтмл
                    //countFiles++;
                    //console.log(`##################### countFiles инкремировалась и равна ${countFiles}`);
                    const newName = localStorage.getItem(file.name);
                    console.log(`file.name = ${file.name}`);
                    console.log(`newName = ${newName}`);
                    if (newName != null) {
                        const element = document.querySelector(`[data-num="${file.name}"]`);
                        console.log(`element = ${element}`);
                        if (element) {
                            element.querySelector("p").textContent = newName + ".py";
                        }
                    }
                }

            });
        });

    });






    // Добавление элемента при загрузке страницы
    // window.addEventListener("load", function() {
        
    // });

    textareaForCode.addEventListener("input", function() {
        highlightedCode.innerHTML = Prism.highlight(
          this.value,
          Prism.languages.python,
          "python"
        );
      });

      function adjustHighlightedCodeSize() {
        highlightedCode.style.width = `${textareaForCode.offsetWidth - 20}px`;
        highlightedCode.style.height = `${textareaForCode.offsetHeight - 19}px`;
      }

    adjustHighlightedCodeSize();
    window.addEventListener("resize", adjustHighlightedCodeSize);






    let countFiles = 1;
    fetch(`/getVariableCountFiles/${usernameURL}`)
    .then(response => response.json())
    .then(data => {
      countFiles = data.countFilesFromClient;
      console.log(`Перезагрузил страницу и получил countFiles равным ${countFiles}`);
      return countFiles;
    });




    // Реализация создания файлов и добавления их в базу данных
    createFileButton.addEventListener("click", createNewElement);
    function createNewElement() {
        // добавление новых файлов + становление активными.
            countFiles++;
            let newP = document.createElement("div");
            let activeButton = document.querySelector("#files .active");
            activeButton.classList.remove("active");
            newP.setAttribute("id", "createdFile");
            newP.setAttribute("class", "new-element-class")
            newP.classList.add("active");
            newP.innerHTML = '<p>NewFile.py</p>';
            newP.setAttribute("data-num", countFiles); // добавил атрибуту data-num номер файла
            console.log(`DEBUGGING.CREATEFILE FUNCTION: Я сейчас тут, на сервер передаю countFiles = ${countFiles}`)

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
                console.log(`ОБНОВЛЯЮ ЗНАЧЕНИЕ ПЕРЕМЕННОЙ COUNTFILES и заношу её равной ${countFiles} на сервере!`);
                //localStorage.setItem('countFiles', countFiles);
                fetch('/updateVariableCountFiles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                        },
                    body: JSON.stringify({ countFiles: countFiles, username: usernameURL })
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message);
                });
                textareaForCode.value = '';
                console.log("Создал файл, " + data)
                highlightedCode.innerHTML = Prism.highlight(
                    textareaForCode.value,
                    Prism.languages.python,
                    "python"
                    );
            })
            .catch(error => console.error(error));


            // Нажатие на созданный файл
            newP.addEventListener("click", function(){
                outputTextarea.value = "";
                let activeButton = document.querySelector(".active");
                activeButton.classList.remove("active");
                this.classList.add("active");
                let num = this.getAttribute("data-num"); // взял значение атрибута data-num и присвоили переменной
                fetch(`/${usernameURL}/file/${num}`)
                    .then(response => response.text())
                    .then(data => {
                        console.log(`Нажатие на созданный файл, data = ${data}`);
                        textareaForCode.value = data;
                        highlightedCode.innerHTML = Prism.highlight(
                            textareaForCode.value,
                            Prism.languages.python,
                            "python"
                            );
                    })
                    .catch(error => console.log(error));
            });
            let parentNode = document.getElementById("files");
            parentNode.appendChild(newP);
    }







    // взаимодействие с первым файлом(нажатие): первый файл всегда созданный - его сразу выгружаем из БД
    firstCreatedFile.addEventListener("click", function() {
        outputTextarea.value = "";
        let activeButton = document.querySelector("#files .active");
        activeButton.classList.remove("active");
        let num = 1;
        firstCreatedFile.classList.add("active");
        fetch(`/${usernameURL}/file/${num}`)
            .then(response => response.text())
            .then(data => {
                console.log(`data = ${data}`);
                textareaForCode.value = data;
                highlightedCode.innerHTML = Prism.highlight(
                    textareaForCode.value,
                    Prism.languages.python,
                    "python"
                    );
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
            // Запишите результат компиляции в textarea
            outputTextarea.value = response.result;
        })
        .catch(error => console.error('Error:', error));
    }





    const deleteButton = document.getElementById('DeleteButton');
    deleteButton.addEventListener("click", deleteFile);
    function deleteFile() {
        let activeButton = document.querySelector("#files .active");
        let numFile = activeButton.getAttribute("data-num");
        if (numFile === "1") {
            alert("Удаление стартового файла запрещено!");
            return;
        }
        fetch('/deleteFile', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({num: numFile, username: usernameURL})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
              console.log('File deleted successfully');
              let parentNode = document.getElementById("files");
              parentNode.removeChild(activeButton);
              firstCreatedFile.classList.add("active");
              fetch(`/${usernameURL}/file/${numStart}`)
                .then(response => response.text())
                .then(data => {
                    console.log(`data = ${data}`);
                    textareaForCode.value = data;
                    highlightedCode.innerHTML = Prism.highlight(
                        textareaForCode.value,
                        Prism.languages.python,
                        "python"
                        );
                })
                .catch(error => console.log(error));
            } else {
              console.error('Error deleting file');
            }
        });
    }



    document.getElementById("LogOut").addEventListener("click", function(event) {
        event.preventDefault();
        fetch(`/logout`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log(data);
            window.location.href = "/";
          })
          .catch(error => {
            console.error(error);
          });
      });




      // Переименование файлов:
    renameBtn.addEventListener("click", function() {
        let activeButton = document.querySelector("#files .active");
        let num = activeButton.getAttribute("data-num");
        const newName = prompt("Enter new file name: ");
        if (newName) {
            activeButton.querySelector("p").textContent = newName + ".py";
            localStorage.setItem(num, newName);
        }
    });


    // Изменение цветовых тем:
    document.querySelector("select[name='Color Theme']").addEventListener("change", function() {
        var selectedValue = this.value;
        localStorage.setItem("color-theme", selectedValue);
        var link = document.querySelector("link[rel='stylesheet']");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", "/css/" + selectedValue + "UserSelected.css");
    });


    // Сохранение текста из блокнота
    NotesSaveButton.addEventListener('click', function() {
        localStorage.setItem('notes', textareaNotes.value);
    });


}

