//------------------------
// BUTTONS EVENTS
//------------------------


//Button triggers
$(document).on('click', 'a[data-command]', function (event) {
	console.log("test");
	event.preventDefault();
	sendCommand("/cmd?cmd=" + $(this).attr("data-command"), "Kommando skickat: ")
 });
 
$(document).on('click', '#doAdvancedCommand', function (event) {
	event.preventDefault();
	var actions = '[{"command":"' + $("#AC-command").val() + '","id":"' + $("#AC-id").val() + '", "delay": "' + $("#AC-delay").val() + '"}]';
	
	sendCommand("/cmd?cmd=" + actions, "Kommando skickat: ")
});

$(document).on('click', 'a[data-timeCommand]', function (event) {
	event.preventDefault();
	console.log("TEST");
	actions = JSON.parse($(this).attr("data-timeCommand"));
	
	actions.forEach(function(action){
		timeString = action.timedate;
		datetime = new Date(getDateString(new Date()) + "T" + timeString + "Z");
		
		if (datetime < new Date().getTime()) {
			datetime = new Date(getDateString(new Date(new Date().getTime() + 86400000)) + "T" + timeString + "Z");
		}
		console.log(datetime);
		action.timedate = datetime.getTime() + new Date().getTimezoneOffset()*60*1000;
	});
	
	sendCommand("/cmd?cmd=" + JSON.stringify(actions), "Kommando skickat: ");
	
	updatePlannedListMultipleTimes();
 });

$(document).on('click', '#addPlannedCommand', function (event) {
	event.preventDefault();
	var timedate = new Date($("#AP-date").val() + "T" + $("#AP-time").val() + "Z")
	
	if (timedate == "Invalid Date") {/*alert("Invalid Date");*/ timedate = $("#AP-date").val();}
	else {timedate = timedate.getTime() + new Date().getTimezoneOffset()*60*1000;}

	var action = {}
	action.command = {type: "tellstick", task: $("#AP-command").val(), id: $("#AP-device").val()};
	action.timedate = timedate;
	action.repeatInterval = $("#AP-repeatInterval").val();
		
	sendCommand("/cmd?cmd=" + JSON.stringify([action]), "Kommando skickat: ")
	updatePlannedListMultipleTimes();
});

$(document).on('click', '#refreshPlannedCommands', function (event) {
	event.preventDefault();
	updatePlannedList();
});

$(document).on('click', 'header h1', function (event) {
	event.preventDefault();
	$(".hidden").toggle();
});

//------------------------
// PAGE LOAD EVENTS
//------------------------

function pageLoadActions() {
	//Update list of planned actions
	updatePlannedList();
	$("#AP-time").val( getTimeString(new Date()));
	$("#AP-date").val( getDateString(new Date()));
}

function updatePlannedList() {
	var ajax = $.ajax("/plannedActions")
	console.log("[INFO]: Updating list");
	
	ajax.done(function(response) {
		var listHTML = "";
		
		JSON.parse(response).forEach(function(action) {
			var date = new Date(parseInt(action.timedate));
			var dateString = getDateString(date) + " " + getTimeString(date);
			
			if (action.command.type == "tellstick"){ var description = action.command.id + " " + action.command.task ;}
			else if (action.command.type == "system"){ var description = action.command.task ;}			
			
			if (action.repeatInterval != 0 && !isNaN(action.repeatInterval)) {var repeatIntervalTag = "<span class='tag'>Repeat (" + action.repeatInterval / 3600000 + "h)</span> "; }
			else if (action.repeatInterval != "undefined" && isNaN(action.repeatInterval)) {var repeatIntervalTag = "<span class='tag repeatTag'>Repeat (" + action.repeatInterval + ")</span> "; }
			else {var repeatIntervalTag = ""; }
			
			var commandTypeTag = "<span class='tag commandTag'>" + action.command.type + "</span> ";
			
			listHTML += "<li>";
			listHTML += "<h1>" + dateString + "</h1>";
			listHTML += "<p>";

			listHTML += repeatIntervalTag;
			listHTML += commandTypeTag;
			listHTML += description;
			
			listHTML += "</p>";
			listHTML += "<div class='rmPlanned'><a href='#' data-databaseId=" + action.databaseId + " >&#215;</a></div></li>";
			listHTML += "</li>";
		});
				
		console.log("[INFO]: List updated");
		
		$("#plannedActionsList").html(listHTML);
		
		$('a[data-databaseId]').click(function (event) {
			event.preventDefault();
			var ajax = $.ajax("/removePlannedAction?id=" + $(this).attr("data-databaseId") + "&rev=" + $(this).attr("data-databaseRev"))
			
			ajax.done(function(response) {showStatus("Kommando borttaget: " + response);})
			ajax.fail(function() {connectionErrorAlert();})
			
			updatePlannedListMultipleTimes()
		 });
	});
	
	ajax.fail(function() {connectionErrorAlert();})
}

//------------------------
// HELP FUNCTIONS
//------------------------

function updatePlannedListMultipleTimes(){
	updatePlannedList();
	setTimeout(updatePlannedList(), 300);
	setTimeout(updatePlannedList(), 600);
}

function showStatus(status) {
	$(".status").html(status)
}

function sendCommand(command, message) {
	var ajax = $.ajax(command)
	var timer = setTimeout(connectionErrorAlert, 750);
			
	ajax.done(function(response) {
		showStatus(response.replace("<script>window.location = '/';</script>",""));
		clearTimeout(timer);
	})
	ajax.fail(function() {connectionErrorAlert(command);})
	
	console.log("[CMD]: " + command);
}

function getDateString(date) {
	return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
}

function getTimeString(date) {
	return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
}

var tryingToConnect = false;
var commandsToExecute = [];

function connectionErrorAlert(command) {
	if (command != undefined) {commandsToExecute.push(command);} //Add command to list of commands to execute when connection is regained.

	if (tryingToConnect) {return;} //Make sure only one instance of trying to connect is run at the same time
	$(".connectionError").show();
	showStatus('FEL: Anslutningen kunde inte upprättas.');
	
	tryingToConnect = true;
	var updateInterval = 1000;
	
	var loop = setInterval( function(){
		console.log("[INFO]: Trying to connect...");
		var ajax = $.ajax("/plannedActions");
		
		ajax.fail(function() {}); //Continue looping
		ajax.done(function(response) {
			clearInterval(loop);
			$(".connectionError").fadeOut()
			tryingToConnect = false;
			
			//Send waiting commands and update planned actions
			commandsToExecute.forEach(function(command){sendCommand(command);});
			commandsToExecute = [];
			updatePlannedListMultipleTimes();
		});
		
	
	}, updateInterval);

}