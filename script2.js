require('./views/script.js');
require('./validation.js');

const express = require('express')
const app = express();

// устанавливаем настройку(шаблонизатор) к нашему приложению -
// чекает папку views (там расширение .ejs)
app.set('view engine', 'ejs');
// npm i body-parser (позволить работать с формочками)
// тут указываем что мы будем использовать body-parser
app.use(express.urlencoded({extended: false}));
// создаём промежуточное ПО(функционал который встраивается в последующие функции)
// и в самом ejs файле меняем ссылку на css файл - как будто мы уже находимся
// в статической папке 'public'.
app.use(express.static('public'));

// зарегистрированные пользователи, которые могут быть авторизованы:
var users = [
  { username: 'admin', password: 'admin'},
  { username: 'viewer', password: 'viewer'}
];
// для валидации данных - регулярные выражения:
//var regular = [
//  { email: `^[-\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$`}
//];

// отслеживание (переход) главной страницы. Функция get позволяет отслеживать
// любые URL адреса (у меня здесь это / - главная страница).
app.get('/', (req, res) => { // req - запрашиваемый маршрут и т.д.( то что в кавычках)
    // вывод текста
    res.render('index')
});

// валидация данных в регистрации (ПОТОМ СДЕЛАТЬ HTML странички вместо недоступной alert)!!!
app.post('/validation', (req, res) => {
  if(/^[a-zA-Z-.]+@[a-z]+\.[a-z]{2,3}$/.test(req.body.email)
      && /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).*$/.test(req.body.password)
      && /^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$/.test(req.body.login)
      && req.body.password == req.body.passwordAgain)
    {
      console.log("The data was entered correctly, registration completed successfilly!");
    } else
    {
      console.log('Error validation of data');
    }
});

// передаём данные из формочек (обрабатываем именно post - данные)
// если по URL адресу /check-user переданы данные из формочки
app.post('/check-user', (req, res) => {
  var foundUser;
  // поиск пользователя в массиве users
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (u.username == req.body.username && u.password == req.body.password) {
        foundUser = u.username;
        break;
    }
  }
  if(foundUser !== undefined) {
    console.log(req.body);
    // настроить страницу после успешной авторизации пользователя
    // (без всплывающего окна + отредактировать header)
    app.get('/:foundUser', (req,res) => {
      console.log(foundUser);
      res.render('userSelect', {foundUser: req.params.foundUser}); //отобразит в /:foundUser хтмл файл, но не перейдёт в него
    });
    res.redirect('/' + foundUser); // изменяет адрес на маршрут /foundUser
  } else {
      console.log("Login failed: ", req.body.username);
      res.status(401).send('Login error / the data was entered incorrectly.');
      console.log(foundUser);
  }
    /*let username = req.body.username;
    if(username == "")
    {
      //переадресовываем пользователя на ...URL
        return res.redirect('/');
    } else {
        console.log(req.body);
        return res.redirect('/' + username);
    } */
});

// Передать в html-файл какие-либо функции, циклы, объекты и т.д.:
// app.get('/user/:username', (req, res) => {
//      res.render('user', *функция /* {username: req.params.username})
// });

const PORT = 3000;
//запуск сервера
app.listen(PORT, ()=> {
    console.log(`Server started: http://localhost:${PORT}`)
});

app.get('/:something', (req, res) => { // req - запрашиваемый маршрут и т.д.( то что в кавычках)
  // вывод текста
  res.send('No such page was found');
});





//
// РАБОТА С БД SQLite
//
/*
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(function() {

  db.run('CREATE TABLE lorem (info TEXT)');
  var stmt = db.prepare('INSERT INTO lorem VALUES (?)');

  for (var i = 0; i < 10; i++) {
    stmt.run('Ipsum ' + i);
  }

  stmt.finalize();

  db.each('SELECT rowid AS id, info FROM lorem', function(err, row) {
    console.log(row.id + ': ' + row.info);
  });
});

db.close(); */