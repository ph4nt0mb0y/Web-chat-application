var con=require('./connection');
module.exports= app=>{
	app.get('/getListInvitation',(req,res)=>{
		var sql='select user_id,username from user where user_id in(select user1 from invitation where user2=?)';
		con.aquire((err,con)=>{
			con.query(sql,[req.session.user.userId],(err,rows)=>{
				if(err) console.log('ko nhận đc danh sách lời mời lỗi: '+err);
				res.send(rows);
				console.log(rows);
			});
		});
	});

	app.post('/getListInvitation',(req,res)=>{
		var addSql='INSERT INTO friends(currentUser,friendUser,chatroomname) values(?,?,?)';
		var addRoom='INSERT INTO chatroom(chatroom_name, member_num) VALUES (?,?)';
		var addUserRoom='INSERT INTO userchatroom VALUES (?,?),(?,?)';
		var removeInvi='DELETE FROM invitation WHERE user1=? and user2=?';

		console.log(req.body);
		console.log('sdgobisdgdkljjodfhoxfgodfg');
		var roomName=req.body.userSend+'-'+req.session.user.userId;
		var usersend=req.body.userSend;
		var userget=req.session.user.userId;
		con.aquire((err,con)=>{
			con.query(addRoom,[roomName,2]);
			con.query(addUserRoom,[usersend,roomName,userget,roomName]);			
			con.query(addSql,[usersend,userget,roomName]);
			con.query(addSql,[userget,usersend,roomName]);
			con.query(removeInvi,[usersend,userget]);
			con.release();
		})
	});
}