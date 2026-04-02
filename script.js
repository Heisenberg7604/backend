const bcrypt = require("bcrypt");

const password = "jpeljaiko1854#";
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log(hash);
});