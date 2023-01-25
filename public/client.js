console.log("Работает?");


window.onload = function() {



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
                    window.location.replace("/" + data.username + "/files") //redirect to userSelect
                    console.log('OK');
                    console.log(data.username);
                } else {
                    // do something if the server returned an error
                    alert('Error of login or password');
                }
            });
        });



    // Валидация
    const formValidation = document.querySelector('.js-form');
    const loginInputValidation = document.querySelector('input[name="login"]');
    const emailInputValidation = document.querySelector('input[name="email"]');
    const passwordInputValidation = document.querySelector('input[name="password"]');
    const passwordAgainInputValidation = document.querySelector('input[name="passwordAgain"]');

    formValidation.addEventListener('submit', event => {
        event.preventDefault();
        const login = loginInputValidation.value;
        const email = emailInputValidation.value;
        const password = passwordInputValidation.value;
        const passwordAgain = passwordAgainInputValidation.value;

        fetch('/validation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, email, password, passwordAgain })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Validation successful') {
                    console.log('Validation successful');
            } else {
                alert('Validation failed');
            }
        })
        .catch(error => console.error(error));
    });




    // Функция связки файлов для авторизации
    





}

// Валидация                v
// Авторизация              v
// Создание файлов          v
// Подсветка синтаксиса     x
// Компиляция файлов        x
// Заметки                  x





