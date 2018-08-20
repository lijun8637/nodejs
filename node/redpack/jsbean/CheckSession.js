//模块化 session
module.exports ={
    check:function(req,res){
        loginbean = req.session.loginbean; 
        if(loginbean==undefined){ 
        	res.json({successInfo:{result:205,msg:"登录状态过期,请重新登录"}});  
            return false;
        } 
        return loginbean;
    }
}