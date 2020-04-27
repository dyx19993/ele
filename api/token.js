const jwt = require('jwt-simple');
const key = "%^^*(&(*^";
const token = jwt.encode({
    adminName:"daiyuanxi",
    createTime:Date.now()-1*60*1000
},key);
const dai=jwt.decode(token,key);
console.log(token,dai)
const nowTime = Date.now();

if((nowTime - dai.createTime)>1*60*1000){
    console.log("令牌可以继续使用")
}else{
    console.log("令牌过期了")
}