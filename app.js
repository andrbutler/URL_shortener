var express = require('express');
var app = express();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var dbUrl = process.env.MONGOLAB_FCCBACKEND_URI;
app.use(express.static('public'));
app.set('port', (process.env.PORT || 8080));

app.get('/', function(req, resp){
	resp.writeHead(200, {'Content-type': 'application/json'});
	resp.on('error', function(error){
		console.log(error);
	});
	resp.sendfile('index.html');
});

app.get('/new/*', function(req, resp){
	resp.writeHead(200, {'Content-type': 'application/json'});
	resp.on('error', function(error){
		console.log(error);
	});
	var url = req.params[0];
	console.log(url);
	if(url.search(/(^(http(s)?\:\/\/)).+(\.+).+/)){
		resp.end(JSON.stringify({'error': 'invalid url'}));
	}else{
		MongoClient.connect(dbUrl, function(err, db){ 
			if (err){
				return console.log('unable to connect to database server. error:', err);
			}else{
				 db.collection('surl').count(function(err, result){
					if(err){
					return	console.log(err);
					}else{
						var count = parseInt(result);
						console.log(count);
						db.collection('surl').find({'url':url}, {url:1, short_url:1, _id:0}).toArray(function(err, data){
							if(err){
							return	console.log(err);
							}else{
								console.log('data',data);
								var current = data;
								if(!current.length){
									var doc = {
										'url': url, 
										'code': (count + 1).toString(16), 
										'short_url': 'https://fccback-url-short.herokuapp.com/s/'+ (count + 1).toString(16)};
									db.collection('surl').insert(doc, function(err, data){
										if(err){
										return	console.log(err);
										}else{
											console.log('doc',doc);
											db.close();
											return resp.end(JSON.stringify(doc));
										}
									});
								}else{
									console.log('current',JSON.stringify(current[0]));
									db.close();
								return	resp.end(JSON.stringify(current[0]));
								}
							}
						});	
					}
				});				
			}
		});
	}
});

app.get('/s/:code', function(req, resp){
	var code = req.params.code;
	console.log('code',code);
	resp.on('error', function(error){
		console.log(error);
	});
	mongodb.connect(dbUrl, function(err, db){
		if (err){
			console.log('unable to connect to database server. error:', err);
		}else{
			 db.collection('surl').find({'code':code}).toArray(function(err,documents){
				if(err){
					console.log(err);
				}else{
				console.log(documents);
				if(!documents.length){
					resp.writeHead(200, {'Content-type': 'text/html'});
					console.log('url does not exist in database');
					resp.write('url does not exist in database');
					resp.end();
				}else{
					resp.redirect(301, documents[0].url);
				}
					}
				});
			
		}
	db.close();
	});
});
app.listen(app.get('port'), function(){
	console.log('app running on port: ' + app.get('port'))
});