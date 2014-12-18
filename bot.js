var five = require("johnny-five");
var fs = require("fs");
var board = new five.Board();

board.on("ready", function () {
    var stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    
    var setupEyes = function (onCalibrated) {
        var calibrate = function () {
            var calibrationFile = ".calibration";
            var calibrationTime = 3000;
            var calibrating = true;
            
            var eyes = new five.IR.Reflect.Array({
                emitter: 13,
                pins: ["A0", "A1", "A2", "A3", "A4", "A5"]
            });
            eyes.enable();

            var calibrationDone = function (saveCalibration) {
                calibrating = false;
                if (saveCalibration) {
                    fs.writeFile(calibrationFile, JSON.stringify(eyes.calibration));
                }
                onCalibrated(eyes);
            };
            
            if (fs.existsSync(calibrationFile)) {
                eyes.loadCalibration(JSON.parse(fs.readFileSync(calibrationFile)));
                calibrationDone(false);
            } else {
                console.log("Place the bot against the line, perpendicular and enter any key to begin calibration...");
                stdin.once("keypress", function () {
                    eyes.calibrateUntil(function () { return !calibrating; });
                    setTimeout(function () {
                        calibrationDone(true);
                    }, calibrationTime);
                });
            }
        };
        
        calibrate();
    };
    
    var setupWheels = function () {
        var wheels = {
            left: new five.Servo({ pin: 9, type: 'continuous' }),
            right: new five.Servo({ pin: 10, type: 'continuous' })
        };
        
        wheels.left.center();
        wheels.right.center();
        
        return wheels;
    };

	var eyes;
    var wheels = setupWheels();
    var lastLine = undefined;
    setupEyes(function (theEyes) {
        eyes = theEyes;
	    eyes.on("line", function(err, line) {
		    if (line !== lastLine) {
			    lastLine = line;
			    console.log("line: ", line);
		    }
	    });
    });
    
    this.repl.inject({ wheels: wheels, eyes: eyes });
});