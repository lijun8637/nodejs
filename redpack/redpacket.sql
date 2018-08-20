"ejs": "~2.5.7",
#//建库
create database redpacket;

use redpacket;

create table red_user( 
      uid int not null primary key auto_increment, 
      userId varchar(30) not null, 
      amount decimal(20,4) not null default 0,
      sex int not null default 0,  /*0=未知 1=男 2=女 current_timestamp*/
      headImg varchar(120) not null, 
      phone varchar(60) not null, 
      uname varchar(120) not null, 
      pwd varchar(60) not null,
      redRange int not null default 1000, 
      token text not null,
      lgNum int not null default 0,
      createtime timestamp not null,
      updtime timestamp not null 
)ENGINE=InnoDB DEFAULT CHARSET=utf8; 

#money orderId payType backUrl
create table red_order( 
      did int not null primary key auto_increment, 
      userId varchar(30) not null, 
      money decimal(20,2) not null default 0,
      orderId varchar(30) not null, 
      payType varchar(30) not null, 
      backUrl varchar(120) not null, 
      createtime timestamp not null,
      updtime timestamp not null 
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table red_redpacket(
	rid bigint not null primary key auto_increment,
	redPacketId varchar(30) not null,    /**/
	userId varchar(30) not null, 
	type int not null default 0,	/*0=发红包 1=发祝福 2=官方广告红包*/
	likes int not null default 0,
	payId varchar(30) not null,   /*支付完成后返回的订单号*/
	content text not null,    		/**/
	imgs varchar(240) not null,		/*红包广告图片*/
	redRange int not null default 0, /*红包范围 0=一公里 1=区/县 2=全市  3=全国*/
	lng decimal(20,14) not null default 0,	/*经度*/
	lat decimal(20,14) not null default 0,	/*纬度*/
	cityCode int not null default 0,
	address varchar(240) not null, 
	amount decimal(20,2) not null default 0, /*红包总额*/
	moneys decimal(20,2) not null default 0, /*服务费*/
	rate decimal(10,3) not null default 0.325,
	rpNum	int not null default 0,		/*红包个数*/
	userInfo text not null,   
	createtime timestamp not null,
	updtime timestamp not null 
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

##advertId redPacketId redRange lng lat cityCode moneys 
create table red_advert_redpacket( 
	aid bigint not null primary key auto_increment,
	advertId varchar(30) not null,
	redPacketId varchar(30) not null,    /**/
	status int not null default 0,	/*0=未领取 1=已领取*/
	userId varchar(30) not null, 	/*领取红包用户*/
	userInfo text not null,    
	redRange int not null default 0, /*红包范围 0=一公里 1=区/县 2=全市  3=全国*/
	lng decimal(20,14) not null default 0,
	lat decimal(20,14) not null default 0,
	cityCode int not null default 0,
	moneys decimal(20,4) not null default 0,
	createtime timestamp not null,
	updtime timestamp not null 
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

#topicId,topicType,redPacketId,userId,toUId,content,parentId,userInfo,createtime,updtime
#topicId,topicType,redPacketId,userId,toUId,content,parentId,userInfo,createtime,updtime
CREATE TABLE red_comment(
	cid bigint not null primary key auto_increment,
	topicId varchar(30) not null,	/*评论id*/
	redPacketId varchar(30) not null,    
	userId varchar(30) not null,    /*评论用户id*/
	toUId varchar(30) not null,		/*评论目标用户id*/
	parentId varchar(30) not null,
	topicType varchar(30) not null,	/*评论类型 0=评论 1=回复*/
	status int not null default 0,  /*评论状态 0=已审核 1=未审核*/
	content text not null,    		/*内容*/
	userInfo text not null,
	likes int not null default 0, #点赞数量
	uslist text not null,		#点赞用户id 列表
	createtime timestamp not null,
	updtime timestamp not null 
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE red_area(
	aid bigint not null primary key auto_increment,
	codeId varchar(50) not null,
	parentId varchar(50) not null,
	cityName varchar(50) not null
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

select uid,name,pwd from user where name=? and pwd=?;

#这个就是从 后面往前取
select top n * from red_user order by 列名(基本上任意) desc

#先取出前20 在去不在前20行里的余下的所有数据的前10行 就是取20到30行中间的
select top 10 from red_advert_redpacket where redPacketId not in(select top 20 redPacketId from red_advert_redpacket)

#查询 name in ('张三','李四') 排序以 age 降序 每个结果集只显示前三个结果
select * from red_user limit 3 where name in ('张三','李四') order by age

#查询包含2的记录
select * from red_area where codeId like %2%;

#select 选择的列 
#from 表 
#where 查询的条件
#group by  分组属性  having 分组过滤的条件
#order by 排序属性
#limit 起始记录位置，取记录的条数 
select * from red_advert_redpacket where redPacketId=? order by createtime limit 1,15


insert into user (name,pwd,createtime) values(?,?,current_timestamp)

#更新 zhangsan 的 password 为 ddd
update users set password ="ddd" where name="zhangsan"

delete from  users where name="zhangsan"

##删表
drop table user;

##删表
	drop table question;

	##查询数据库表
	desc user #查询表结构
	select * from user; # 查询表数据
	##删列	
	delete  from user;

	#查找数据库 
	#mysql> 
	show databases;
	show tables;

#var usr={name:'zhangsan',password:'pwdzhangsan',mail:'zhangsan@gmail.com'};

#connection.query('insert into users set ?', usr, function(err, result) {})