//------------------------
// BUTTONS EVENTS
//------------------------

//Button triggers
$('a[data-command]').click(function (event) {
	event.preventDefault();
	sendCommand("/cmd?cmd=" + $(this).attr("data-command"), "Kommando skickat: ")
 });
 
 $('#doAdvancedCommand').click(function (event) {
	event.preventDefault();
	var actions = '[{"command":"' + $("#AC-command").val() + '","id":"' + $("#AC-id").val() + '", "delay": "' + $("#AC-delay").val() + '"}]';
	
	sendCommand("/cmd?cmd=" + actions, "Kommando skickat: ")
});

 $('a[data-timeCommand]').click(function (event) {
	event.preventDefault();
	console.log("TEST");
	actions = JSON.parse($(this).attr("data-timeCommand"));
	
	actions.forEach(function(action){
		timeString = action.timedate;
		datetime = new Date(getDateString(new Date()) + " " + timeString);
		
		if (datetime < new Date().getTime()) {
			datetime = new Date(getDateString(new Date(new Date().getTime() + 86400000)) + " " + timeString);
		}
		
		action.timedate = datetime.getTime();
	});
	
	sendCommand("/cmd?cmd=" + JSON.stringify(actions), "Kommando skickat: ");
	
	updatePlannedListMultipleTimes();
 });

$('#addPlannedCommand').click(function (event) {
	event.preventDefault();
	var timedate = new Date($("#AP-date").val() + " " + $("#AP-time").val())
	
	if (timedate == "Invalid Date") {alert("Invalid Date"); return}

	var action = {}
	action.command = {type: "tellstick", task: $("#AP-command").val(), id: $("#AP-id").val()};
	action.timedate = timedate.getTime();
	action.repeatInterval = $("#AP-repeatInterval").val();
		
	sendCommand("/cmd?cmd=" + JSON.stringify([action]), "Kommando skickat: ")
	updatePlannedListMultipleTimes();
});

$('#refreshPlannedCommands').click(function (event) {
	event.preventDefault();
	updatePlannedList();
});

//------------------------
// PAGE LOAD EVENTS
//------------------------

//Update list of planned actions
updatePlannedList();
$("#AP-time").val( getTimeString(new Date()));
$("#AP-date").val( getDateString(new Date()));

function updatePlannedList() {
	var ajax = $.ajax("/plannedActions")
	console.log("[INFO]: Updating list");
	
	ajax.done(function(response) {
		var listHTML = "";
		
		JSON.parse(response).forEach(function(action) {
			var date = new Date(parseInt(action.timedate));
			var dateString = getDateString(date) + " " + getTimeString(date);
			
			if (action.command.type == "tellstick"){
				var description = action.command.id + " " + action.command.task ;
			}
			else if (action.command.type == "system"){
				var description = action.command.task ;
			}
			
			listHTML += "<li>";
			listHTML += "<h1>" + dateString + "</h1>";
			listHTML += "<p><span class='tag'>" + action.command.type + "</span> " + description + "</p>";
			listHTML += "<div class='rmPlanned'><a href='#' data-role='none' data-databaseId=" + action.databaseId + " >&#215;</a></div></li>";
			listHTML += "</li>";
		});
				
		console.log("[INFO]: List updated");
		
		$("#plannedActionsList").html(listHTML);
		
		$('a[data-databaseId]').click(function (event) {
			event.preventDefault();
			var ajax = $.ajax("/removePlannedAction?id=" + $(this).attr("data-databaseId") + "&rev=" + $(this).attr("data-databaseRev"))
			
			ajax.done(function(response) {showStatus("Kommando borttaget: " + response);})
			ajax.fail(function() {showStatus('FEL: Anslutningen kunde inte upprättas.');})
			
			updatePlannedListMultipleTimes()
		 });
	});
	
	ajax.fail(function() {showStatus('FEL: Anslutningen kunde inte upprättas.');})
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
			
	ajax.done(function(response) {showStatus(response.replace("<script>window.location = '/';</script>",""));})
	ajax.fail(function() {showStatus('FEL: Anslutningen kunde inte upprättas.');})
	
	console.log("[CMD]: " + command);
}

function getDateString(date) {
	return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
}

function getTimeString(date) {
	return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
}