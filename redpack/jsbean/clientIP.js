

module.exports = {
	getClientIp(req) {
		//反向代理IP //connection的远程IP  //后端的socket的IP
	    return req.headers['x-forwarded-for'] ||  
	    req.connection.remoteAddress ||		
	    req.socket.remoteAddress ||
	    req.connection.socket.remoteAddress;  
	}
}