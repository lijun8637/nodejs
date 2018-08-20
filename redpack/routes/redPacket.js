var express = require('express');
var router = express.Router();
var clientIP = require("../jsbean/clientIP");
var wf = require("../jsbean/writefile");
var redPacketModel = require("../models/redPacketModel"); //连接池
var fs = require('fs');
var moment = require('moment');
var sct = require("../jsbean/secret");

//redPacketId status 0=找指定的红包 1=已被领取的红包
router.get('/findRedPackets',function(req,res){
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:findRedPackets \r【headers】:${req.headers.authorization} \r【errType】:请求参数错误 \r【msg】:req.query:${JSON.stringify(req.query)}`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(!req.query.redPacketId || !req.query.status){ 	
        wf.printLog(str);
		return res.json({successInfo:{result:202,msg:"请求参数错误"}});   
	}else{     
		token = sct.validate(req,res,str);
		if(token!=req.headers.authorization){
			res.setHeader('x-access-token', token);
		}
	    redPacketModel.findRedPacket(req,res,token);      
	}
})

//找用户的红包  userId pageSize pageIndex type 0=收取的 1=发出的 
router.get('/findUserRedPackets',function(req,res){
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:findRedPackets \r【headers】:${req.headers.authorization} \r【errType】:请求参数错误 \r【msg】:req.query:${JSON.stringify(req.query)}`;
	if(req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(!req.query['userId']||!req.query.pageSize||!req.query.pageIndex||!req.query.type){ 	
        wf.printLog(str);
		return res.json({successInfo:{result:202,msg:"请求参数错误"}});   
	}else{     
		token = sct.validate(req,res,str);
		if(token!=req.headers.authorization){
			res.setHeader('x-access-token', token);
		}
	    redPacketModel.findUserRedPacket(req,res,token);      
	}
})

//发红包 userId,type,content,imgs,amount,num,redRange,lng,lat,payId,cityCode,moneys
//?userId=US20180706152326F2743T&type=0&content=agagg&imgs=sgag&moneys=45&num=10&redRange=0&lng=22.2445&lat=99.23355&cityCode=012023
router.post('/insertRedPacket',function(req,res){
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:insertRedPacket \r【headers】:${req.headers.authorization} \r`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}

	if(!req.body.userId||req.body.type==undefined||!req.body.content
		||!req.body.imgs||!req.body.moneys||!req.body.num
		||!req.body.payId||!req.body.lng||!req.body.lat
		||!req.body.cityCode||!req.body.redRange){ 
        wf.printLog(str+`【msg】:请求参数错误 \r【body】:${JSON.stringify(req.body)}`);
		return res.json({successInfo:{result:202,msg:"请求参数错误"},body:req.body});   
	}else{     
		if(req.body.num>2000){
			wf.printLog(str+`【body】:${JSON.stringify(req.body)} \r【msg】:红包数量不能超过2000个`);
			return res.json({successInfo:{result:201,msg:"红包数量不能超过2000个"}});   
		}else{
			token = sct.validate(req,res,str);
			if(token!=req.headers.authorization){
				res.setHeader('x-access-token', token);
			}
			redPacketModel.setRedPacket(req,res,token);  
		}
	}
})


//附近的红包 lng lat
router.get('/nearbyRedPackets',function(req,res){
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:nearbyRedPacket \r【headers】:${req.headers.authorization} \r【msg】:请求参数错误 \r【query】:${JSON.stringify(req.query)}`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(req.query['lng']==undefined||req.query['lat']==undefined){ 
        wf.printLog(str);
		return res.json({successInfo:{result:202,msg:"请求参数错误"}});   
	}else{     
		token = sct.validate(req,res,str);
		if(token!=req.headers.authorization){
			res.setHeader('x-access-token', token);
		}
	    redPacketModel.nearbyRedPacket(req,res,token);      
	}
})

//获取红包 userId advertId
router.post('/obtainRedPacket',function(req,res){
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:obtainRedPacket \r【headers】:${req.headers.authorization} \r【msg】:请求参数错误 \r【body】:${JSON.stringify(req.body)}`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(!req.body['userId']||!req.body['advertId']||!req.body.money){ 
        wf.printLog(str);
		return res.json({successInfo:{result:202,msg:"请求参数错误"}});   
	}else{    
		token = sct.validate(req,res,str);
		if(token!=req.headers.authorization){
			res.setHeader('x-access-token', token);
		}
	    redPacketModel.obtainRedPacket(req,res,token);      
	}
})

module.exports = router;