var express = require('express');
var router = express.Router();
var clientIP = require("../jsbean/clientIP");
var wf = require("../jsbean/writefile");
var userModel = require("../models/userModel"); //连接池
var multiparty = require('multiparty');
var fs = require('fs');
var moment = require('moment');
var sct = require("../jsbean/secret");

/* GET users listing. */
/*router.get('/', function(req, res, next) {
  res.send('respond with a resource');
  //res.send('respond with a resource');
  //res.render('login');    
});*/
router.post('/login', function(req, res, next) {
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:login \r【msg】:请求参数错误 \r【body】:${JSON.stringify(req.body)}`;
    
    if(req.body['phone']==undefined || req.body['pwd']==undefined){  
		wf.printLog(str);
		return res.json({successInfo:{result:300,msg:"未输入用户名或密码"}});     
	}else{  
	    userModel.login(req,res);      
	}   
});
router.post('/loginOut', function(req, res, next) {
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:loginOut \r【msg】:请求参数错误 \r【headers】:${req.headers.authorization} \r【body】:${JSON.stringify(req.body)}`;
    if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`);
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}

    if(req.body['userId']==undefined){  
		wf.printLog(str);
		return res.json({successInfo:{result:202,msg:"请求参数错误"}});     
	}else{  
		token = sct.validate(req,res,str,'1s');
		res.setHeader('x-access-token', token);
	    userModel.loginOut(req,res,token);      
	}   
});
//phone pwd
//res.render('login');    
//res.send('respond with a resource');
router.post('/register', function(req, res, next) {
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:register \r【msg】:请求参数错误 \r【body】:${JSON.stringify(req.body)}`;
	if(!req.body['phone'] || !req.body['pwd']){  
        wf.printLog(str);
		return res.json({successInfo:{result:300,msg:"用户名或密码错误"}});     
	}else{     
	    userModel.register(req,res);      
	}   
});

router.post('/updName', function(req, res, next) {
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:updName \r【msg】:请求参数错误 \r【headers】:${req.headers.authorization} \r【body】:${JSON.stringify(req.body)}`;
    if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
    if(!req.body.uname || !req.body.userId){  
		wf.printLog(str);
		return res.json({successInfo:{result:202,msg:"参数错误"}});     
	}else{     
		token = sct.validate(req,res,str);
		if(token!=req.headers.authorization){
			res.setHeader('x-access-token', token);
		}
	    userModel.updName(req,res,token);      
	}   
});

router.post('/uploadHeadImg', function(req, res) {
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:users.uploadHeadImg \r【headers】:${req.headers.authorization} \r`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	var form = new multiparty.Form(); 
    form.encoding = 'utf-8'; //设置编码 
    form.uploadDir = "./uploadtemp/"; 	 //设置文件存储路径 
    form.maxFilesSize = 2 * 1024 * 1024; //设置单文件大小限制 
    //form.maxFields = 1000;  设置所以文件的大小总和 
    //接收异步方法    
    form.parse(req, function(err, fields, files) {	    	
    	str += `【fields】:${JSON.stringify(fields)} \r【fields】:${JSON.stringify(files)}`;
        file1 = files['file']; 
        originalFilename = file1[0].originalFilename; //原始文件名 
        tmpPath = file1[0].path;				//uploads\mrecQCv2cGlZbj-UMjNyw_Bz.txt 
        var timestamp = new Date().getTime(); //获取当前时间戳 

        uploadurl='/images/headImg/' + moment().format('YYYYMMDD') ;
        fs.mkdir('./public'+uploadurl,function (err) {
		    if(err) wf.printLog(str+`【msg】:创建文件夹 \r【err】:${err}`);
		})
        newPath = uploadurl+'/'+ timestamp+originalFilename ;
        /*paraname = file1[0].fieldName;  //参数名filedata 
        fileSize = file1[0].size; //文件大小 */

 		if(!fields.userId || !originalFilename){  
	        wf.printLog(str);
	        fs.unlinkSync(tmpPath);
			return res.json({successInfo:{result:202,msg:"参数错误"},userId:fields.userId,fileName:originalFilename});     
		}else{     
			wf.printLog(str);
			var fileReadStream = fs.createReadStream(tmpPath); //读取流
            var fileWriteStream = fs.createWriteStream('./public'+newPath); //输出流
            fileReadStream.pipe(fileWriteStream); //读取管道流，一边读一边写 
            fileWriteStream.on('close',function(){ 
                fs.unlinkSync(tmpPath);    //删除临时文件夹中的图片 
            }); 
            imgSrc = 'http://'+req.headers.host+newPath;
            token = sct.validate(req,res,str);
            if(token!=req.headers.authorization){
				res.setHeader('x-access-token', token);
			}
            userModel.uploadHeadImg(req,res,fields,imgSrc,token);   
		} 
    }); 
});


module.exports = router;
