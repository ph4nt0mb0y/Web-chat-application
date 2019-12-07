import express from 'express';
import validate from './public/server/models/validatepassword';  //Xác  thực đăng nhập
import msgdb from './public/server/models/msgDB';  //Thêm tin nhắn vào DB
import session from 'express-session';
import getHis from './public/server/models/getChatroomHistory';  //Lấy tin nhắn cũ
import getChatroom from './public/server/models/getRoomId';
import getListFriend from './public/server/models/getListFriend';
import Room from './public/server/models/addRoom';
import notification from './public/server/models/notification';
import getNotifi from './public/server/models/getNotifi';
import deleteRoom from './public/server/models/deleteRoom';
var getListInvi=require('./public/server/models/getListInvi');
var register=require('./public/server/models/register');
var addFriends=require('./public/server/models/addFriends');
var markInvi=require('./public/server/models/markInvi');
var removeInvi=require('./public/server/models/removeInvi');
var unfriend=require('./public/server/models/unfriend');
var multer=require('multer');
var path=require('path');
const port = 3000;
import bodyParser from 'body-parser';
import { restElement } from 'babel-types';
let app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);


/* Dùng Middleware session, static file, view engine(có thể không cần (chưa test)) */
app.use(session({secret: 'ssshhhhh'}));
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public/src'));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/content/icon'));
app.use(express.static(__dirname + '/public/src/component'));

app.set('views', __dirname + '/public/src');
app.set('view engine', 'pug')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())



/* Redirect tới home nếu đăng nhập rồi, tới login nếu chưa */
app.get('/',function(req, res){
    if(req.session.user){
        res.redirect('/home')
    } else{
        res.sendFile(__dirname + '/index.html');
    }
});

/* Render chatForm nếu request tới home */
app.get('/home', function(req, res){
    console.log(1);
    if(req.session.user)
    res.sendFile(__dirname + '/public/src/chatForm.html');
    else res.redirect('/');
});
var storage = multer.diskStorage({
    destination:'./public/userAvatar',
    filename:function(req,file,callback){
        var tag=file.originalname.split('.');
        callback(null,'asd'+'.'+tag[1]);
        console.log('req: '+req.name);
    }
});
var upload=multer({storage:storage});

register(app,upload);
addFriends(app);
getListInvi(app);
markInvi(app);
removeInvi(app);
unfriend(app);


/* Lấy tin nhắn cũ */
app.get('/home/messageHis/:roomid', (req, res) => {
    console.log(1);
    getHis(req.params.roomid ,function (err, result) {
        if (err) console.log("Database error!");
        else res.send(result);
      });
})

app.get('/node_modules/angular-ui-notification/dist/angular-ui-notification.min.css', (req, res)=>{
    res.sendFile(__dirname + '/node_modules/angular-ui-notification/dist/angular-ui-notification.min.css');
})

app.get('/node_modules/angular-ui-notification/dist/angular-ui-notification.min.js', (req, res)=>{
    res.sendFile(__dirname + '/node_modules/angular-ui-notification/dist/angular-ui-notification.min.js');
})


app.get('/getNotifi/:userid', (req, res)=>{
    console.log(1);
    getNotifi(req.params.userid, function(err, result) {
        console.log(result);
        res.send(result);
    })
})
/* Gửi username cho client */
app.get('/home/username', (req, res)=>{
    console.log(1);
    getChatroom(req.session.user.userId, function (err, result){
        res.send({userdata:req.session.user, chatroom: result});
    }); 
})
app.get('/logout',(req,res)=>{
    console.log(1);
    req.session.destroy(()=>{
        console.log('user logged out');
    });
    res.redirect('/');
    
});

app.post('/home/addRoom', (req, res)=>{
    console.log(1);
    //console.log(req.body);
    Room.AddRoom(req.body, function(err){
        //console.log(err.code);
        if(err) res.send({status:false});
        else res.send({status:true});
    });
})

app.post('/getFriendsInfo/:userid', (req, res)=>{
    console.log(1);
    getListFriend(req.params.userid, (err, result)=>{
        if(err) res.send({status:false});
        else res.send(result);
    })
})

app.post('/addNotifi', (req, res)=>{
    console.log(1);
    notification.addRoomInviteNotification(req.body, (err)=>{
        if(err) res.send({status:false});
        else res.send({status:true}); 
    })
})

app.post('/loadRoomNotifi/:userid', (req, res)=>{
    console.log(1);
    notification.getRoomInvite(req.params.userid, (err, result)=>{
        if(err) res.send({status:false});
        else res.send({status:true, result: result});
        console.log(result);
    })
})

app.post('/home/deleteRoom/:roomid', (req, res)=>{
    deleteRoom(req.params.roomid);
    res.send('1');
})

app.post('/acceptRoom', (req, res)=>{
    Room.AcceptRoom(req.body, (status)=>{
        res.send(status);
    })
})

validate(app);


const room = io.of('/home');
room.on('connection', (socket)=>{
    socket.on('join', function(roomid){
        socket.join(roomid);
        room.in(roomid).clients((err, clients)=>{
            room.to(roomid).emit('usernumber', clients, roomid)
        })
        //room.to(roomid).emit('userjoin', roomid);
    })
    socket.on('message', function (msg){
        msgdb(msg);
        notification.addMessageNotification(msg);
        room.to(msg.roomid).emit('message', msg);
    })
})

/* Mở cổng */
const server = http.listen(port, function(){
    console.log("listening on 3000");
})

