console.log("Работает?");


window.onload = function() {
    console.log("Процесс создания файлов:");
    document.getElementById("firstCreatedFile").classList.add("active");
    let button = document.getElementById('buttonCreateFile');
    console.log(button);
    let countFiles = 2;

    button.addEventListener("click", createNewElement);
    function createNewElement() {
        console.log(countFiles);
        if (countFiles < 11)
        {
            let newP = document.createElement("div");
            let activeButton = document.querySelector("#files .active");
            activeButton.classList.remove("active");
            newP.setAttribute("id", "createdFile");
            newP.setAttribute("class", "new-element-class")
            newP.classList.add("active");
            newP.innerHTML = `<p>file${countFiles}.cs</p>`;
            newP.addEventListener("click", function(){
                let activeButton = document.querySelector(".active");
                activeButton.classList.remove("active");
                this.classList.add("active");
            });
            let parentNode = document.getElementById("files");
            parentNode.appendChild(newP);
            countFiles++;
        }
    }

    let firstCreatedFile = document.getElementById("firstCreatedFile");
    firstCreatedFile.addEventListener("click", function() {
        let activeButton = document.querySelector("#files .active");
        activeButton.classList.remove("active");
        firstCreatedFile.classList.add("active");
    })



    // Авторизация
    let buttonAuthorization = document.getElementById('buttonAuthorization');
    let formAuthorization = document.querySelector("#formAuthorization");
    buttonAuthorization.addEventListener("click", (event) => {
            event.preventDefault(); // отменяет отправку формы по умолчанию, чтобы мы могли отправить запрос самостоятельно
            const formData = new FormData(formAuthorization); // создаем новый экземпляр FormData из элемента формы
            const username = formData.get("username");
            const password = formData.get("password");
            console.log("Пошла родная");
            // создаем объект для отправки с серверу
            const data = {username: username, password: password};
            // отправляем POST запрос с данными формы
            fetch("/check-user", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" }
            })
            .then((response) => {
                if (response.status === 200) {
                    // do something if the server returned a successful response
                    window.location.replace("/" + data.username) //redirect to userSelect
                    console.log('OK');
                    console.log(data.username);
                } else {
                    // do something if the server returned an error
                    alert('Error of login or password');
                }
            });
        });

}

// Валидация                v
// Авторизация              v
// Создание файлов          x
// Подсветка синтаксиса     x
// Компиляция файлов        x
// Заметки                  x





