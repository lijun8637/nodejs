var connPool = require("../models/connPool");
var wf = require("../jsbean/writefile");
var clientIP = require("../jsbean/clientIP");
var moment = require('moment');

module.exports={
	placeOrder(req,res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:placeOrder \r【query】:${JSON.stringify(req.query)} \r`;
		pool.getConnection(function(err,conn){
			if(err){  
                wf.printLog(str+`【msg】:${err}`);
            	res.json({successInfo:{result:500,msg:"获取数据库连接错误"},err:err.message}); 
               	return; 
            } 
            ids = 'OD'+moment().format('YYYYMMDDHHmmss')+wf.getCode(6);  
            userSql = 'insert into red_order (did,userId,money,orderId,payType,backUrl,createtime,updtime) values(?,?,?,?,?,?,current_timestamp,current_timestamp)'; 
            param = [ids,req.body.userId,req.body.money,req.body.orderId,req.body.payType,req.body.backUrl];

            conn.query(userSql,param,function(err,rs){   
                if(err){   
                    wf.printLog(str+`【msg】:${JSON.stringify(err)}`);
                    res.json({successInfo:{result:500,msg:"插入数据库失败"},err:err.message});  
                    return;   
                }   
                wf.printLog(str+`【msg】:${JSON.stringify(rs)}`); 
                if(rs){  
				    res.json({successInfo:{result:100,msg:"下订单成功"},payId:ids}); 
                }else{   
                    res.json({successInfo:{result:300,msg:"下订单失败"},rs:rs,err:err});  
                }   
            }) 
            conn.release();
		})
	}
}