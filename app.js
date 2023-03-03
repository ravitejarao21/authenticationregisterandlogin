const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "userData.db");
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server runs at 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initialize();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const checkusernamequery = `SELECT * FROM user WHERE username="${username}"`;
  const usernamecheck = await db.get(checkusernamequery);
  const hashedpassword = await bcrypt.hash(password, 10);

  if (usernamecheck === undefined) {
    //checkpasword
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const query = `INSERT INTO user (username,name,password,gender,location) 
        VALUES ("${username}","${name}","${hashedpassword}","${gender}","${location}")`;
      await db.run(query);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const checkusernamequery = `SELECT * FROM user WHERE username="${username}"`;
  const usernamecheck = await db.get(checkusernamequery);

  if (usernamecheck === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const ispasswordcorrect = await bcrypt.compare(
      password,
      usernamecheck.password
    );
    if (ispasswordcorrect) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getdetailsofuserquery = `SELECT * FROM user WHERE username="${username}"`;
  const detailsofuser = await db.get(getdetailsofuserquery);
  const isoldpasswordcorrect = await bcrypt.compare(
    oldPassword,
    detailsofuser.password
  );
  if (isoldpasswordcorrect) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedpassword = await bcrypt.hash(newPassword, 10);
      const query = `UPDATE  user SET password='${hashedpassword}' WHERE username = "${username}"`;
      await db.run(query);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
