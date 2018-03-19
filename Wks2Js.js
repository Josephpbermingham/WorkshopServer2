let express = require('express');
let Pool = require('pg').Pool;
let bodyParser = require('body-parser');
const path = require('path');
const app = express();

var config = {
host: 'localhost',
      user: 'joe',
      password: 'Deadred00',
      database: 'wks3'
};

var pool = new Pool(config);
app.set('port', (8080));
app.use(bodyParser.json({type: 'application/json'}));
app.use(bodyParser.urlencoded({extended: 'true'}));

//works!
app.post('/create-user', async (req, res) => {
		//this is the command to add a user. to do this you need
		// firstname, last name, username, and email
		// should return status user added for status username taken
		var firstname = req.body.firstname;
		var lastname = req.body.lastname;
		var username= req.body.username;
		var email= req.body.email;
		if(!firstname || !lastname || !username || !email){
		return	res.json({error:'papameters not given'});
		}
	else{
		try{

			//console.log(await pool.query('SELECT * FROM students'));
			var check = await pool.query('SELECT * FROM students WHERE username = $1',[username]);
			if(check.rowCount > 0){
				return res.json({status:"username taken"});	
			}
			else {
				var pass = await pool.query("insert into students(firstname,lastname,username,email) values($1,$2,$3,$4)",[firstname,lastname,username,email]);
			return 	res.json({status:"user added"});
			}
		}catch(e){
			console.error("ERROR create user "+e);
		}
	}
});
//crashes pg
app.delete('/delete-user', async (req, res) => {
		//delete user takes a username
		// responds with status deleted
		try{
		var username= req.body.username;
			//console.log(req.query);
		if(!username){
		return res.json({error:"parameters not given"});
		}
		else{
			var del = await pool.query('delete  from students where username = $1',[username]);	
		return	res.json({status:'deleted'});
				//should also delete from crosscheck
		}
		}catch(e){
			console.error("ERROR delete user "+e);
			}
	});
//infinite loop?
app.get('/list-users', async (req, res) => {
		var type = req.query.type;
		try{
		// if type == full retuen all information
		// if type == summary then just first and last name
		if(type=='full'){
		var resp = await pool.query("select firstname,lastname,username,email from students");
		var clear =resp.rows.map(function(item){
			return (item.firstname,item.lastname,item.username,item.email);
		});
	
		return res.json({'users':resp.rows});
		}
		if(type == 'summary'){
		var resp = await pool.query("select firstname, lastname from students");
		return res.json({'users':resp.rows})
		}
				}catch(e){
			console.error("ERROR list users "+e);
		}
		});

app.post('/add-workshop', async (req, res) => { 
		try{
			// i can not handle date format numbers
		//should use title date location maxseats instructor
		var title = req.body.title;
		var date = req.body.date;
		var location = req.body.location;
		var maxseats = req.body.maxseats;
		var instructor = req.body.instructor;
		if(!title || !date || !location ||!maxseats||!instructor){
		return res.json({error:"missing args"});
		}

		else{
			var check = await pool.query('select * from workshops where title=$1 and date=$2 and location=$3',[title, date, location]);
			if(check.rowCount==0){
				var wksadd = await pool.query('insert into workshops(title, date,location,maxseats,instructor) values ($1,$2,$3,$4,$5)',[title,date,location,maxseats,instructor]);
			return	res.json({'status':"workshop added"});
			}
			else{
			return res.json({status:"workshop already in database"})
			}
		}
			}catch(e){
			console.error("ERROR in add workshop "+e);
		}
	});

