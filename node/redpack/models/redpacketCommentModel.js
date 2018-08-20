var connPool = require("../models/connPool");
var wf = require("../jsbean/writefile");
var clientIP = require("../jsbean/clientIP");
var moment = require('moment');
var async = require('async');

module.exports = {
    //点赞
    updLikes(req,res){
        pool = connPool();
        IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:updLikes \r【headers】:${req.headers.authorization}\r【body】:${JSON.stringify(req.body)} \r`;
        pool.getConnection(function(err,conn){
            if(err){  
                wf.printLog(str+`【msg】:获取数据库连接错误:${err}`); 
                res.json({successInfo:{result:500,msg:"获取数据库连接错误"},err:err.message}); 
                return; 
            } 
            sqlone = 'select likes,uslist from red_comment where topicId=?'
            partwo = [req.body['topicId']];
            
            conn.query(sqlone,partwo,function(err,rs){
                if(err){   
                    wf.printLog(str+`【msg】:查询数据库失败:${err}`); 
                    res.json({successInfo:{result:500,msg:"查询数据库失败"},err:err.message});   
                    return;   
                }   
                wf.printLog(str+`【msg】:查询评论信息成功;${JSON.stringify(rs)}`); 

                likes = rs[0].likes;
                str = '';
                if(rs[0].uslist){
                    likes++;
                    if(rs[0].likes>1){
                        list = rs[0].uslist.split(',');
                        for(let i=0;i<list.length;i++){
                            if(list[i]==req.body['userId']){
                                list.splice(i,1);
                                likes = likes-2;
                                break;
                            }
                            if(i==list.length-1){
                                list.push(req.body['userId']);
                            }
                        }
                        list.forEach((it)=>{
                            str += it+',';
                        })
                        str = str.substr(0,str.lastIndexOf(','));
                    }else{
                        if(rs[0].uslist != req.body['userId']){
                            str = rs[0].uslist +','+ req.body['userId'];
                        }
                    }
                    
                }else{
                    likes++;
                    str = req.body['userId'];
                }
                sqltwo = `update red_comment set likes=${likes},uslist='${str}' where topicId=?`;  
                
                conn.query(sqltwo,partwo,function(err,ress){
                    if(err){   
                        wf.printLog(str+`【msg】:"更新数据库失败:"${err.message}`); 
                        res.json({successInfo:{result:500,msg:"更新数据库失败:"+err.message},err:err});   
                        return;   
                    }   
                    wf.printLog(str+`【msg】:点赞成功;results:${JSON.stringify(ress)}`); 
                    if(ress){
                        res.json({successInfo:{result:100,msg:"点赞成功"}}); 
                    }else{
                        res.json({successInfo:{result:300,msg:"点赞失败"}}); 
                    }
                })
                
            });

            conn.release();
        })
    },
    //查询所有红包评论
	findComments(req,res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
		str = `【IP】:${IP} \r【Interface】:findComments \r【headers】:${req.headers.authorization}\r【query】:${JSON.stringify(req.query)} \r`;
		pool.getConnection(function(err,conn){
			if(err){  
                wf.printLog(str+`【msg】:"获取数据库连接错误:"${err}`);
            	res.json({successInfo:{result:500,msg:"获取数据库连接错误"},err:err.message}); 
               	return; 
            } 
            //已审核 未审核
            if(req.query.status){
                sqlone = 'select * from red_comment where redPacketId=? and status=?';   //order by createtime desc
                param = [req.query.redPacketId,req.query.status];
            }else{
                sqlone = 'select * from red_comment where redPacketId=?';   
                param = [req.query.redPacketId];
            }
            
            conn.query(sqlone,param,function(err,rs){
                if(err){   
                	wf.printLog(str+`【msg】:"查询数据库失败:"${err}`); 
                    res.json({successInfo:{result:500,msg:"查询数据库失败"},err:err.message});   
                    return;   
                }   
                wf.printLog(str+`【msg】:${JSON.stringify(rs)}`); 

                if(rs.length > 0){
                	rs.forEach((it)=>{
                		it.createtime = moment(it.createtime).format('YYYY-MM-DD HH:mm:ss');
                		it.updtime = moment(it.updtime).format('YYYY-MM-DD HH:mm:ss');
                        it.userInfo = JSON.parse(it.userInfo);
                        if(it.likes>1){
                            it.uslist = it.uslist.split(",");
                        }
                		it.childList = [];
                		if(it.parentId != param[0]){
                			for(let i of rs){
                				if(it.parentId == i.topicId){
                                    if(i.childList){
                                        i.childList.push(it);
                                    }else{
                                        i.childList = [];
                                        i.childList.push(it);
                                    }
                					break;
                				}
                			}
                		}
                	})
                	arr = [];
                	rs.forEach((it)=>{
                		if(it.topicType === '0'){
                			arr.push(it);
                		}
                	})
                    if(req.query.topicId){
                        arr1 = [];
                        for(let it of arr){
                            if(it.topicId == req.query.topicId){
                                arr1.push(it);
                                break;
                            }
                        }
                        res.json({successInfo:{result:100,msg:"查询成功"},commentInfo:{list:arr1,count:rs.length}}); 
                    }else{
                        res.json({successInfo:{result:100,msg:"查询成功"},commentInfo:{list:arr,count:rs.length}}); 
                    }
                }else{
                	res.json({successInfo:{result:200,msg:"查询成功"},commentInfo:{list:rs,count:rs.length}}); 
                }
                
            });
            conn.release();
		})
	},
    //发表评论
	insertComment(req,res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
		str = `【IP】:${IP} \r【Interface】:insertComment \r【headers】:${req.headers.authorization}\r【body】:${JSON.stringify(req.body)} \r`;
		pool.getConnection(function(err,conn){
			if(err){  
                wf.printLog(str+`【msg】:"获取数据库连接错误:"${err}`); 
            	res.json({successInfo:{result:500,msg:"获取数据库连接错误:"},err:err.message}); 
               	return; 
            } 
            
            ids = 'CO'+moment().format('YYYYMMDDHHmmss')+wf.getCode(6);  

            sqlone = 'select headImg,uname from red_user where userId=?'; 
            parone = [req.body['userId']];
            sqltwo = 'insert into red_comment (topicId,topicType,redPacketId,userId,toUId,content,parentId,userInfo,createtime,updtime) values(?,?,?,?,?,?,?,?,current_timestamp,current_timestamp)';   
            partwo = [ids,req.body['topicType'],req.body['redPacketId'],req.body['userId'],req.body['toUId'],req.body['content'],req.body['redPacketId']];
            
            if(req.body['topicType'] == 1){
            	partwo[partwo.length-1] = req.body['topicId'];
            }
            conn.query(sqlone,parone,function(err,rs){
                if(err){   
                	wf.printLog(str+`【msg】:"查询数据库失败:"${err}`); 
                    res.json({successInfo:{result:500,msg:"查询数据库失败:"+err.message},err:err.message});   
                    return;   
                }   
                wf.printLog(str+`【msg】:查询用户信息成功;results:${JSON.stringify(rs)}`); 

                partwo.push(JSON.stringify({headImg:rs[0].headImg,uname:rs[0].uname}));

                conn.query(sqltwo,partwo,function(err,ress){
                    if(err){   
                        wf.printLog(str+`【msg】:"写入数据库失败:"${err}`); 
                        res.json({successInfo:{result:500,msg:"写入数据库失败:"+err.message},err:err.message});   
                        return;   
                    }   
                    wf.printLog(str+`【msg】:发表评论成功;results:${JSON.stringify(ress)}`); 
                    if(ress){
                        res.json({successInfo:{result:100,msg:"发表评论成功"}}); 
                    }else{
                        res.json({successInfo:{result:300,msg:"发表评论失败"},res:ress}); 
                    }
                })
                
            });

            conn.release();
		})
	}
}