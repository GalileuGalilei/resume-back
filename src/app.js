require("dotenv").config();
const express = require('express');
const cookieParser = require('cookie-parser');
const router = require("./routes");
const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json())
app.use(cookieParser())
app.use(router);

//index.html in src/public
app.use(express.static('src/public'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});