var express = require('express');
var router = express.Router();
var clientIP = require("../jsbean/clientIP");
var checkSession = require('../jsbean/CheckSession');
var userModel = require('../models/userModel');
var indexModel = require('../models/indexModel');
var wf = require("../jsbean/writefile");
var sct = require("../jsbean/secret");

/* GET home page. */
router.get('/', function(req, res, next) {
	res.send('respond with a resource:'+req.method);   
	  
	//res.json('sggg');
	//res.end('dddd'); press rs for restarting the process
	//res.send('respond with a resource');
  	//res.render('index', { title: 'Express' });
  	//
  	/*session的清除：
	req.session.destroy(function(err) {
	    res.redirect('/');
	})*/
});
//状态刷新
router.post('/refresh', function(req, res, next) {
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:refresh \r【body】:${req.body} \r【headers】:${req.headers.authorization} \r`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}	
	token = sct.validate(req,res,str);
	if(token!=req.headers.authorization){
		res.setHeader('x-access-token', token);
	}
	return res.json({successInfo:{result:100,msg:'状态刷新成功'}});
	//userModel.refresh(req,res,token);存入数据库
});

router.get('/findUserInfo', function(req, res, next) {
	/*res.cookie('addr','Nealyang',{
        path:'/',
        maxAge:20*60*1000,//cookie的存活时间,单位毫秒
        signed:true//是否加签名
    });
	var a = req.signedCookies.addr;  //获取签名cookie
	//var a = req.cookies.addr;
	//console.log(a);
	//console.log(req.session);
	res.cookie('user', 'lililiwen');*/
    //console.log(req.cookies);
    //console.log(req.secret)
	//console.log(loginbean)
	/*var expiresTime = new Date(Date.now()+1000*60).toUTCString(); //过期时间
	res.writeHeader(200,{
	    'Content-Type':'text/plain; charset=utf8',
	    'Set-Cookie':['issend=true; expires='+expiresTime]
	});*/
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:findUserInfo \r【headers】:${req.headers.authorization} \r【query】:${JSON.stringify(req.query)} \r`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(req.query['userId']==undefined){
        wf.printLog(str+`【msg】:请求参数错误`); 
		return res.json({successInfo:{result:202,msg:"请求参数错误"}}); 
	}else{
		token = sct.validate(req,res,str);
		if(token!=req.headers.authorization){
			res.setHeader('x-access-token', token);
		}
		indexModel.userInfo(req, res,token); 
	}
	
});


module.exports = router;


//var logger = require('morgan');
//var fs = require('fs');

//1.app.use(logger('This is a customer format. :method :url :status :response-time ms'));

// create a write stream (in append mode)
//2.var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})

// setup the logger
//2.app.use(logger('combined', {stream: accessLogStream}))



