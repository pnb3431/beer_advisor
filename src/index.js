/**
 * This code allow your skill to link Alexa Skills Kit to Alexa Designer API.
 *
 * 2012-2016 Alexa Designer by Vocal Apps 
 * For any question write us at support@vocal-apps.com
 */
 
var http = require('http');
		
exports.handler = function (event, context) {
	try {
		console.log("event.session.application.applicationId=" + event.session.application.applicationId);

		if (event.session.new) {
			onSessionStarted({requestId: event.request.requestId}, event.session);
		}

		if (event.request.type === "LaunchRequest") {
			onLaunch(event.request,
					 event.session,
					 function callback(sessionAttributes, speechletResponse) {
						context.succeed(buildResponse(sessionAttributes, speechletResponse));
					 });
		}  else if (event.request.type === "IntentRequest") {
			onIntent(event.request,
					 event.session,
					 function callback(sessionAttributes, speechletResponse) {
						 context.succeed(buildResponse(sessionAttributes, speechletResponse));
					 });
		} else if (event.request.type === "SessionEndedRequest") {
			onSessionEnded(event.request, event.session);
			context.succeed();
		}
	} catch (e) {
		context.fail("Exception: " + e);
	}
};

// Called when the session starts.

function onSessionStarted(sessionStartedRequest, session) {
	console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
				+ ", sessionId=" + session.sessionId);
 
		
}

// Called when the user launches the skill without specifying what they want.

function onLaunch(launchRequest, session, callback) {
	console.log("onLaunch requestId=" + launchRequest.requestId
				+ ", sessionId=" + session.sessionId);

	// Get Start Message from vocalapps API
	var req;
	var session_id = session.sessionId;
	var user_id = session.user.userId;
	var skill_id =  '2894';
	var lambdaResponse = JSON.stringify(buildSpeechletResponse("text", "reprompt", false));
	lambdaResponse = encodeURI(lambdaResponse);
    var lambdaRequest = '{"session":{"sessionId":"'+session.sessionId+'","application":{"applicationId":"'+session.application.applicationId+'"},"attributes":{},"user":{"userId":"'+session.user.userId+'"},"new":false},"request":{"type":"'+launchRequest.type+'","requestId":"'+launchRequest.requestId+'","timestamp":"'+launchRequest.timestamp+'"},"version":"1.0"}';

	
	var options = {
		host: 'www.alexa-designer.com',
		port: 80,
		path: '/dialog_engine/api.php?user_id='+user_id+'&session_id='+session_id+'&skill_id='+skill_id+'&lang=en-gb'+'&event_name=NEW_DIALOG_SESSION&lambdaResponse='+lambdaResponse+'&lambdaRequest='+lambdaRequest,
		method: 'GET'
	};
				
		
	req = http.request(options, function(res) {
		res.setEncoding('utf8');
			res.on('data', function (chunk) {
			var json = JSON.parse(chunk); 
			var answer = "<speak>"+ json.answer +"</speak>";
			var reprompt = "<speak>"+ json.reprompt +"</speak>";
			
		    	getWelcomeResponse(answer, reprompt, callback);

		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	req.end();
	
}

// Called when the user specifies an intent for this skill.
 
function onIntent(intentRequest, session, callback) {
	console.log("onIntent requestId=" + intentRequest.requestId
				+ ", sessionId=" + session.sessionId);
				
	var intent = intentRequest.intent,
	intentName = intentRequest.intent.name.toString();

	var slot_name = intent.slots;
	var jsonSlots = {};
	var strSlots='';
	if(slot_name !== undefined){
		for(var key in slot_name) {
			var slot_value = (intent.slots)[key].value;
			if(slot_value && key) {
			   jsonSlots[key]=slot_value.replace(/#/g,'');
			   strSlots += '"name":"'+key+'","value":"'+slot_value.replace(/#/g,"")+'"';
			}
		}
	}
	
	var slots = JSON.stringify(jsonSlots);
	var lambdaResponse = JSON.stringify(buildSpeechletResponse("text", "reprompt", false));
	lambdaResponse = encodeURI(lambdaResponse);
	var lambdaRequest = encodeURI('{"session":'+JSON.stringify(session)+',"request":'+JSON.stringify(intentRequest)+',"version":"1.0"}');

	
	//Get Answer from vocalapps API
	var req;
	var session_id = session.sessionId;
	var user_id = session.user.userId;
	var skill_id = '2894';
	//var input = JSON.stringify(jsonSlots["Text"]);
	var input = JSON.stringify(intentName);
	input = input.replace(/#/g,'');
	var inputEncoded = encodeURI(input);
	slots = encodeURI(slots);
	var options = {
	    host: 'www.alexa-designer.com',
		port: 80,
		path: '/dialog_engine/api.php?user_id='+user_id+'&session_id='+session_id+'&skill_id='+skill_id+'&lang=en-gb'+'&event_name=NEW_INPUT&input='+inputEncoded+'&slots='+slots+'&lambdaResponse='+lambdaResponse+'&lambdaRequest='+lambdaRequest,
		method: 'GET'
	};
			
	
	req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			var json = JSON.parse(chunk); 
			var answer = "<speak>"+json.answer+"</speak>";
			var reprompt = "<speak>"+json.reprompt+"</speak>";
			var shouldEndSession = false; 
			
			if(json.end_session)
				shouldEndSession = true; 	
			getResponse(answer, reprompt,intent, session, shouldEndSession, callback);
				
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	req.end();
		
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
	console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
				+ ", sessionId=" + session.sessionId);
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(answer, reprompt, callback) {

	// If we wanted to initialize the session to have some attributes we could add those here.
	var sessionAttributes = {};
	var speechOutput = answer;
	var shouldEndSession = false;

	callback(sessionAttributes,
			 buildSpeechletResponse(speechOutput, reprompt, shouldEndSession));
}


function getResponse(answer, reprompt, intent, session, shouldEndSession, callback) {

	var sessionAttributes = {};
	var speechOutput = answer;
	
	callback(sessionAttributes,
			 buildSpeechletResponse(speechOutput, reprompt, shouldEndSession));
}


// --------------- Helpers that build all of the responses -----------------------
function buildSpeechletResponse(output, repromptText, shouldEndSession) {
	return {
		outputSpeech: {
			 type: "SSML",
			 ssml: output
		},
		card: {
			type: "Simple",
			title: 'beer_advisor',
			content: output.replace(/(<([^>]+)>)/ig,"")
		},
		reprompt: {
			outputSpeech: {
				type: "SSML",
				ssml: repromptText
			}
		},
		shouldEndSession: shouldEndSession
	}
}

function buildResponse(sessionAttributes, speechletResponse) {
	return {
		version: "1.0",
		sessionAttributes: sessionAttributes,
		response: speechletResponse
	}
}