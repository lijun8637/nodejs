var express = require('express');
var router = express.Router();
var clientIP = require("../jsbean/clientIP");
var wf = require("../jsbean/writefile");
var orderModel = require('../models/orderModel');
var sct = require("../jsbean/secret");

//userId money orderId payType backUrl
router.post('/placeOrder', function(req, res, next) {
	IP = clientIP.getClientIp(req);
	str = `【IP】:${IP} \r【Interface】:placeOrder \r【msg】:请求参数错误 \r【body】:${JSON.stringify(req.body)} \r`;
	if(!req.headers.authorization){
		wf.printLog(str+`【msg】:无效的token`); 
		return res.json({successInfo:{result:206,msg:"无效的token"}}); 
	}
	if(!req.body.userId || !req.body.money || !req.body.orderId || !req.body.payType || !req.body.backUrl ){  
        wf.printLog(str);
		return res.json({successInfo:{result:202,msg:"请求参数错误"}});     
	}else{     
		token = sct.validate(req,res,str);
		if(token!=req.headers.authorization){
			res.setHeader('x-access-token', token);
		}
	    orderModel.placeOrder(req,res,token);      
	}   
});


module.exports = router;