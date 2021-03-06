/*******NOT IN THE ASKIAFIELD API***********/	
function JSONtoDIV(response){
	//console.log(promise);
		response.then(function(json){
				cache=json.Response;
				document.getElementById('result').innerHTML = ''
				json.Response.forEach(function(key){
					document.getElementById('result').innerHTML += '<li>' + key.Name + '</li>';
				});
			});
		//}
	response.catch(function(error){
		console.log("error caught");
	}); 
}
function JSONtoDIV0(json){
	//console.log(json);
	//document.getElementById('result').innerHTML = "Status : " + json.status + "<br>" + "Status text : " + json.statusText + "<br>" + "Current Authenticity token : " + json.Token;
	//document.getElementById('result').innerHTML = "Status : " + response.status + "<br>" + "Status text : " + response.statusText + "<br>" + "Current Authenticity token : " + token;
}
function JSONtoFORM(response){
	// First, checks if it isn't implemented yet.
	if (!String.prototype.format) {
	  String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
		  return typeof args[number] != 'undefined'
			? args[number]
			: match
		  ;
		});
	  };
	}
	response.then(function(json){
		if (json.StatusCode === 200) {
			document.getElementById("fetch-agent-issue").style["display"] = 'none';
			defaultAgentObj = json.Response;
			//console.log(defaultAgentObj);
			// Generate form HTML based upon the JSON object received
			var strControlTemplate = '\n\t\t<div class="control-group">\n\t\t\t<label class="control-label" for="input{0}">{0}</label>\n\t\t\t<div class="controls">\n\t\t\t<input type="text" id="input{0}" placeholder="{1}" value="{1}">\n\t\t\t</div>\n\t\t</div>\n';
			var boolControlTemplate = '\n\t\t<div class="control-group">\n\t\t<div class="controls">\n\t\t<label class="checkbox">\n\t\t\t<input type="checkbox" id="checkbox{0}" checked="{1}">{0}\n\t\t</label>\n\t\t</div>\n\t\t</div>\n';
			var generatedHTML = "";
			for (var key in defaultAgentObj) {
				if (defaultAgentObj.hasOwnProperty(key)) {
					var value = defaultAgentObj[key];
					if (typeof value === 'string') {
						// input types for strings
						generatedHTML += strControlTemplate.format(key, value);
					}
					if (typeof value === 'boolean') {
						// checkboxes for booleans
						generatedHTML += boolControlTemplate.format(key, '' + value);
					}
				}
			}
			document.getElementById('result').innerHTML = generatedHTML;
			
		} else {
			// Show the user a Warning that something went wrong with the API
			document.getElementById("fetch-agent-issue").style["display"] = 'block';
			document.getElementById("fetch-agent-issue").innerHTML('Something went wrong fetching the default agent')
		}
	})
}

function init(){
	askiafield.config(
		{CCAURL:'http://ns7.askia.com:80/ccawebapi/'}
	);
	document.getElementById('doc').innerHTML = askiafield.CCAURL;
	document.getElementById('doc').setAttribute("href",askiafield.CCAURL);
	if(document.getElementById('PASS')==null){
		askiafield.auth('Supervisor','Supervisor');
	}
}

function signin(){
	var id = document.getElementById('UID').value;
	var pass = document.getElementById('PASS').value;
	//askiafield.authenticate(JSONtoDIV0,{username:id,password:pass});
	askiafield.auth(id,pass);
}
function setAgentJSON(){
	var newAgent = defaultAgentObj;
	for (var key in defaultAgentObj) {
		if (defaultAgentObj.hasOwnProperty(key)) {
			var value = defaultAgentObj[key];
			if (typeof value === 'string') {
				newAgent[key] = document.getElementById('input' + key).value;
			}
			if (typeof value === 'boolean') {
				// convert string to boolean
				newAgent[key] = document.getElementById('checkbox' + key).checked;
			}
		}
	}	
	askiafield.createAgent(newAgent,{onSuccess:function(resp){console.log(resp)}});
}


