var connPool = require("../models/connPool");
var wf = require("../jsbean/writefile");
var clientIP = require("../jsbean/clientIP");
var moment = require('moment');
var LoginBean = require("../jsbean/LoginBean");
var async = require('async');
var fs = require('fs');

Number.prototype.toFixed = function(s){
	return (parseInt(this * Math.pow( 10, s ) + 0.5)/ Math.pow( 10, s )).toString();
}

function float(n,m){
	return parseFloat(n.toFixed(m));
}

module.exports = {
	//找指定的红包 已被领取的红包
	findRedPacket(req,res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
		str = `【IP】:${IP} \r【Interface】:findRedPacket \r【query】:${JSON.stringify(req.query)} \r【headers】:${req.headers.authorization} \r`;
		pool.getConnection(function(err,conn){
			if(err){ 
                wf.printLog(str+`【errType】:获取数据库连接错误 \r【msg】:${err.message}`);
            	return res.json({successInfo:{result:500,msg:"获取数据库连接错误:"+err.message},err:err}); 
            }           
            if(req.query.status=='1'){
        		//找已被领取的红包
        		userSql = `select * from red_advert_redpacket where redPacketId=? and status=? order by updtime`; 
        		param = [req.query.redPacketId,1];
        	}else{
        		//找指定的红包
        		userSql = `select * from red_redpacket where redPacketId=?`; 
        		param = [req.query.redPacketId];
        	}  
            conn.query(userSql,param,function(err,rs){   
                if(err){   
                    wf.printLog(str+`【errType】:查询数据库失败 \r【msg】:${err.message}`);
                    return res.json({successInfo:{result:500,msg:"查询数据库失败:"+err.message},err:err});
                }   
                if(rs.length > 0){  
                	rs.forEach((it)=>{
                		it.createtime = moment(it.createtime).format('YYYY-MM-DD HH:mm:ss');
                		it.updtime = moment(it.updtime).format('YYYY-MM-DD HH:mm:ss');
                	});
                	return res.json({successInfo:{result:100,msg:"查询成功"},listInfo:rs,err:err});  
                }else{
                	return res.json({successInfo:{result:200,msg:"查询成功"},listInfo:rs,err:err});  
                }                 
            })   
            conn.release();
        });
	},
	//找用户的红包 发出的 收取的
	findUserRedPacket(req,res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
		str = `【IP】:${IP} \r【Interface】:findUserRedPacket \r【query】:${JSON.stringify(req.query)} \r【headers】:${req.headers.authorization} \r`;
		pool.getConnection(function(err,conn){
			if(err){ 
                wf.printLog(str+`【errType】:获取数据库连接错误 \r【msg】:${err.message}`);
            	return res.json({successInfo:{result:500,msg:"获取数据库连接错误:"+err.message},err:err}); 
            }           
            pageSize = req.query.pageSize;
        	pageIndex = req.query.pageIndex;
        	pageSize = Number(pageSize);
        	pageIndex = Number(pageIndex);
        	index = (pageIndex-1)*pageSize;
        	param = [req.query.userId];
        	if(req.query.type=='0'){ //收取的
        		userSql = `select * from red_advert_redpacket where userId=? order by updtime`; //limit ${index},${pageSize}
        		conn.query(userSql,param,function(err,rs){   
	                if(err){   
	                    wf.printLog(str+`【errType】:查询数据库失败 \r【msg】:${err}`);
	                    return res.json({successInfo:{result:500,msg:"查询数据库失败:"+err.message}});
	                }   
	                count = 0;
	                list = [];
	                if(rs.length > 0){  
	                	rs.forEach((it)=>{
	                		count += it.moneys;
	                		it.userInfo = JSON.parse(it.userInfo);
	                		it.createtime = moment(it.createtime).format('YYYY-MM-DD HH:mm:ss');
	                		it.updtime = moment(it.updtime).format('YYYY-MM-DD HH:mm:ss');
	                	});
	                	list = rs.slice(index,pageSize*pageIndex);
	                }
	                if(list.length>0){
	                	return res.json({successInfo:{result:100,msg:"查询成功"},listInfo:list,count:count}); 
	                }else{
	                	return res.json({successInfo:{result:200,msg:"查询成功"},listInfo:list,count:count}); 
	                }
	            })
        	}else{ //发出的
        		userSql = `select * from red_redpacket where userId=? order by createtime`; 
        		//子查询
        		sqltwo = `select count(advertId) as linkNum from red_advert_redpacket where redPacketId in (select redPacketId from red_redpacket where userId=?) and status=1`; 
        		async.parallel({ //串行series,并行parallel
	                one:function(callback) {
	                    conn.query(userSql,param,function(err,rs){
	                        if(err){
	                            callback(err,1);
	                            return;
	                        }
	                        callback(err,rs);
	                    });
	                },
	                two:function(callback) {
	                    conn.query(sqltwo,param,function(err,rs){
	                        if(err){
	                            callback(err,2);
	                            return;
	                        }
	                        callback(err,rs);
	                    });
	                }
	            },function(err, ress) {
	                if(err) {
	                    wf.printLog(str+`【msg】:查询数据库失败:${JSON.stringify(err)}`);
	                    res.json({successInfo:{result:500,msg:"查询数据库失败"},err:err});
	                    return;
	                }
	                count = 0;
	                list = [];
	                if(ress.one.length > 0){  
	                	ress.one.forEach((it)=>{
	                		count += it.amount;
	                		it.imgs = it.imgs.split(';');
	                		it.userInfo = JSON.parse(it.userInfo);
	                		it.createtime = moment(it.createtime).format('YYYY-MM-DD HH:mm:ss');
	                		it.updtime = moment(it.updtime).format('YYYY-MM-DD HH:mm:ss');
	                	});
	                	list = ress.one.slice(index,pageSize*pageIndex);
	                }
	                if(list.length>0){
	                	return res.json({successInfo:{result:100,msg:"查询成功"},listInfo:list,count:count,linkNum:ress.two[0].linkNum}); 
	                }else{
	                	return res.json({successInfo:{result:200,msg:"查询成功"},listInfo:list,count:count,linkNum:ress.one[0].linkNum}); 
	                }
	            });
        	} 
            conn.release();
        });
	},
	//发红包 发祝福
	setRedPacket(req,res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
		str = `【IP】:${IP} \r【Interface】:setRedPacket \r【body】:${JSON.stringify(req.body)} \r【headers】:${req.headers.authorization} \r`;
		pool.getConnection(function(err,conn){
			if(err){ 
                wf.printLog(str+`【msg】:${err.message}`);
            	return res.json({successInfo:{result:500,msg:"获取数据库连接错误:"+err.message},err:err}); 
            }           
            ids = 'RP'+ moment().format('YYYYMMDDHHmmss')+wf.getCode(6);  
            uploadurl='/images/broadcast/'+moment().format('YYYYMMDD') + '/';    
            //创建文件夹 
			fs.mkdir('./public'+uploadurl,function(err){
			   	if (err) {
			   		wf.printLog(str+`【msg】:创建文件夹 \r【err】:${err}`)
			       	return console.error(err);
			   	}
			});
			list = req.body.imgs;
        	list = JSON.parse(list);
        	imgs = '';
        	bath = 'http://'+req.headers.host;
        	list.forEach((it,i)=>{        		
        		arr = it.split(';base64,');
        		suffix = arr[0].substr(arr[0].indexOf('/')+1);
        		if(!/(png|jpe?g|gif)/.test(suffix)){
        			wf.printLog(str+`【msg】:文件类型不为图片 suffix：${suffix}`);
        			return res.json({successInfo:{result:200,msg:"请确认文件类型为图片或gif动图"},suffix:suffix}); 
        		}
        		bitmap = new Buffer(arr[1], 'base64');
        		timestamp = new Date().getTime(); 
        		newpath = uploadurl+timestamp+i+'.'+suffix;
    			fs.writeFileSync('./public'+newpath, bitmap); //写入失败 易使程序中断运行
    			imgs += bath+newpath +';';
        	})
        	imgs = imgs.substr(0,imgs.lastIndexOf(';'))
        	
            sqlone = 'select headImg,uname,amount from red_user where userId=?'; 
            sqltwo = `insert into red_redpacket 
	            	(redPacketId,userId,type,content,imgs,amount,rpNum,redRange,lng,lat,payId,cityCode,moneys,userInfo,rate,createtime,updtime) 
	            	values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,0.325,current_timestamp,current_timestamp)`;
            partwo = [ids,req.body.userId,req.body.type,req.body.content,imgs,req.body.moneys,req.body.num,req.body.redRange,req.body.lng,req.body.lat,req.body.payId,req.body.cityCode]; 
        	
        	//删除图片
        	var removeImg = (imgStr)=>{
        		imgList = imgStr.split(';');
                reg = new RegExp('http://'+req.headers.host);
                imgList.forEach((it)=>{
                	imgSrc = it.replace(reg,'./public');
                	fs.unlink(imgSrc,function (err) {
	                    if(err) wf.printLog(str+`【msg】:删除图片失败 \r【path】${it}`)
	                })
                })
        	}
           	conn.query(sqlone,[req.body.userId],function(err,rs){
                if(err){   
                	removeImg(imgs);
                	wf.printLog(str+`【msg】:"查询数据库失败:"${err.message}`); 
                    return res.json({successInfo:{result:500,msg:"查询数据库失败:"+err.message},err:err}); 
                }   
                wf.printLog(str+`【msg】:查询用户信息成功;results:${JSON.stringify(rs)}`); 
                num = parseInt(req.body['num']);
                money1 = parseInt(req.body['moneys']);
                money2 = money1 * (1-0.325);
                partwo.push(parseFloat((money1 * 0.325).toFixed(2)));
                partwo.push(JSON.stringify({headImg:rs[0].headImg,uname:rs[0].uname}));
                //advertId redPacketId redRange lng lat cityCode moneys 
                sqlthere = `insert into red_advert_redpacket (advertId,redPacketId,redRange,lng,lat,cityCode,moneys,createtime,updtime) values ?`;
                parthere = [];

                radc = function(m,i,tg){ //区
                	m = m.toString();
                	str = m.substr(0,m.indexOf('.')+1);
                	//str1 = m.substr(m.indexOf('.')+2,2);
                	if(i%2==0&&tg=='lng'){
	                	str2 = Math.floor(Math.random() * (4444-1111)+1111);
	              	}else{
	              		str2 = Math.floor(Math.random() * (9999-1111)+1111);
	              	}
	              	//n = str1 + str2
	              	//str1 = Number(str1);
	              	if(i%2!=0&&tg=='lat'){
	              		str2 = Math.floor(Math.random() * (9999-1111)+1111);
	              	}else{
	              		str2 = Math.floor(Math.random() * (4444-1111)+1111);
	              	}
                	str3 = m.substr(m.indexOf('.')+5);
                	str3 = str3 ? str3 : '';
	                return str + str2+ str3;
                }
                for(let i=0;i<num;i++){
                	lng = radc(req.body['lng'],i+1,'lng');
                	lat = radc(req.body['lat'],i+1,'lat');
                	timd = moment().format('YYYY-MM-DD HH:mm:ss');
                	randMoney = Math.random() * (money2/num);
                	randMoney = parseFloat(randMoney.toFixed(4));
            		ar = 'AR'+ moment().format('YYYYMMDDHHmmss')+wf.getCode(6);     
                	arr = [ar,ids,req.body['redRange'],lng,lat,req.body['cityCode'],randMoney,timd,timd]
                	parthere.push(arr);
                }
               	conn.beginTransaction(function (err) {
	                if (err) {
	                	removeImg(imgs);
	                    wf.printLog(str+`【errType】:启动事物处理出错 \r【msg】:${err.message}`);
	                    return res.json({successInfo:{result:500,msg:"启动事物处理出错:"+err.message},err:err});
	                }
	                async.series([ //串行series,并行parallel
	                    function(callback) {
	                        conn.query(sqltwo,partwo,function(err,rs){
	                            if(err){
	                                callback(err,1);
	                                return;
	                            }
	                            callback(err,rs);
	                        });
	                    },
	                    function(callback) {
	                        conn.query(sqlthere,[parthere],function(err,rs){
	                            if(err){
	                                callback(err,2);
	                                return;
	                            }
	                            callback(err,rs);
	                        });
	                    }
	                ],function(err, ress) {
	                    if(err) {//调用回滚1';
	                    	removeImg(imgs);
				            wf.printLog(str+`【errType】:回滚1写入数据库失败 \r【msg】:${err}`);
	                        conn.rollback(function() { });
	                        return res.json({successInfo:{result:500,msg:"回滚1写入数据库失败:"+err},err:err});
	                    }
	                    // 提交事务 写入磁盘
	                    conn.commit(function(err) {
	                        if (err) {//调用回滚2
	                        	removeImg(imgs);
				            	wf.printLog(str+`【errType】:提交事物出错 \r【msg】:${err}`);
	                            conn.rollback(function(){});
	                            return res.json({successInfo:{result:500,msg:"提交事物出错:"+err},err:err});
	                        }
				            wf.printLog(str+`【msg】:发红包成功;`); 
	                        return res.json({successInfo:{result:100,msg:"发红包成功"},err:err}); 
	                    });
	                });
	            });
	           
	        });
            conn.release();
		})
	},
	//收取红包
	obtainRedPacket(req,res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
		str = `【IP】:${IP} \r【Interface】:obtainRedPacket \r【body】:${JSON.stringify(req.body)} \r【headers】:${req.headers.authorization} \r`;
		pool.getConnection(function(err,conn){
			if(err){ 
                wf.printLog(str+`【msg】:${err.message}`);
            	res.json({successInfo:{result:500,msg:"获取数据库连接错误:"+err.message},err:err}); 
               	return; 
            }
            sqlone = 'select headImg,uname,amount from red_user where userId=?'; 

            conn.query(sqlone,[req.body.userId],function(err,rs){
                if(err){   
                	wf.printLog(str+`【msg】:"查询数据库失败:"${err.message}`); 
                    return res.json({successInfo:{result:500,msg:"查询数据库失败:"+err.message},err:err});    
                }   
                wf.printLog(str+`【msg】:查询用户信息成功;results:${JSON.stringify(rs)}`); 

                amount = rs[0].amount + parseFloat(req.body.money);
                time = moment().format('YYYY-MM-DD HH:mm:ss');

                sqltwo = `update red_advert_redpacket set status=1,userId=?,userInfo=?,updtime=? where advertId=?`;
                partwo = [req.body.userId,JSON.stringify({headImg:rs[0].headImg,uname:rs[0].uname}),time,req.body.advertId];
                sqlthere = `update red_user set amount=${amount} where userId=?`;
                
                conn.beginTransaction(function (err) {
	                if (err) {
	                    wf.printLog(str+`【errType】:启动事物处理出错 \r【msg】:${err.message}`);
	                    return res.json({successInfo:{result:500,msg:"启动事物处理出错:"+err.message},err:err});
	                }
	                async.series([ //串行series,并行parallel
	                    function(callback) {
	                        conn.query(sqltwo,partwo,function(err,rs){
	                            if(err){
	                                callback(err,1);
	                                return;
	                            }
	                            callback(err,rs);
	                        });
	                    },
	                    function(callback) {
	                        conn.query(sqlthere,[req.body.userId],function(err,rs){
	                            if(err){
	                                callback(err,2);
	                                return;
	                            }
	                            callback(err,rs);
	                        });
	                    }
	                ],function(err, ress) {
	                    if(err) {//调用回滚1';
				            wf.printLog(str+`【errType】:回滚1写入数据库失败 \r【msg】:${err}`);
	                        conn.rollback(function() { });
	                        return res.json({successInfo:{result:500,msg:"回滚1写入数据库失败:"+err},err:err});
	                    }
	                    // 提交事务 写入磁盘
	                    conn.commit(function(err) {
	                        if (err) {//调用回滚2
				            	wf.printLog(str+`【errType】:提交事物出错 \r【msg】:${err}`);
	                            conn.rollback(function(){});
	                            return res.json({successInfo:{result:500,msg:"提交事物出错:"+err}});
	                        }
				            wf.printLog(str+`【msg】:获取红包成功`); 
	                        return res.json({successInfo:{result:100,msg:"获取红包成功"},err:err}); 
	                    });
	                });
	            });
            });
            conn.release();
		})  
	},
	//附近的红包
	nearbyRedPacket(req,res){
		pool = connPool();
		IP = clientIP.getClientIp(req);
		str = `【IP】:${IP} \r【Interface】:nearbyRedPackets \r【query】:${JSON.stringify(req.query)} \r【headers】:${req.headers.authorization} \r`;
		pool.getConnection(function(err,conn){
			if(err){ 
                wf.printLog(str+`【msg】:${err.message}`);
            	return res.json({successInfo:{result:500,msg:"获取数据库连接错误:"+err.message},err:err}); 
            }
            //having distance <30000
           	sql = `SELECT *,ROUND(
			        6378.138 * 2 * ASIN(
			            SQRT(
			                POW(
			                    SIN( (${req.query.lat} * PI() / 180 - lat * PI() / 180) / 2 ),2
			                ) + 
			                COS(${req.query.lat} * PI() / 180) * COS(lat * PI() / 180) * POW(
			                    SIN( (${req.query.lng} * PI() / 180 - lng * PI() / 180) / 2 ),2
			                )
			            )
			        ) * 1000
			    ) AS distance
				FROM red_advert_redpacket having distance < 1000 and status=0 ORDER BY distance ASC limit 0,15`;

			param = [req.query['lng'],req.query['lat']];

           	conn.query(sql,param,function(err,rs){
                if(err){   
                	wf.printLog(str+`【msg】:"查询数据库失败:"${err.message}`); 
                    return res.json({successInfo:{result:500,msg:"查询数据库失败:"+err.message},err:err}); 
                }   
                wf.printLog(str+`【msg】:获取红包成功;`); 

                if(rs.length > 10){  
                	rs.forEach((it)=>{
                		it.createtime = moment(it.createtime).format('YYYY-MM-DD HH:mm:ss');
                		it.updtime = moment(it.updtime).format('YYYY-MM-DD HH:mm:ss');
                	});
                	return res.json({successInfo:{result:100,msg:"查询成功"},listInfo:rs,err:err}); 
                }else{
                	//附近没有红包，自动生成
                	ids = 'RP'+moment().format('YYYYMMDDHHmmss')+wf.getCode(6);  
                	headImg = 'http://'+req.headers.host+'/images/qmlogo.png';
                	num = 15;
	                money1 = 2;
	                money2 = money1 * (1-0.325);

	                partwo = [ids,2,headImg,money1,num,3,req.query.lng,req.query.lat];
	                partwo.push(parseFloat((money1 * 0.325).toFixed(2)));
	                partwo.push(JSON.stringify({headImg:headImg,uname:'千米红包'}));

                	sqltwo = `insert into red_redpacket 
	            	(redPacketId,type,imgs,amount,rpNum,redRange,lng,lat,moneys,userInfo,rate,userId,createtime,updtime) 
	            	values(?,?,?,?,?,?,?,?,?,?,0.325,'US01',current_timestamp,current_timestamp)`;
            		 
        			sqlthere = `insert into red_advert_redpacket (advertId,redPacketId,redRange,lng,lat,moneys,createtime,updtime) values ?`;
	                parthere = [];

	                radc = function(m,i,tg){ //千米
	                	m = m.toString();
	                	str = m.substr(0,m.indexOf('.')+3);
	                	//str1 = m.substr(m.indexOf('.')+2,2);
	                	if(i%2==0&&tg=='lng'){
		                	str2 = Math.floor(Math.random() * (79-60)+60);
		              	}else{
		              		str2 = Math.floor(Math.random() * (99-80)+80);
		              	}
		              	//n = str1 + str2
		              	//str1 = Number(str1);
		              	/*if(i%2!=0&&tg=='lat'){
		              		str = m.substr(0,m.indexOf('.')+2);
		              		str1 = m.substr(m.indexOf('.')+2,2);
		              		str1 = Number(str1);
		                	str2 = Math.floor(Math.random() * (50-10)+10);
		                	str2 = str1+str2;
		                	console.log(str2)
		              	}else{
		              		str2 = Math.floor(Math.random() * (99-80)+80);
		              	}*/
	                	str3 = m.substr(m.indexOf('.')+5);
	                	str3 = str3 ? str3 : '';
		                return str + str2+ str3;
	                }
	                for(let i=0;i<num;i++){
	                	lng = radc(req.query['lng'],i+1,'lng');
	                	lat = radc(req.query['lat'],i+1,'lat');
	                	timd = moment().format('YYYY-MM-DD HH:mm:ss');
	                	randMoney = Math.random() * (money2/num);
	                	randMoney = parseFloat(randMoney.toFixed(4));
	            		ar = 'AR'+ moment().format('YYYYMMDDHHmmss')+wf.getCode(6);  
	                	arr = [ar,ids,0,lng,lat,randMoney,timd,timd]
	                	parthere.push(arr);
	                }
                	conn.beginTransaction(function (err) {
		                if (err) {
		                    wf.printLog(str+`【errType】:启动事物处理出错 \r【msg】:${err.message}`);
		                    return res.json({successInfo:{result:500,msg:"启动事物处理出错:"+err.message},err:err});
		                }
		                async.series([ //串行series,并行parallel
		                    function(callback) {
		                        conn.query(sqltwo,partwo,function(err,rs){
		                            if(err){
		                                callback(err,1);
		                                return;
		                            }
		                            callback(err,rs);
		                        });
		                    },
		                    function(callback) {
		                        conn.query(sqlthere,[parthere],function(err,rs){
		                            if(err){
		                                callback(err,2);
		                                return;
		                            }
		                            callback(err,rs);
		                        });
		                    },
		                    function(callback) {
		                        conn.query(sql,param,function(err,rs){
		                            if(err){
		                                callback(err,2);
		                                return;
		                            }
		                            callback(err,rs);
		                        });
		                    }
		                ],function(err, ress) {
		                    if(err) {//调用回滚1';
					            wf.printLog(str+`【errType】:回滚1写入数据库失败 \r【msg】:${err}`);
		                        conn.rollback(function() { });
		                        return res.json({successInfo:{result:500,msg:"回滚1写入数据库失败:"+err},err:err});
		                    }
		                    // 提交事务 写入磁盘
		                    conn.commit(function(err) {
		                        if (err) {//调用回滚2
					            	wf.printLog(str+`【errType】:提交事物出错 \r【msg】:${err}`);
		                            conn.rollback(function(){});
		                            return res.json({successInfo:{result:500,msg:"提交事物出错:"+err},err:err});
		                        }
					            wf.printLog(str+`【msg】:查询成功;`); 
					            ress[2].forEach((it)=>{
			                		it.createtime = moment(it.createtime).format('YYYY-MM-DD HH:mm:ss');
			                		it.updtime = moment(it.updtime).format('YYYY-MM-DD HH:mm:ss');
			                	});
		                        return res.json({successInfo:{result:100,msg:"查询成功"},listInfo:ress[2],err:err}); 
		                    });
		                });
		            });
                }
	        });
        	conn.release();
		})   
	}
}
