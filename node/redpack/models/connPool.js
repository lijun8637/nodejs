var mysql  = require('mysql'); 
module.exports = (function(){
	//var _value = 1;
	var pool = mysql.createPool({     
        host: 'localhost',       //主机 
        user: 'root',               //MySQL认证用户名 
        password: 'root',        //MySQL认证用户密码 
        database: 'redpacket', 
        port: '3306'                   //端口号 
    }); 
    
    //赋值
    pool.on('connection', function(connection) {  
        connection.query('SET SESSION auto_increment_increment=1'); 
    }); 
	return function(){
		return pool;
	}
})();