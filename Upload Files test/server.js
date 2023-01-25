const express = require("express");
const multer = require("multer");
const cors = require("cors");
const validator = require("validator");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const user = req.body.user;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }
  if (!validator.isAlphanumeric(user)) {
    return res.status(400).send("Invalid user.");
  }
  if (!validator.isAscii(file.buffer.toString())) {
    return res.status(400).send("Invalid file content.");
  }

  const db = new sqlite3.Database("file_db.db");
  db.run(`INSERT INTO files(user, name, content) VALUES(?,?,?)`, [
    user,
    file.originalname,
    file.buffer.toString()
  ], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID}`);
  });
  db.close();

  res.status(200).send(file.buffer.toString());
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
