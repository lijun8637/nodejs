var jwt = require("jsonwebtoken");
var wf = require("./writefile");
var crypto = require('crypto');
//console.log(crypto.getHashes()); // 打印支持的hash算法
//console.log(crypto.getCiphers());

module.exports = {
	secretstr:function (token){
		return 'GciOiJIUzI1NiIsInR5cCI6IkpOiJVUzIwMTgwNzEwMTQzMzIzTklFQzlWIiwicGhvbmUiO';
	},
	aesSecret(){
		return 'CI6IkpOiJVUzIwMTgwNzE97823hf90af09832wMTQzMzIzTklFQzlWI';
	},
	//http://blog.fens.me/nodejs-crypto/
	//http://www.cnblogs.com/laogai/p/4664917.html
	//加密
	cipher (txt){
		secret = this.aesSecret();
      	var cipher = crypto.createCipher('aes192', secret);
      	var enc = cipher.update(txt, 'utf8', 'hex');//编码方式从utf-8转为hex;
      	enc += cipher.final('hex');//编码方式从转为hex;
      	return enc;
	},
	decipher(txt){
		secret = this.aesSecret();
     	var decipher = crypto.createDecipher('aes192', secret);
     	var dec = decipher.update(txt, 'hex', 'utf8');//编码方式从hex转为utf-8;
     	dec += decipher.final('utf8');//编码方式从utf-8;
     	return dec;
	},
	validate:function(req,res,str,time){
		secret = this.secretstr();
		token = req.headers.authorization;
		try{
			//token1 = this.decipher(token);
			decoded = jwt.verify(token, secret);
			//console.log(decoded)
			wf.printLog(str+`【decoded】:${JSON.stringify(decoded)}`); 
        	newT = new Date()/1000;
        	if(token && decoded.exp>newT){
        		surplus = decoded.exp - newT;
        		if(surplus < 600 && surplus > 0){
        			var content ={userId:decoded.userId,phone:decoded.phone}; 
        			//24小时过期 2 days 1d 10h 2.5 hrs 2h 1m 5s 1y
                    token = jwt.sign(content, secret, { expiresIn: (time? time : '1h') }); 
                    //token = this.cipher(token2);
        		}
	            req.decoded = decoded;
	            return token;
	        }else{
	        	return res.json({successInfo:{result:205,msg: decoded,err:'jwt expired'}});
	        }
		}catch(err){
			wf.printLog(str+`【err】:${err}`); 
			return res.json({successInfo:{result:205,msg:'无效签名',err:err.message }});
		}	
	}
};