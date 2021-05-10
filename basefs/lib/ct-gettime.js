var ctgtd = new Date();
var space = " ";
// TODO
// add seconds

// Time Functions

exports.getTimeAsString = function(opt) { // Get system time as string. Example: 1:30 PM
    switch(opt) {
        case "NoAMPM": // return as 1:30
            if (ctgtd.getHours() > 12) {
                var dumbFuckingHour = ctgtd.getHours() - 12;
            } else {
                var dumbFuckingHour = ctgtd.getHours();
            }
            return dumbFuckingHour+":"+ctgtd.getMinutes(); 
        case "24Hour": // return as 13:30
            return ctgtd.getHours()+":"+ctgtd.getMinutes();
        default:    // return as 1:30 pm
            if (ctgtd.getHours() > 12) {
                var dumbFuckingHour = ctgtd.getHours() - 12;
                var ampmindc = "PM"; // ampmindc is the AM/PM indicator
            } else {
                var dumbFuckingHour = ctgtd.getHours();
                var ampmindc = "AM";
            }
            return dumbFuckingHour+":"+ctgtd.getMinutes()+space+ampmindc; 

    }
}

exports.getHourAsInt = function() { // Get hour as integer. (In 12 hour) Example: 1
    if (ctgtd.getHours() > 12) {
        return ctgtd.getHours() - 12;
    } else {
        return ctgtd.getHours();
    }
}

exports.getMinuteAsInt = function() { // Get minute as integer. Example: 30
    return ctgtd.getMinutes()
}

exports.getTimeAsInt = function() { // Get time as integer, will require additional code to parse. Example: 130. [HHMM]

}

// Date Functions

exports.getDateISOasString = function() {

}

exports.getDateISOasInt = function() {

}

exports.getYearasInt = function() {

}

exports.getMonthasInt = function() {

}

exports.getDayasInt = function() {

}

exports.getWeekDay = function(type) {
    switch(type) {
        case "Int": // If request is for integer
            return; // Return WeekDay as Int (1 thru 7)

        case "Str": // If request is for string
            return; // Return weekday as string (Monday,Tuesday,Etc.)

        default: // If request is not int/str then
            return "YOU'RE USING THIS WRONG"; // tell them they're stupid
    }
}

