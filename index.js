import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";

const app = express();
const PORT = 3000;
const HOST = "0.0.0.0";

const db = new pg.Client({
  host: "localhost",
  user: "postgres",
  password: "admin",
  database: "postgres",
});

db.connect();

const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log("Error with hashing password.", err);
        } else {
          await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [email, hash]
          );
          res.render("commands.ejs");
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const loginPassword = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const hashedPassword = user.password;
      bcrypt.compare(hashedPassword, loginPassword, (err, same) => {
        if (err) {
          res.send("Incorrect Password");
        } else {
          res.render("devices.ejs");
        }
      });
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/execute/:command", (req, res) => {
  const command = req.params.command;
  // Add your command execution logic here
  console.log(`Executing command: ${command}`);
  res.send(`Command ${command} executed`);
});

app.get("/devices/:devId", (req, res) => {
  const devices_ips = ["192.168.1.112", "192.168.1.15", "10.1.1.10"];
  const devId = req.params.devId;
  const devIp = devices_ips[devId - 1];
  res.render("commands.ejs", {
    devIp: devIp,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port "http://${HOST}:${PORT}/"`);
});