app.post('/enroll', async (req, res) => { 
	try{    
			//takes a title date location and username
			var title = req.body.title;
			var date = req.body.date;
			var location = req.body.location;
			var username = req.body.username;

			if(!title || !location || !username || !date){return res.json({error:"parmeters not given"});}
			
			//if student doesnt exist in that database (status user not in database)
			var inStudent = await pool.query('select username from students where username = $1',[username]);
			var stuCheck = inStudent.rows.map(function(item){return (item.username)});
			if(stuCheck!=username){
			return res.json({status:"user not in database"});
			}
			
			//if workshop doesnt exist (status workshop does not exist)
			var inWorkshop = await pool.query('select * from workshops where title = $1 and date = $2 and location =$3',[title,date,location]);

			if(inWorkshop.rowCount==0){
			return	res.json({status:"workshop does not exist"});
			}
				console.log((await pool.query('select * from workshops where title = $1 and date = $2 and location =$3',[title,date,location])).rows);
		
			//if workshop alredy has this student (staus user already enrolled)
			var Stu = await pool.query('select StudentID from students where username = $1',[username]);
			var Wor= await pool.query('select WorkshopID from workshops where title = $1 and date = $2 and location =$3',[title,date,location]);
			var StudentID = parseInt(Stu.rows.map(function(item){return(item.studentid)}));
			var WorkshopID = parseInt(Wor.rows.map(function(item){return(item.workshopid)}));
			
			console.log(StudentID +" student id "+WorkshopID +' WorkshopID');
			
			var check_for_student_enrolled = await pool.query('select * from crosscheck where student = $1 and workshop = $2',[StudentID,WorkshopID]);
			console.log("student enrolled "+ JSON.stringify(await pool.query('select * from crosscheck where student = $1 and workshop = $2',[StudentID,WorkshopID]).rows));
			if(check_for_student_enrolled.rowCount != 0){
				return res.json({status:"user already enrolled"});
			}

			//if wokshop is filled (staus no seats available)
			var maxseats = parseInt(inWorkshop.rows.map(function(item){return (item.maxseats)}));
			var checkSeats = parseInt(inWorkshop.rows.map(function(item){return (item.WorkshopID)}));

			console.log(WorkshopID+" workshopid "+ maxseats+" maxseats");
			
			//this checks how many seats are full
			var countSeats = await pool.query('select * from crosscheck where workshop = $1',[WorkshopID]);
			console.log(countSeats.rowCount+" Seats currently full");
			var seatsFull=maxseats-countSeats.rowCount;
			console.log("seats full variable "+ seatsFull +" and the math "+(maxseats-countSeats.rowCount));
			console.log(countSeats.rowCount<=maxseats+" the test logic");
			if(countSeats.rowCount>=maxseats){
				return res.json({status:"no seats available"});
			}
			else{// on success (status user added)
				var add_to_crosscheck = await pool.query('insert into crosscheck values($1,$2)',[StudentID,WorkshopID]);
			return	res.json({status:'user added'});
			}
		}catch(e){
			console.error("ERROR in enroll "+e);
		}

console.log('************************************************************************************');


});
app.get('/list-workshops', async (req, res) => {
	try{
		const dateformat = require('dateformat');

		//no params retusns title date and location of all wokshops
		var ret= await pool.query('select title, location,date from workshops order by title,date');
		//console.log(ret.rows);
		//console.log("this is ret");
		//console.log(ret.rows);
		for(var i=0;i<ret.rowCount;i++){
				//console.log(ret[i]);
				ret.rows[i].date = dateformat(ret.rows[i].date,"yyyy-mm-dd");
		}
		return res.json({workshops:ret.rows});
			}catch(e){
			console.error("ERROR In list workshops "+e);
		}
		});


app.get('/attendees',async (req, res) =>{
	var title = req.query.title;
	var date = req.query.date;
	var location = req.query.location;
	try{
		//console.log(title+"  "+date+"  "+location);
		var attendees = await pool.query('select workshopid from workshops where title = $1 and date = $2 and location = $3',[title,date,location]);
		var parse = parseInt(attendees.rows.map(function(item){return(item.workshopid)}));
		if(attendees.rowCount==0){
		return	res.json({error:'workshop does not exist'});
		}
		//console.log(JSON.stringify(attendees)+' workshop id');
		
		//firstname,lastname,workshop   SELECT * FROM (a LEFT JOIN b ON a.key = b.key) LEFT JOIN c ON b.another_key = c.another_key
	
		var students = await pool.query('select firstname,lastname from students LEFT JOIN crosscheck on StudentID=student LEFT JOIN workshops on workshop=workshopid WHERE workshops.workshopid=$1',[parse]);
		return res.json({attendees:students.rows});
	}catch(e){console.log("attendees "+ e)}

});

app.listen(app.get('port'), () => {
		console.log('Running');
		});
