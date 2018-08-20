var express = require('express');
var router = express.Router();
var clientIP = require("../jsbean/clientIP");
var wf = require("../jsbean/writefile");
var commentModel = require("../models/redpacketCommentModel"); //连接池
var sct = require("../jsbean/secret");


//查询评论 redPacketId status 
router.get('/findComments',function(req,res){
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:findComments \r【errType】:参数错误 \r【headers】:${req.headers.authorization} \r【query】:${JSON.stringify(req.query)}`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(req.query['redPacketId']==undefined){ 
        wf.printLog(str);
		res.json({successInfo:{result:202,msg:"参数错误"}});   
	}else{     
		token = sct.validate(req,res,str);
	    commentModel.findComments(req,res,token);      
	}
})

//发表评论 redPacketId topicType userId toUId content
//redPacketId=RP201807061520061WJEDY&topicType=0&userId=US20180703160556CY1EQO&toUId=US20180703170556CY1EGH&content=红本本阿哥
//redPacketId=RP201807061520061WJEDY&topicType=1&userId=US20180703170556CY1EGH&toUId=US20180703160556CY1EQO&topicId=&content=回复回复更换是股票就是我
router.post('/insertComment',function(req,res){
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:insertComment \r【msg】:请求参数错误 \r【headers】:${req.headers.authorization} \r【body】:${JSON.stringify(req.body)}\r`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(!req.body['redPacketId'] || !req.body['userId'] || req.body['topicType']!=0 && req.body['topicType']!=1 || !req.body['toUId'] || !req.body['content']){ 
        wf.printLog(str+'comment1');
		return res.json({successInfo:{result:202,msg:"请求参数错误"}});   
	}else{     
		if(req.body['topicType']==1&&req.body['topicId'] || req.body['topicType']==0){
			token = sct.validate(req,res,str);
			commentModel.insertComment(req,res,token);   
		}else{
			wf.printLog(str+'comment2');
			return res.json({successInfo:{result:202,msg:"请求参数错误",body:req.body}});  
		}
	}
})
//updLikes 点赞
router.post('/updLikes',function(req,res){
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:updLikes \r【errType】:参数错误 \r【headers】:${req.headers.authorization} \r【body】:${JSON.stringify(req.body)}\r`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(!req.body['topicId'] || !req.body['userId']){ 
        wf.printLog(str+'updLikes1');
		return res.json({successInfo:{result:202,msg:"参数错误"}});   
	}else{     
		token = sct.validate(req,res,str);
		if(token!=req.headers.authorization){
			res.setHeader('x-access-token', token);
		}
	    commentModel.updLikes(req,res,token);      
	}
})

module.exports = router;