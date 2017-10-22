'use strict';

var requestAlarms = require('request'),
    username = "Hector.Tapia@softwareag.com",
    password = "Peachroad389%",
    auth = "Basic " + new Buffer(username + ":" + password).toString("base64"),
    activeAlarms = [];

var options = {
  url : 'https://softwareag5.cumulocity.com/alarm/alarms',
  headers : {
    'Authorization' : auth
  }
}

// Call Cumulocity API, to avoid the callback, I'm using deasync to force a syncronous call.
function callCumulocity(options){
    var source = "";
    requestAlarms(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var jsonResponse = JSON.parse(body); // turn response into JSON
            for (var alarms in jsonResponse.alarms){
              source += jsonResponse.alarms[alarms].source.name + ' has a ' + jsonResponse.alarms[alarms].text +' alarm, ';
              console.log(source);
            }
          }
    });
    while(source === undefined) {
      require('deasync').runLoopOnce();
    }
    return source;
}

// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled ("I found 4 alerts with severity critical and status active...")
function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

// --------------- Events -----------------------

function dispatch(intentRequest, callback) {
    console.log(`request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const severity = slots.severity;
    const status = slots.status;
    const count = 4
    const alarms = callCumulocity(options);


        callback(close(sessionAttributes, 'Fulfilled',
        {'contentType': 'PlainText', 'content': `Okay, I found ${count} ${status} alerts with severity ${severity} and those are: ${alarms}`}));

    }


// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};
