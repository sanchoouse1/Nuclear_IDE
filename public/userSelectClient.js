window.onload = function() {
    console.log("Процесс создания файлов:");
    document.getElementById("firstCreatedFile").classList.add("active");
    let button = document.getElementById('buttonCreateFile');
    console.log(button);
    let countFiles = 2;
    console.log("usernameURL = " + usernameURL);

    button.addEventListener("click", createNewElement);
    function createNewElement() {
        console.log(countFiles);
        // добавление новых файлов от 2 до 10, + становление активными.
        if (countFiles < 11)
        {
            let newP = document.createElement("div");
            let activeButton = document.querySelector("#files .active");
            activeButton.classList.remove("active");
            newP.setAttribute("id", "createdFile");
            newP.setAttribute("class", "new-element-class")
            newP.classList.add("active");
            newP.innerHTML = `<p>file${countFiles}.c</p>`;
            newP.setAttribute("data-num", countFiles); // добавил атрибуту data-num номер файла
            window.history.pushState({}, "", "/" + usernameURL + "/file/" + countFiles);
            newP.addEventListener("click", function(){
                let activeButton = document.querySelector(".active");
                activeButton.classList.remove("active");
                this.classList.add("active");
                let num = this.getAttribute("data-num"); // взял значение атрибута data-num и присвоили переменной
                window.history.pushState({}, "", "/" + usernameURL + "/file/" + num); // переадресация без перезагрузки страницы
            });
            let parentNode = document.getElementById("files");
            parentNode.appendChild(newP);
            countFiles++;
        }
    }
    // взаимодействие с первым файлом(нажатие):
    let firstCreatedFile = document.getElementById("firstCreatedFile");
    firstCreatedFile.addEventListener("click", function() {
        let activeButton = document.querySelector("#files .active");
        activeButton.classList.remove("active");
        firstCreatedFile.classList.add("active");
        window.history.pushState({}, "", "/" + usernameURL + "/file/1");
    })
}

