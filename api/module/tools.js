const jwt = require("jwt-simple");
const KEY = ")(*&)(*&)(*)((*&(*";
module.exports = {
    changeArr(arr,len=10){
        const arr2 = [];
        for(let i=0;i<arr.length;i+=len){
            arr2.push(arr.slice(i,i+len));
        }
        return arr2;
    },
    //获得验证码
    getRandom(min,max){
        return Math.floor(Math.random()*(max-min+1)+min);
    },
    //获得时间
    getNowTime() {
        var date = new Date();
        return date.getFullYear() + "-" +
            ((date.getMonth() + 1)).toString().padStart(2, 0) + "-" +
            (date.getDate()).toString().padStart(2, 0) + " " +
            (date.getHours()).toString().padStart(2, 0) + ":" +
            (date.getMinutes()).toString().padStart(2, 0) + ":" +
            (date.getSeconds()).toString().padStart(2, 0);
    },
    json(res, ok = -1, msg = "网络连接错误") {
        res.json({
            ok,
            msg
        })
    },
    // 生成token
    encode(payload){
        return jwt.encode({
            ...payload,
            ...{
                createTime:Date.now()
            }
        },KEY);
    },
    //解析token
    decode(token){
        try{
            const info = jwt.decode(token,KEY);
            // 10分钟过期
            const times = 60*60*1000;
            if((Date.now()-info.createTime)>times){
                return {
                    ok:2,
                    msg:"token过期啦"
                }
            }else{
                return {
                    ok:3,
                    msg:"token正常",
                    info
                }
            }
        }catch (e) {
            return {
                ok:1,// token解析失败
                msg:"token解析失败"
            }
        }
    },
    //删除图片
    async deletePic(picName){
        return new Promise((resolve,reject)=>{
            fs.unlink(path.resolve(__dirname,"../upload/"+picName),function (err) {
                if(err){
                    reject(1);// 1失败
                }else{
                    resolve(0);// 成功
                }
            })
        })
    },

}