const express = require("express");
const bodyParser = require("body-parser");
const db = require("./module/db2");
const md5 = require("md5")
const tools = require("./module/tools");
const upPic = require("./module/upPic");
const mongodb = require("mongodb");
const app = express();
const path = require('path')
app.use(express.static(__dirname+"/upload"))
app.use(express.static(path.resolve(__dirname,"../manage/dist")))
app.use(bodyParser.json());
// **************登录login****************
app.post("/login", async (req,res)=>{
    try{
        const {adminName,passWord} = req.body;
        console.log(adminName,passWord);
        //查找登录的账号
        const info =await db.findOne("adminList",{
            
            adminName,
            passWord:md5(passWord+"(*^(*&^(*&)")
        });
        //插入管理员登录信息
        console.log(info)
        await db.insertOne("adminLog",{
            adminName,
            logType:(info ? 1 : 2),
            detail:"管理员登录"+(info ? "成功":"失败"),
            addTime:Date.now()
        })
        if(info){
            await db.updateOne("adminList",{_id:info._id},{$set:{loginTime:Date.now()}})
            res.json({
                ok:1,
                json:"登陆成功",
                token:tools.encode({adminName})
            })
        }else{
            tools.json(res,-1,"账号或密码错误")
        }
    }catch{
        tools.json(res,-1);
    } 
})
app.put("/upPassWord", async (req,res)=>{
    try{
        const {oPassWord,nPassWord,adminName} = req.body;
        //查找要修改的账号
        const admininfo =await db.findOne("adminList",{
            adminName,
            passWord:md5(oPassWord+"(*^(*&^(*&)")
        });
        if(admininfo){
            await db.updateOne("adminList",{_id:admininfo._id},{$set:{passWord:md5(nPassWord+"(*^(*&^(*&)")}})
            res.json({
                ok:1,
                json:"修改成功",
            })
        }else{
            tools.json(res,-1,"原密码错误")
        }
    }catch{
        tools.json(res,-1,err);
    } 
})
//***********************token验证 ***********************/
app.all("*",(req,res,next)=>{
    const token = req.headers.authorization;
    // console.log(token)
    const {ok,msg,info} = tools.decode(token);
    // console.log(info)
    if(ok === 3) next();
    else{
        tools.json(res,2,msg);
    }
})
//***********************shopTypeList**************************** */
//提交商品类别信息
app.post("/shopTypeList",(req,res)=>{
    upPic(req,"shopTypePic",async function({ok,msg,params}){
        if(ok === 1){
            await db.insertOne("shopTypeList",{
                shopTypeName:params.shopTypeName,
                shopTypePic:params.newPicName,
                addTime:Date.now()
            })
            tools.json(res,1,"上传成功");
        }else{
            tools.json(res,-1,msg)
        }
    })
})
// 修改店铺类别
app.put("/shopTypeList",(req,res)=>{
    upPic(req,"shopTypePic",async function({ok,msg,params}){
        if(ok ===3){
            tools.json(res,-1,msg)
        }else{
            const upObj={
                $set:{
                    shopTypeName:params.shopTypeName
                }
            }
            if(ok === 1){
                const shopTypeInfo = await db.findOneById("shopTypeList",params.shopTypeId);
                console.log(shopTypeInfo.shopTypePic);
                tools.deletePic(shopTypeInfo.shopTypePic)
                const result = await db.deleteOneById(shopTypeInfo.shopTypePic);//删除原图片
                upObj.$set.shopTypePic=params.newPicName  
            }
            //修改数据
            await db.updateOneById("shopTypeList",params.shopTypeId,upObj)
            tools.json(res,1,"修改成功")
        }
    })
})
//获得店铺列别信息
app.get("/shopTypeList",async(req,res)=>{
    let pageIndex = req.query.pageIndex;
    let keyWord = req.query.keyWord || "";
    let whereObj ={};
    if(keyWord){
        whereObj={
            shopTypeName:new RegExp(keyWord)
        }
    }
    const response = await db.page("shopTypeList",{
        whereObj,
        sort:{
            addTime:-1
        },
        pageIndex,
        limit:5
    })
    res.json(response)
})
//根据id删除店铺类别信息
app.delete("/shopTypeList/:id",async (req,res)=>{
    // console.log(111)
    try{
        const id=req.params.id
        await db.deleteOneById("shopTypeList",id)
        tools.json(res,1,"删除成功")
    }catch{
        tools.json(res,-1,"删除失败")
    }
})
//********************allShopTypeList********************************** */
//获取所有店铺类别
app.get("/allShopTypeList",async (req,res)=>{
    console.log(111)
    const shopTypeList = await db.find("shopTypeList",{
        sort:{
            addTime:-1
        }
    });
    res.json({
        ok:1,
        shopTypeList
    })
})
//********************shopList********************** */
app.post("/shopList",(req,res)=>{
    upPic(req,"shopPic",async function ({ok,msg,params}) {

        if(ok === 1 ){
            // 根据店铺类别ID获得店铺类别信息
            const shopTypeInfo = await db.findOneById("shopTypeList",params.shopTypeId);
            await db.insertOne("shopList",{
                shopTypeId:shopTypeInfo._id,// 店铺类别集合当中的_id
                shopName:params.shopName,
                shopTypeName:shopTypeInfo.shopTypeName,
                shopPic:params.newPicName,
                addTime:Date.now()
            })
            tools.json(res,1,"上传成功");
        }else{
            tools.json(res,-1,msg);
        }
    })
})
app.put("/shopList",(req,res)=>{
    upPic(req,"shopPic",async function({ok,msg,params}){
        if(ok ===3){
            tools.json(res,-1,msg)
        }else{
            const data = await db.findOneById("shopTypeList",params.shopTypeId)
            const upObj={
                $set:{
                    shopName:params.shopName,
                    shopTypeId:mongodb.ObjectId(params.shopTypeId),
                    shopTypeName:data.shopTypeName
                }
            }
            if(ok === 1){
                const shopInfo = await db.findOneById("shopList",params.shopId);
                const result = await db.deleteOneById(shopInfo.shopPic);//删除原图片
                upObj.$set.shopPic=params.newPicName  
            }
            //修改数据
            await db.updateOneById("shopList",params.shopId,upObj)
            res.json({
                ok:1,
                data
            })
        }
    })
})
app.get("/shopInfo/:id",async (req,res)=>{
     // 根据ID获得商品信息
     const shopInfo = await db.findOneById("shopList",req.params.id);
     res.json({
         ok:1,
         shopInfo
     })
})
app.get("/shopList/:shopTypeId",async (req,res)=>{
        const shopList = await db.find("shopList",{
            whereObj: {
                shopTypeId:mongodb.ObjectId(req.params.shopTypeId)
            }
        });
        res.json({
            ok:1,
            shopList
        })
})
//获得店铺信息
app.get("/shopList",async(req,res)=>{
    let pageIndex = req.query.pageIndex;
    let keyWord = req.query.keyWord || "";
    let whereObj ={};
    if(keyWord){
        whereObj={
            shopName:new RegExp(keyWord)
        }
    }
    const response = await db.page("shopList",{
        whereObj,
        sort:{
            addTime:-1
        },
        pageIndex,
        limit:5
    })
    res.json(response)
})
//根据id删除店铺信息
app.delete("/shopList/:id",async (req,res)=>{
    try{
        const id=req.params.id
        await db.deleteOneById("shopList",id)
        tools.json(res,1,"删除成功")
    }catch{
        tools.json(res,-1,"删除失败")
    }
})
// ***********************************adminLog***********************************************
//删除管理日志
app.delete("/adminLog/:id",async (req,res)=>{
    // console.log(111)
    try{
        const id=req.params.id
        await db.deleteOneById("adminLog",id)
        tools.json(res,1,"删除成功")
    }catch{
        tools.json(res,-1,"删除失败")
    }
})
//获得管理员日志
app.get("/adminLog",async(req,res)=>{
    let pageIndex = req.query.pageIndex/1;
    const response = await db.page("adminLog",{
        sort:{
            addTime:-1
        },
        pageIndex
    })
    res.json(response)
})
// *************************adminList************************************
//获取管理员列表
app.get("/adminList",async (req,res)=>{
    let pageIndex = req.query.pageIndex/1;
    const response = await db.page("adminList",{
        sort:{
            addTime:-1,
        },
        limit:1,
        pageIndex
    })
    res.json(response);
})
//根据ID删除管理员信息
app.delete("/adminList/:id",async (req,res)=>{
    try{
        const id=req.params.id
        await db.deleteOneById("adminList",id)
        tools.json(res,1,"删除成功")
    }catch{
        tools.json(res,-1,"删除失败")
    }
})
//************shopInfo******** */
//根据id获取店铺信息
app.get("/shopList/:shopTypeId",async (req,res)=>{
    const shopInfo = await db.findOneById("shopList",req.params.id);
    // console.log(shopInfo)
    res.json({
        ok:1,
        shopInfo
    })
})
//***********goodsTypeList******************/
app.post("/goodsTypeList",async (req,res)=>{
    const shopInfo = await db.findOneById("shopList",req.body.shopId);
    // 根据店铺类别ID，获得店铺类别信息。
    // const shopTypeInfo = await db.findOneById("shopTypeList",req.body.shopTypeId)
    await db.insertOne("goodsTypeList",{
        goodsTypeName:req.body.goodsTypeName,
        shopId:shopInfo._id,
        shopName:shopInfo.shopName,
        shopTypeId:shopInfo.shopTypeId,
        shopTypeName:shopInfo.shopTypeName,
        addTime:Date.now()
    })
    res.json({
        ok:1,
        msg:"插入成功"
    })
})
app.get("/goodsTypeList",async(req,res)=>{
    let pageIndex = req.query.pageIndex;
    let keyWord = req.query.keyWord || "";
    let whereObj ={};
    console.log(keyWord)
    if(keyWord){
        whereObj={
            goodsTypeName:new RegExp(keyWord)
        }
    }
        const response = await db.page("goodsTypeList",{
            whereObj,
            pageIndex,
            sort:{
                addTime:-1
            },
            limit:5
        })
        res.json(response);
})
app.get("/goodsTypeList/:id",async (req,res)=>{
    // 根据ID获得商品信息
    const goodsTypeInfo = await db.findOneById("goodsTypeList",req.params.id);
    res.json({
        ok:1,
        goodsTypeInfo
    })
})
app.get("/goodsTypeListByShopId/:shopId",async (req,res)=>{
    // 根据店铺ID获得商品类别信息
    const shopId = mongodb.ObjectId(req.params.shopId)
    // console.log(shopId)
    const goodsTypeList = await db.find("goodsTypeList",{
        whereObj:{
            shopId:mongodb.ObjectID(shopId)
        }
    });
    res.json({
        ok:1,
        goodsTypeList
    })
})
app.delete("/goodsTypeList/:id",async (req,res)=>{
    try{
        const id=req.params.id
        await db.deleteOneById("goodsTypeList",id)
        tools.json(res,1,"删除成功")
    }catch{
        tools.json(res,-1,"删除失败")
    }
})
app.put("/goodsTypeList",async (req,res)=>{
    const data=req.body;
    const shopTypeInfo=await db.findOneById("shopTypeList",data.shopTypeId)
    const shopInfo=await db.findOneById("shopList",data.shopId)
    console.log(data)
    const upObj={
        $set:{
            goodsTypeName:data.goodsTypeName,
            shopTypeName:shopTypeInfo.shopTypeName,
            shopTypeId:mongodb.ObjectId(data.shopTypeId),
            shopName:shopInfo.shopName,
            shopId:mongodb.ObjectId(data.shopId),
        }
    }
    await db.updateOneById("goodsTypeList",data.goodsTypeId,upObj);
    res.json({
        ok:1,
        shopTypeInfo
    })
})
//****************goodsList******************
app.post("/goodsList",async (req,res)=>{
    upPic(req,"goodsPic",async function ({ok,msg,params}) {

        if(ok === 1 ){
            const goodsTypeInfo = await db.findOneById("goodsTypeList",params.goodsTypeId);
            console.log(goodsTypeInfo)
            await db.insertOne("goodsList",{
                goodsName:params.goodsName,
                goodsTypeId:goodsTypeInfo._id,
                goodsTypeName:goodsTypeInfo.goodsTypeName,
                shopId:goodsTypeInfo.shopId,
                shopName:goodsTypeInfo.shopName,
                shopTypeId:goodsTypeInfo.shopTypeId,
                shopTypeName:goodsTypeInfo.shopTypeName,
                goodsPic:params.newPicName,
                addTime:Date.now()
            })
            tools.json(res,1,"商品上传成功");
        }else{
            tools.json(res,-1,msg);
        }
    })
})
app.get("/goodsList",async(req,res)=>{
    let pageIndex = req.query.pageIndex;
    let keyWord = req.query.keyWord || "";
    let whereObj ={};
    console.log(keyWord)
    if(keyWord){
        whereObj={
            goodsName:new RegExp(keyWord)
        }
    }
    const response = await db.page("goodsList",{
            whereObj,
            sort:{
                addTime:-1
            },
            limit:5,
            pageIndex
        })
        res.json(response);
})
//根据id删除店铺信息
app.delete("/goodsList/:id",async (req,res)=>{
    try{
        const id=req.params.id
        await db.deleteOneById("goodsList",id)
        tools.json(res,1,"删除成功")
    }catch{
        tools.json(res,-1,"删除失败")
    }
})
app.listen(8082,function () {
    console.log("success");
})