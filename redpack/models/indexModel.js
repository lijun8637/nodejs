var connPool = require("../models/connPool");
var wf = require("../jsbean/writefile");
var LoginBean = require("../jsbean/LoginBean"); 
var clientIP = require("../jsbean/clientIP");


module.exports = {
	userInfo(req, res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
        str = `【IP】:${IP} \r【Interface】:login \r【query】:${JSON.stringify(req.query)} \r`;
		pool.getConnection(function(err,conn){
			if(err){  
                wf.printLog(str+`【msg】:${err.message}`);
            	res.json({successInfo:{result:500,msg:"获取数据库连接错误"},err:err}); 
               	return; 
            } 
            userSql = 'select uid,userId,uname,phone,headImg,amount,sex,redRange,createtime,updtime from red_user where userId=?'; 

            conn.query(userSql,[req.query['userId']],function(err,rs){   
                if(err){   
                    wf.printLog(str+`【msg】:${err.message}`);
                    if(err.message.indexOf('userId')>-1){ 
                        res.json({successInfo:{result:203,msg:"用户不存在"},err:err}); 
                    }else{
                        res.json({successInfo:{result:500,msg:"数据库查询失败"},err:err}); 
                    }  
                    //res.send("数据库错误,错误原因:"+err.message);   
                    return;   
                }   
                wf.printLog(str+`【msg】:length:${rs.length};rs:${JSON.stringify(rs)}`); 

                if(rs.length>0){  
                    loginbean = new LoginBean();
                    loginbean.pwd=rs[0].pwd;    
                    loginbean.uname = rs[0].userName;
                    //req.session.loginbean = loginbean;
				    res.json({successInfo:{result:100,msg:"查询成功"},userInfo:rs,err:err}); 
				    /*targeturl = req.body['targeturl']; 
					res.redirect(targeturl);    //跳转回index页  
				    //res.send('登录成功');     */
                }else{   
                    res.json({successInfo:{result:203,msg:"用户不存在"},userInfo:rs,err:err});  
                    //res.send("账号或密码错误");   
                }   
            }) 
            conn.release();
		})
	}
}