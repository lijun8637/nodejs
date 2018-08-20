var connPool = require("../models/connPool");
var wf = require("../jsbean/writefile");
var LoginBean = require("../jsbean/LoginBean"); 
var clientIP = require("../jsbean/clientIP");
var moment = require('moment');
var async = require("async");
var fs = require("fs");
var jwt = require("jsonwebtoken");
var sct = require("../jsbean/secret");
var secret = sct.secretstr();
/*var jwt = require('jwt-simple');
var express = require('express');
var app = express();
var jwtTokenSecret = app.get('jwtTokenSecret');*/


module.exports = {
    //改头像
    uploadHeadImg(req,res,fields,newPath,token){
        pool = connPool();
        IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:uploadHeadImg \r【fields】:${JSON.stringify(fields)} \r【headers】:${req.headers.authorization} \r`;
        //从pool中获取连接(异步,取到后回调)   
        pool.getConnection(function(err,conn){ 
            if(err){ 
                wf.printLog(str+`【msg】:获取数据库连接错误:${err}`);
                res.json({successInfo:{result:500,msg:"获取数据库连接错误"},err:err}); 
                return; 
            }     
            parone = [newPath,fields.userId[0]];  
            sqlone = `update red_user set headImg=? where userId=?`;
            sqltwo = 'select headImg from red_user where userId=?';   
            conn.query(sqltwo,[parone[1]],function(err,rs){   
                if(err){
                    wf.printLog(str+`【msg】:数据库查询失败:${err}`);
                    res.json({successInfo:{result:500,msg:"数据库查询失败"},err:err.message}); 
                    return; 
                }
                wf.printLog(str+`【msg】:${JSON.stringify(rs)}`);

                conn.beginTransaction(function (err) {
                    if (err) {
                        wf.printLog(str+`【errType】:启动事物处理出错 \r【msg】:${err.message}`);
                        res.json({successInfo:{result:500,msg:"启动事物处理出错:"+err.message},err:err});
                        return;
                    }
                    async.series([ //串行series,并行parallel
                        function(callback) {
                            conn.query(sqlone,parone,function(err,rs){
                                if(err){
                                    callback(err,1);
                                    return;
                                }
                                callback(err,rs);
                            });
                        },
                        function(callback) {
                            conn.query(sqltwo,[parone[1]],function(err,rs){
                                if(err){
                                    callback(err,2);
                                    return;
                                }
                                callback(err,rs);
                            });
                        }
                    ],function(errs, ress) {
                        if(errs) {//调用回滚1';
                            wf.printLog(str+`【errType】:回滚1写入数据库失败 \r【msg】:${errs}`);
                            conn.rollback(function() { });
                            res.json({successInfo:{result:500,msg:"回滚1写入数据库失败"},errs:errs});
                            return;
                        }
                        // 提交事务 写入磁盘
                        conn.commit(function(err) {
                            if (err) {//调用回滚2
                                wf.printLog(str+`【errType】:提交事物出错 \r【msg】:${err}`);
                                conn.rollback(function(){});
                                res.json({successInfo:{result:500,msg:"提交事物出错:"+err}});
                            }
                            wf.printLog(str+`【msg】:${JSON.stringify(ress)} \r【err】${JSON.stringify(err)}`);  
                            if(ress[0]&&ress[1]){
                                //删除图片
                                reg = new RegExp('http://'+req.headers.host);
                                imgSrc = rs[0].headImg.replace(reg,'./public');
                                fs.unlink(imgSrc,function (err) {
                                    if(err) wf.printLog(str+`【msg】:删除图片失败 \r【path】${rs[0].headImg}`)
                                })
                                res.json({successInfo:{result:100,msg:"图片更新成功"},path:ress[1][0].headImg}); 
                            }else{
                                res.json({successInfo:{result:300,msg:"图片更新失败"},ress:ress}); 
                            }
                        });
                    });
                });
            });
            conn.release();
        });
    },
    //改名字
    updName(req,res,token){
        pool = connPool();
        IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:updName \r【body】:${JSON.stringify(req.body)} \r【headers】:${req.headers.authorization} \r`;
        //从pool中获取连接(异步,取到后回调)   
        pool.getConnection(function(err,conn){ 
            if(err){ 
                wf.printLog(str+`【msg】:获取数据库连接错误:${err}`);
                return res.json({successInfo:{result:500,msg:"获取数据库连接错误"},err:err}); 
            }                         
            sqlone = `update red_user set uname=? where userId=?`;   
            parone = [req.body.uname,req.body.userId];   
           
            conn.query(sqlone,parone,function(errs,rss){   
                if(errs){   
                    wf.printLog(str+`【msg】:数据库更新失败:${JSON.stringify(errs)}`); 
                    return rss.json({successInfo:{result:500,msg:"数据库更新失败"},err:errs.message});   
                } 
                if(rss){
                    return res.json({successInfo:{result:100,msg:"修改成功"}}); 
                }else{
                    return res.json({successInfo:{result:300,msg:"修改失败"},rss:rss,err:err}); 
                }
            })
            conn.release();
        });
    },
    refresh(req,res,token){
        pool = connPool();
        IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:refresh \r【body】:${JSON.stringify(req.body)} \r【headers】:${req.headers.authorization} \r`;
        pool.getConnection(function(err,conn){ 
            if(err){ 
                wf.printLog(str+`【msg】:获取数据库连接错误:${JSON.stringify(err)}`);
                return res.json({successInfo:{result:500,msg:"获取数据库连接错误:"},err:err.message}); 
            }             
            userSql = 'select * from red_user where userId=?';   
            param = [req.decoded.userId];   
           
            conn.query(userSql,param,function(err,rs){   
                if(err){   
                    wf.printLog(str+`【msg】:数据库查询失败:${err}`);
                    return res.json({successInfo:{result:500,msg:"数据库查询失败"},err:err.message});   
                }   
                wf.printLog(str+`【res】：${JSON.stringify(rs)}`); 

                if(rs.length>0){  
                    if(rs[0].token==req.headers.authorization && rs[0].token!=token){
                        conn.query(`update red_user set token=?,lgNum=0 where userId=?`,[token,param[0]],function(errs,rss){   
                            if(errs){   
                                wf.printLog(str+`【msg】:数据库更新失败:${JSON.stringify(errs)}`); 
                                return res.json({successInfo:{result:500,msg:"数据库更新失败:"+errs.message}}); 
                            } 
                            res.setHeader('x-access-token', token);
                        })      
                    }
                    let userInfo = {};
                    userInfo.userId = rs[0].userId;   
                    userInfo.uname = rs[0].uname;   
                    userInfo.phone = rs[0].phone;   
                    userInfo.headImg = rs[0].headImg;   
                    userInfo.amount = rs[0].amount;   
                    userInfo.sex = rs[0].sex; 
                    userInfo.redRange = rs[0].redRange;  
                    userInfo.createtime = moment(rs[0].createtime).format('YYYY-MM-DD HH:mm:ss');
                    userInfo.updtime = moment(rs[0].updtime).format('YYYY-MM-DD HH:mm:ss');
                    return res.json({successInfo:{result:100,msg:'状态刷新成功'},userInfo:userInfo});
                }else{ 
                    return res.json({successInfo:{result:203,msg:'用户不存在'}});
                }
            })
            conn.release();
        })
    },
	login(req,res){
		pool = connPool();
        IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:login \r【body】:${JSON.stringify(req.body)} \r【headers】:${req.headers.authorization} \r`;
		//从pool中获取连接(异步,取到后回调)   
        pool.getConnection(function(err,conn){ 
            if(err){ 
                wf.printLog(str+`【msg】:获取数据库连接错误:${err}`);
            	return res.json({successInfo:{result:500,msg:"获取数据库连接错误:"},err:err.message}); 
               	//res.send("获取连接错误,错误原因:"+err.message); 
            }             
            userSql = 'select * from red_user where phone=? and pwd=?';   
            param = [req.body['phone'],req.body['pwd']];   
           
            conn.query(userSql,param,function(err,rs){   
                if(err){   
                    wf.printLog(str+`【msg】:数据库查询失败:${err}`);
                    if(err.message.indexOf('phone')>-1 || err.message.indexOf("doesn't exist")){ 
                        return res.json({successInfo:{result:203,msg:"用户不存在"}}); 
                    }else{
                        return res.json({successInfo:{result:500,msg:"数据库查询失败"},err:err.message}); 
                    }   
                }   
                wf.printLog(str+`【msg】：${JSON.stringify(rs)}`); 

                if(rs.length>0){  
                    time = moment().format('YYYY-MM-DD HH:mm:ss');
                    var content ={userId:rs[0].userId,phone:rs[0].phone}; // 要生成token的主题信息
                    //24小时过期 2 days 1d 10h 2.5 hrs 2h 1m 5s 1y
                    var token = jwt.sign(content, secret, { expiresIn: '1h'}); 
                    //token = sct.cipher(token);
                    conn.query(`update red_user set token=?,lgNum=0,updtime=? where phone=?`,[token,time,param[0]],function(errs,rss){   
                        if(errs){   
                            wf.printLog(str+`【msg】:数据库更新失败:${JSON.stringify(errs)}`); 
                            return res.json({successInfo:{result:500,msg:"数据库更新失败:"+errs.message}}); 
                        } 
                    })      
                    let userInfo = {};
                    userInfo.userId = rs[0].userId;   
                    userInfo.uname = rs[0].uname;   
                    userInfo.phone = rs[0].phone;   
                    userInfo.headImg = rs[0].headImg;   
                    userInfo.amount = rs[0].amount;   
                    userInfo.sex = rs[0].sex; 
                    userInfo.redRange = rs[0].redRange;  
                    userInfo.createtime = moment(rs[0].createtime).format('YYYY-MM-DD HH:mm:ss');
                    userInfo.updtime = moment(rs[0].updtime).format('YYYY-MM-DD HH:mm:ss');
                    res.setHeader('x-access-token', token);
                    return res.json({successInfo:{result:100,msg:"登录成功"},userInfo:userInfo,err:err}); 
            	    /*targeturl = req.body['targeturl']; 
					res.redirect(targeturl);    //跳转回index页  
				    //res.send('登录成功'); */
                }else{   
                    return res.json({successInfo:{result:204,msg:"账号或密码错误"},err:err});
                    //res.send("账号或密码错误");   
                }   
            })   
            conn.release();
        });
	},
    loginOut(req,res,token){
        pool = connPool();
        IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:refresh \r【body】:${JSON.stringify(req.body)} \r【headers】:${req.headers.authorization} \r`;
        pool.getConnection(function(err,conn){ 
            if(err){ 
                wf.printLog(str+`【msg】:获取数据库连接错误:${JSON.stringify(err)}`);
                return res.json({successInfo:{result:500,msg:"获取数据库连接错误:"},err:err.message}); 
            }             
            userSql = 'update red_user set token=? where userId=?';   
            param = [token,req.decoded.userId];   
            conn.query(userSql,param,function(errs,ress){   
                if(errs){   
                    wf.printLog(str+`【msg】:数据库更新失败:${JSON.stringify(errs)}`); 
                    return res.json({successInfo:{result:500,msg:"数据库更新失败:"+errs.message}}); 
                } 
                if(ress){
                    return res.json({successInfo:{result:100,msg:'退出成功'}});
                }else{
                    return res.json({successInfo:{result:200,msg:'退出失败'}});
                }
            })
            conn.release();
        })
    },
    register(req,res){
        pool = connPool();
        IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:register \r【body】:${JSON.stringify(req.body)} \r`;
        //从pool中获取连接(异步,取到后回调)   
        pool.getConnection(function(err,conn){
            if(err){ 
                wf.printLog(str+`【msg】:获取数据库连接错误:${err}`);
                res.json({successInfo:{result:500,msg:"获取数据库连接错误"},err:err.message}); 
                //res.send("获取连接错误,错误原因:"+err.message); 
                return; 
            } 
            var selUserSql = 'select uid,userId,uname,phone,headImg,amount,sex,redRange,createtime,updtime from red_user where phone=?';   
            conn.query(selUserSql,[req.body['phone']],function(err,rs){   
                if(err){
                    wf.printLog(str+`【msg】:数据库查询失败:${err}`);
                    if(!(err.message.indexOf('phone')>-1) || !(err.message.indexOf("doesn't exist")) ){
                        res.json({successInfo:{result:500,msg:"数据库查询失败"},err:err.message}); 
                        return; 
                    }
                }
                wf.printLog(str+`【msg】:${JSON.stringify(rs)}`);
                if(rs.length>0){  
                    res.json({successInfo:{result:102,msg:"用户已存在"}}); 
                }else{
                    let tim = moment().format('YYYYMMDDHHmmss');
                    var ids = 'US'+tim+ wf.getCode(6);      
                    var names =  wf.getCode(6);    
                    sqltwo = 'insert into red_user (userId,uname,pwd,phone,headImg,createtime,updtime) values(?,?,?,?,?,current_timestamp,current_timestamp)'; 
                    partwo = [ids,names,req.body['pwd'],req.body['phone'],'http://'+req.headers.host+'/images/noface.png']; 
                    //sqlthere = 'select uid,userId,uname,phone,headImg,amount,sex,redRange,createtime,updtime from red_user where phone=?'
                    
                    conn.query(sqltwo,partwo,function(errs,res){
                        if(errs){ 
                            wf.printLog(str+`【msg】:写入数据库失败:${JSON.stringify(errs)}`);
                            return res.json({successInfo:{result:500,msg:"写入数据库失败"},err:errs.message});
                        } 
                        wf.printLog(str+`【msg】:${JSON.stringify(res)}`); 
                        if(res){
                            return res.json({successInfo:{result:100,msg:"注册成功"},err:errs}); 
                        }
                    });
                }
            })   
            conn.release();
        })
    }
    
}
