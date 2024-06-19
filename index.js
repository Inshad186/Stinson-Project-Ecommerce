
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/Stingson")
.then(()=>{
    console.log('connection successfull')
})
require("dotenv").config({path:'./.env'})

const nocache = require("nocache")
const session = require("express-session");
const express = require("express");
const app = express();
const path = require("path");
const cookieparser = require("cookie-parser")
const morgan = require('morgan')

// app.use(morgan('tiny'))

app.use(session({
    secret: process.env.SESSION_KEY, 
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly:true , secure:false , sameSite:"strict" }
  }));


  app.use(express.static('public'))
  const utilsPath = path.join(__dirname,'/utils')
  app.use(express.static(utilsPath))
  app.use(nocache())

app.set("view engine","ejs")
app.set("views","./views")


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieparser())


const userRouter = require("./routes/userRoute");
app.use("/",userRouter);

const adminRouter = require("./routes/adminRoute");
app.use("/admin",adminRouter);

app.all("*",(req,res)=>{
  res.render("users/error-404")
})

const port = 3002;
app.listen(port, () => console.log("server is running on http://localhost:3002"));

