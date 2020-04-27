const md5 = require("md5");
// 傻白甜式密码。  盐料。颜料。 ele.com
const passWord = "789789"+"(*^(*&^(*&)";
console.log(md5(passWord));