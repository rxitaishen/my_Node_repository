const mongoose = require('mongoose');

// Book Schema
const userSchema = mongoose.Schema({
	"name":{
		type: String,
	},
	"pass":{
		type: String,	
	},
	"supproject":{
		type: Array,
	},
	"buyproject":{
		type: Array,
	},
	"iftruename":{
		type: Boolean,
	},
});

const Users = module.exports = mongoose.model('users', userSchema);