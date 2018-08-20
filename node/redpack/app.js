var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
//
var bodyParser = require('body-parser');
var session = require('express-session'); 
var logger = require('morgan');
var fs = require('fs');
var FileStreamRotator = require('file-stream-rotator');
var moment = require('moment');
var wf = require("./jsbean/writefile");
//var jwt = require('jwt-simple');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var orderRouter = require('./routes/order');
var redPacketRouter = require('./routes/redPacket');
var redPacketCommentRouter = require('./routes/redpacketComment');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.set('jwtTokenSecret', 'YOUR_SECRET_STRING');


var secretstr = wf.getCode(114);

/**
 * proxy代理
 */
var proxy = require('http-proxy-middleware');//引入代理中间件
/*
var dataProxy = proxy('/data', { target: "http://www.imooc.com/", changeOrigin: true });//将服务器代理到http://www.imooc.com上，本地服务器为localhost:3000
app.use('/data/*', dataProxy);//data子目录下的都是用代理*/
//app.use('/API', proxy({ target: 'http://test.posqm.cn',   changeOrigin: true, pathRewrite: {'/API' : ''} }));


//上传文件临时文件夹
app.use(bodyParser({uploadDir:'./uploadtemp'}));
//app.use(bodyParser.json()); //返回一个只解析json的中间件，最后保存的数据都放在req.body对象上
//app.use(bodyParser.urlencoded({ extended: false })); //返回的对象不为任意类型

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(secretstr));
app.use(express.static(path.join(__dirname, 'public')));

//设置session
/*app.use(session({
  secret: secretstr, // 建议使用 128 个字符的随机字符串    
	cookie: { maxAge: 3 * 24 * 60 * 60 }, //cookie生存周期20*60秒    
	resave: true,  //cookie之间的请求规则,假设每次登陆，就算会话存在也重新保存一次    
	saveUninitialized: true //强制保存未初始化的会话到存储器    
}));*/

//.log
var logDirectory = __dirname + '/logs';
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYY-MM-DD',
  filename: logDirectory + '/%DATE%.log',
  frequency: 'daily',
  verbose: false
})
// setup the logger
app.use(logger('dev'));
app.use(logger('combined', {stream: accessLogStream}));


app.use('/', indexRouter);
app.use('/order', orderRouter);
app.use('/users', usersRouter);
app.use('/redPacket', redPacketRouter);
app.use('/comment', redPacketCommentRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/*app.all("*",(req,res,next)=>{
  if (req.method === 'OPTIONS') {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Methods", "PUT,GET,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,username");
    next();
  }
})*/
/*app.all('*', function(req, res, next){
    var jsPattern = /\.js$/;
    var url = req.url;//req.orignalUrl;
    console.log(req.url)
    console.log(req.orignalUrl)
    if(jsPattern.test(url)){
      console.log('=========')
        next();
        return;
    }
    if(url=='index.html'||url=='error.html'){
        next();
        return;
    }
    next();
});*/

module.exports = app;
