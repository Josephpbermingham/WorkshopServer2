let express = require('express');
let Pool = require('pg').Pool;
let bodyParser = require('body-parser');
const path = require('path');
const app = express();

var config = {
host: 'localhost',
      user: 'joe',
      password: 'Deadred00',
      database: 'classmem'
};

var pool = new Pool(config);

app.set('port', (8080));
app.use(bodyParser.json({type: 'application/json'}));
app.use(bodyParser.urlencoded({extended: 'true'}));
app.post('/create-user', async (req, res) => {
	//this is the command to add a user. to do this you need
	// firstname, last name, username, and email
	// should return status user added for status username taken
	var firstname = req.body.firstname;
	var lastname = req.body.lastname;
	var username= req.body.username;
	var email= req.body.email;
if(!firstname || !lastname || !username || !email){
    res.json({error:'papameters not given'});
    console.log("param error");
 }
 else{
 	try{
 		var check = await pool.query('select * from students where username = $1',[username]);
			if(check.rowCount == 0){
 				var pass = await pool.query("insert into students values ($1,$2,$3,$4)",[firstname,lastname,username,email]);
 				res.json({status:"user added"});
 	}
 			else {
 			res.json({status:"username already taken"});}
 }
 catch(e){
 	console.error("ERROR WHOOPSIE");
 }
}});

app.delete('delete-user', async (req, res) => {
		//delete user takes a username
		// responds with status deleted
		var username= req.body.username;
		if(!username){
			res.json({error:"parameters not given"});
		}
		else{
			var del = await pool.query('delete from students where username = $1'[username]);	
			res.json({status:'deleted'});
			//should also delete from 
		}
});

app.get('/list-users', async (req, res) => {
	// if type == full retuen all information
	// if type == summary then just first and last name
var type = req.body.type;
if(type==full){
var resp = await pool.query("select firstname,lastname,username,email from students");
res.json({'users':resp})
}
if(type == summary){
var resp = await pool.query("select firstname, lastname from students");
res.json({'users':resp})
}
});

app.post('/add-workshop', async (req, res) => { 
	//should use title date location maxseats instructor
var title = req.body.title;
var date = req.body.date;
var location = req.body.location;
var maxseats = req.body.maxseats;
var instructor = req.body.instructor;
if(!title || !date || !location ||!maxseats||!instructor){
	res.json("ERROR":"missing args")
}

else{
	var check = await pool.query('select * from workshops where title=$1 and date=$2 and location=$3'[title, date, location]);
	if(check.rowCount==0){
	 var wksadd await pool.query('insert into workshops $1,$2,$3,$4,$5',[title,date,location,maxseats,instructor]);
	 res.json({'status':"workshop added"});
	}
	else{res.json({'status':"workshop already in database"});}
}	

app.post('/enroll', async (req, res) => { 
//takes a title date location and username
var title = req.body.title;
var date = req.body.date;
var location = req.body.location;
var username = req.body.username;
if(!title || !location || !username || !date){
	res.json({error:"parmeters not given"});
}
//if student doesnt exist in that database (status user not in database)
var inStudent = await pool.query('select username from students where username = $1'[username]);
var stuCheck = inStudent.rows.map(function(item){return (item.username)});
if(stuCheck!=inStudent){
	res.json({status:"user not in database"});
}
//if workshop doesnt exist (status workshop does not exist)
var inWorkshop = await pool.query('select * from workshops where title = $1 and date = $2 and location =$3'[title,date,location]);
if(inWorkshop.rowCount==0){
	res.json({status:"workshop does not exist"});
}
//if workshop alredy has this student (staus user already enrolled)
var StudentID = await pool.query('select StudentID from student where username = $1'[username]);
var WorkshopID= await pool.query('select WorkshopID from workshops where title = $1 and date = $2 and location =$3'[title,date,location]);
console.log("workshop id " + WorkshopID + " studentid "+StudentID);
var check_for_student_enrolled = await pool.query('select * from crosscheck where student = $1 and workshop = $2'[StudentID,WorkshopID]);
if(check_for_student_enrolled !=0){
	res.json({status:"user already enrolled"});
}
//if wokshop is filled (staus no seats available)
var mapWks = inWorkshop.rows.map(function(item){return (item.maxSeats)});
var checkSeats = inWorkshop.rows.map(function(item){return (item.WorkshopID)});
var countSeats = await pool.query('select * from crosscheck where workshop = $1'[checkSeats])
var seatsFull=countSeats.rowCount;
if((seatsFull-countSeats)<=0){
	res.json(status:"no seats available");
}
// on success (status user added)
var add_to_crosscheck = await pool.query('insert into crosscheck values($1,$2)'[StudentID,WorkshopID]);
});

app.get('/list-workshops', async (req, res) => {
//no params retusns title date and location of all wokshops
var ret= await pool.query('select title, date, location, from workshops');
});


app.listen(app.get('port'), () => {
                console.log('Please work');
                });