/********ASKIAFIELD API*********/
(function(win, doc){
	win.askiafield = {};
	var cache = {};
	var token;
	var CCAURL;
	var actions = [
	   { name : "getSurveys", APICall : "SurveyTasks", method:"GET" },
	   { name : "getAgents", APICall : "Agents", method:"GET"},
	   { name : "getDefaultAgent", APICall : "Agents/0", method:"GET"},
	   { name : "getLists", APICall : "Lists", method:"GET" },
	   { name : "getSettings", APICall : "GeneralSettings", method:"GET" },
	   { name : "getGroups", APICall : "Groups", method:"GET" },
	   { name : "getOutbound", APICall : "OutboundGroups", method:"GET" },
	   { name : "getWebconnections", APICall : "WebConnections", method:"GET" },
	   //{ name : "authenticate", APICall : "session", method:"POST" },
	   { name : "createAgent", APICall : "Agents", method:"POST" }
	];
	for (var i = 0, l = actions.length; i < l; i += 1) {
	   appendMethod(actions[i]);
    }
	askiafield["auth"]=auth;
	askiafield["config"]=config;

/* FUNCTIONS*/	
	function config(params){
		if(!params){
			return {
				token:token,
				CCAURL:CCAURL
			};
		}
		else{
			CCAURL=params.CCAURL||CCAURL;
			token=params.token||token;
		}
	}
	function executeGetQuery(params,body){
		var APICall=params.APICall;
		var body; //should be empty in GET
		var onSuccess=params.onSuccess;
		var onFailure=params.onFailure;
		if (cache[APICall]) {
			console.log('using cache');
			onSuccess(cache[APICall]);
		}
		else {
			cache[APICall] = (fetch(CCAURL+APICall,{headers: {'Authorization': 'Basic ' + token}}).then(function(response){
				return response.json();
				console.log(response.json());
			}));
			params.onSuccess(cache[APICall]);
		}
	}
	function executePostQuery(params,body){
		var APICall=params.APICall;
		var body=body;
		var onSuccess=params.onSuccess || function(){};
		var onFailure=params.onFailure || function(){};
		//TODO : replace these cache snippets by CACHE API calls.
		if(cache[APICall] && cache[APICall]["body"]===JSON.stringify(body)){
			console.log("using cache");	
			onSuccess(cache[APICall]["response"]);	
		}
		else{
			cache[APICall]={};
			cache[APICall]["body"]=JSON.stringify(body);
			fetch( CCAURL + APICall, {
				method:'post',
				headers:{
					"Content-Type": "text/json",
					'Authorization': 'Basic ' + token
				},
				body: JSON.stringify(body)
				})
				.then(function( response ) {
					console.log(response);
					if(response.ok){
						return response.json().then(function(json){
							cache[APICall]["response"]=json;
							//token=json.Response.Token;
							onSuccess(cache[APICall]["response"]);	
						});
					}
					else{
						console.log('there was an issue with the API call');
						return response.json().then(function(json){
							console.log(json);
							cache[APICall]["response"]=json;
							onFailure(cache[APICall]["response"]);	
						});
					}
				})
		}
	}
	function appendMethod(action) {
	   win.askiafield[action.name] = function (params,body) {
			params.APICall=action.APICall;
			if(action.method=="GET"){
				executeGetQuery(params);
			}
			else if(action.method=="POST"){
				executePostQuery(body,params);
			}
			else{
				console.log("ONLY GET AND POST METHODS ARE IMPLEMENTED SO FAR")
			}
	   };
    }
	function auth(user,pass){
		var body = {
			username:user,
			password:pass
		}
		executePostQuery({
			APICall:'session',
			onSuccess:function(json){
				JSONtoDIV0(json.Response);
				console.log(json);
				askiafield.config({token:json.Response.Token});
			}
		},body);
	}
}(window, window.document))

/*function CCAWebAPI(typeOfCall, params,callback){
	fetch(CCAURL+typeOfCall,
		{
		headers: {'Authorization': 'Basic ' + token}
		}
	)
	.then(function( response ) {
		if(response.ok){
			//process response outside the API
			callback(response);	
		}
		else{
			document.getElementById('result').innerHTML = "Status : " + response.status + "<br>" + "Status text : " + response.statusText;
		}
	});
};*/

//this function is a helper to convert a JSON object into a Form data, so that its treated as Form Data in the HTTP POST, rather than Payload.
function buildFormBody(obj) {
	var form = [];
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			form.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
		}
	}
	return form.join("&");
}



