import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const app = express();
const port = 8100;

//SETTING UP VIEW ENGINE

app.set("view engine", "ejs");

// MIDDLEWARES
app.use(express.static(path.join(path.resolve(), "public"))); // STATIC FILE SERVING
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//CONNECTING TO DATABASE ========================================================>

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "Backend",
  })
  .then(() => {
    console.log("database connected");
  })
  .catch((e) => {
    console.log(e);
  });

//SCHEMA AND  MODEL =======================================================================>

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// AUTHENTICATE FUNCTION ================================================================>

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "asdjhfjkhsdkj");

    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};

// ROUTES ====================================================================>

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});


// REGISTER ==============================================================>

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  
  if (user) return res.render("login");
  
  const hashedPassword = await bcrypt.hash(password, 10); // hashing the password

  user = await User.create({ name, email, password:hashedPassword });

  const token = jwt.sign({ _id: user._id }, "asdjhfjkhsdkj");
  
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000), //cookie expires after a minute
  });
  
  res.redirect("/");
});

// LOGIN ================================================================>

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) return res.redirect("/register");

  const isMatched = await bcrypt.compare(password, user.password); // authenticating password

  if (!isMatched) return res.render("login", { email,  message: "Incorrect password" });

  const token = jwt.sign({ _id: user._id }, "asdjhfjkhsdkj");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000), //cookie expires after a minute
  });

  res.redirect("/");
});

// LOGOUT ==================================================================>

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()), // cookie expires immediately
  });
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is Running at ${port}`);
});
