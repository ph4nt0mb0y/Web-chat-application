var con =require('./connection');
module.exports=(app)=>{
	app.post('/updateinvi',(req,res)=>{
		con.aquire((err,con)=>{
			con.query('update invitation set readed=true where user2=?',[req.session.user.userId]);
			con.release();
		});
		res.send('asd');
	});
}