/**
 * The NullStrap 2012
 * @author Matt Null
 * http://github.com/mattnull/The-NullStrap
 */

var express = require('express')
, app = express()
, http = require('http')
, connect = require('connect')
, server = http.createServer(app)
, io = require('socket.io').listen(server)
, mu = require('mu2')
, request = require('request')
, mongo = require('mongojs')
, fs = require('fs')
, env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
, render = function(view, data, callback){
	callback = callback || function(){};
	data = data || {};
	view = view || '';

	mu.compile(view, function (err, parsed) {
		if (err) {
		  throw err;
		}

		var buffer = '';

		mu.render(parsed, data)
		.on('data', function (c) { 
			buffer += c.toString(); 
		})
		.on('end', function () {
			callback(buffer); 
		});
	});
}
, uglify = require('uglify-js')
, crypto = require('crypto');

// App Configuration
app.configure('production', function(){
	mu.root = __dirname + '/views';

	app.use(connect.cookieParser());
	app.use(connect.session({ secret: 'REPLACE WITH YOUR SECRET', cookie: { maxAge: 3600000}})); //1 hour sessions
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.use(app.router);
});

app.configure('development', function(){
	mu.root = __dirname + '/views';

	app.use(connect.cookieParser());
	app.use(connect.session({ secret: 'REPLACE WITH YOUR SECRET', cookie: { maxAge: 3600000}})); //1 hour sessions
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.use(app.router);
});

//compress javascript on prod
if(env == 'production'){ 
	fs.readdir('public/javascripts', function(err, files){
		
		if(err) return;

		var parser = require("uglify-js").parser;
		var pro = require("uglify-js").uglify;

		for(var i = 0; i < files.length; i++){

			//ignore files that start with a "."
			if(files[i].indexOf('.') == 0) continue;
			
			var file = 'public/javascripts/'+files[i];

			var originalCode = fs.readFileSync(file, encoding='utf8');
			var ast = parser.parse(originalCode); // parse code and get the initial AST
			ast = pro.ast_mangle(ast); // get a new AST with mangled names
			ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
			var finalCode = pro.gen_code(ast); // compressed code here

			fs.writeFileSync(file, finalCode, encoding='utf8');
		}
	});
}

//Socket.io configuration
io.configure('production', function(){
	io.enable('browser client minification');  // send minified client
	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.enable('browser client gzip');          // gzip the file
	io.set('log level', 1);                    // reduce logging
	io.set('transports', [                     // enable all transports (optional if you want flashsocket)
	    'websocket'
	  //, 'flashsocket'
	  , 'htmlfile'
	  , 'xhr-polling'
	  , 'jsonp-polling'
	]);
});

//MongoDB Server
var mongoDBUrl = '';
var mongoCollections = [];
var db = mongoDBUrl && mongoCollections.length ? mongo.connect(mongoDBUrl, mongoCollections) : {};

//start the server
server.listen(3333);

/** Routes **/

//index
app.get('/', function(req, res){	
	render('index.html', {}, function(html){
		res.send(html);
	});
});

//Attach socket events
io.sockets.on('connection', function(socket){

});

console.log("Express server listening on port 3333");
