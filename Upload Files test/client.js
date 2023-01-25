/* Напиши код для файлов html, client.js (на языке JavaScript), server.js (на языке Node.JS), которые реализуют функцию загрузки содержимого
файлов (.cs, .c, .cpp и так далее) с компьютера на мой сайт в textarea. В html должна быть кнопка, которая открывает окно выбора файлов с компьютера,
в client.js данные передаются на сервер с помощью AJAX через fetchAPI на сервер, в случае ответа статуса 200 - заносит содержимое загруженного файла в textarea.
 На server.js проверяется валидность содержимого, либо проверка расширения загруженного файла, затем содержимое автоматически сохраняется
 в базу данных по имени пользователя. */

 function uploadFile() {
    const input = document.getElementById("file-input");
    const file = input.files[0];
    const formData = new FormData();
    formData.append("file", file);
  
    fetch("/upload", {
      method: "POST",
      body: formData
    })
      .then(response => {
        if (response.status === 200) {
          return response.text();
        }
        throw new Error("Failed to upload file");
      })
      .then(text => {
        document.getElementById("file-content").value = text;
      })
      .catch(error => {
        console.error(error);
      });
  }
  