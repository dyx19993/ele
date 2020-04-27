const express = require('express');
const bodyParser = require("body-parser");
const db = require("./module/db2")
const tools = require("./module/tools")
const mongodb = require("mongodb");
const path = require('path')
const app=express();
app.use(bodyParser.json());
app.use(express.static(__dirname+"/upload"))
app.use(express.static(path.resolve(__dirname,"../site/dist")))
//提交号码获取验证码
app.post("/sendCode",async (req,res)=>{
    try{
        const phoneCode = req.body.phoneCode
        //获得这个号码的数据库信息
        const codeIndo = await db.findOne("userCodeList",{phoneCode});
        //判断这号码数据库是否有值
        if(codeIndo){
            //有值验证code是否过期
            const time = Date.now() - codeIndo.sendTime;
            if(time>60*1000){
                const code = tools.getRandom(100000,999999);
                await db.updateOne("userCodeList",{phoneCode},{
                    $set:{
                        code,
                        sendTime:Date.now()
                    }
                });
                res.json({
                    ok:1,
                    code,
                    msg:"发送验证码成功"
                })
            }else{
                tools.json(res,-1,"请不要发送太频繁。请在"+(60-Number.parseInt(time/1000))+"秒后点击发送验证码")
            }
        }else{
            const code = tools.getRandom(100000,999999);
            await db.insertOne("userCodeList",{
                code,
                phoneCode,
                sendTime:Date.now()
            })
            res.json({
                ok:1,
                code,
                msg:"发送验证码成功"
            })
        }
    }catch(msg){
        res.json({
            ok:-1,
            msg
        })
    }
})
//登录验证
app.post("/login",async (req,res)=>{
    console.log(111)
    const phoneCode = req.body.phoneCode;
    const code = req.body.code
    //接收参数获取数据库的值
    const codeInfo = await db.findOne("userCodeList",{
        phoneCode,
        code:code/1
    })
    if(codeInfo){
        //判断是否过期
        if((Date.now()-codeInfo.sendTime)>60*1000){
            tools.json(res,-1,"验证码过期了")
        }else{
            //没过期
            const phoneInfo = await db.findOne("userList",{
                phoneCode
            })//判断用户列表是否有值
            if(phoneCode){
                
                //如果有更新最后登录时间
                await db.updateOne("userList",{
                    phoneCode
                },{
                    $set:{
                        lastTime:Date.now()
                    }
                })
                console.log(222)
            }else{
                //没有则把用户加入用户列表中
                await db.insertOne("userList",{
                    phoneCode,
                    regTime:Date.now(),
                    lastTime:Date.now()
                })
            }
            res.json({
                ok:1,
                token:tools.encode({
                    phoneCode
                }),
                msg:"登陆成功"
            })
        }
    }else{
        tools.json(res,-1,"验证码错误")
    }
})
// 对店铺列表进行分页。
app.get("/shopList",async (req,res)=>{
    let pageIndex = req.query.pageIndex;
    const response = await db.page("shopList",{
        sort:{
            addTime:-1,
        },
        pageIndex,
        limit:8
    })
    res.json(response);
})

// 根据店铺的关键字搜索相关店铺信息
app.get("/search",async(req,res)=>{
    const keyword = req.query.keyword;
    console.log(keyword);
    if(keyword.length>0){
        const shopList = await db.find("shopList",{
            whereObj:{
                shopName:new RegExp(keyword)
            }
        })
        res.json({
            ok:1,
            shopList
        })
    }else{
        res.json({
            ok:1,
            shopList:[]
        })
    }

})
//  根据店铺ID获得店铺详情
app.get("/shopInfo/:shopId",async (req,res)=>{
    const shopId = req.params.shopId;
    const shopInfo = await db.findOneById("shopList",shopId);
    res.json({
        ok:1,
        shopInfo
    })
})
app.get("/shopTypeList",async(req,res)=>{
    const shopTypeList =await db.find("shopTypeList",{
        sort:{
            addTime:-1
        },
        limit:30
    })
    res.json({
        ok:1,
        shopTypeList:tools.changeArr(shopTypeList,10)
    })
})
// 根据店铺类别ID获得店铺
app.get("/shopList/:shopTypeId",async (req,res)=>{
    const shopTypeId = req.params.shopTypeId;
    const shopList = await db.find("shopList",{
        whereObj:{
            shopTypeId:mongodb.ObjectId(shopTypeId)
        }
    });
    res.json({
        ok:1,
        shopList
    })
})
// 根据店铺ID获得商品类别
app.get("/goodsTypeList/:shopId",async(req,res)=>{
    const shopId = req.params.shopId;
    const goodsTypeList = await db.find("goodsTypeList",{
        whereObj: {
            shopId:mongodb.ObjectId(shopId)
        }
    })
    res.json({
        ok:1,
        goodsTypeList
    })
})
app.get("/goodsList/:shopId",async(req,res)=>{
    const shopId = req.params.shopId;
    const goodsList = await db.find("goodsList",{
        whereObj: {
            shopId:mongodb.ObjectId(shopId)
        }
    })
    res.json({
        ok:1,
        goodsList
    })
})
app.listen(8090,function(){
    console.log("success")
})
