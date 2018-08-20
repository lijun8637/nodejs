var fs = require('fs');
var moment = require('moment');

module.exports = {
	printLog(str){
        const date = moment().format('YYYY-MM-DD');
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        const content = `【Time】：${time} \r${str}\r\r`; 
        this.appendfile('./logTxt/'+date+'.txt',content);
    },
    appendfile:function(path,data){    //异步方式追加
        fs.appendFile(path,  data,  function  (err)  {
            if  (err)  {
                throw  err;
            }
        });
    },
    writefile:function(path,data){    //异步方式
        fs.writeFile(path,  data,  function  (err)  {
            if  (err)  {
                throw  err;
            }
        });
    },
    writefilesync:function(path,data){  //同步方式
        fs.writeFileSync(path,  data);
    },
    randomNum : function(min,max){
        return Math.floor(Math.random() * (max - min) + min);
    },
    getCode : function(leng){
        code = '';
        random = new Array('A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R', 'S','T','U','V','W','X','Y','Z',0,1,2,3,4,5,6,7,8,9);
        for(i = 0; i < leng; i++) {
            txt = random[this.randomNum(0,random.length)];
            code += txt;
        }        
        return code; //moment().format('YYYYMMDDHHmmss')+
    }
    
}