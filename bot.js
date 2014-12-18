var five = require("johnny-five");
var fs = require("fs");
var board = new five.Board();

board.on("ready", function () {
    var stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    
    var setupEyes = function (wheels, onCalibrated) {
        var calibrate = function () {
            var calibrationFile = ".calibration";
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
                console.log("Place the bot against the line, perpendicular and hit enter to begin calibration...");
                stdin.once("keypress", function () {
                    eyes.calibrateUntil(function () { return !calibrating; });
                    
                    var traversalTime = 1000;
                    var traversals = 2;
                    var traverseLine = function () {
                        wheels.forward();
                        setTimeout(function () {
                            wheels.reverse();
                            setTimeout(function () {
                                if (--traversals !== 0) {
                                    traverseLine();
                                } else {
                                    wheels.stop();
                                    calibrationDone(true);
                                }
                            }, traversalTime);
                        }, traversalTime);
                    };
                    
                    traverseLine();
                });
            }
        };
        
        calibrate();
    };
    
    var setupWheels = function () {
        var theseWheels = {
            left: new five.Servo({ pin: 10, type: 'continuous' }),
            right: new five.Servo({ pin: 9, type: 'continuous' })
        };
        
        var move = function (speed, dir, steer, steerAmount) {
            var servoMax = 1;
            var leftDir, rightDir, leftSpeed, rightSpeed;
            speed = speed || 0.5;
            
            switch (dir) {
                default:
                case "f":
                    leftDir = "cw";
                    rightDir = "ccw";
                    break;


                case "r":
                    leftDir = "ccw";
                    rightDir = "cw";
                    break;
            }
            
            if (steer === undefined) {
                leftSpeed = rightSpeed = speed;
            } else {
                if (steerAmount === undefined || steerAmount < 0.5) { steerAmount = 0.5; }
                
                leftSpeed = (steer === "l") ? (speed * steerAmount) : (speed - speed * steerAmount);
                rightSpeed = (steer === "r") ? (speed * steerAmount) : (speed - speed * steerAmount);
            }
            
            theseWheels.left[leftDir](leftSpeed * servoMax);
            theseWheels.right[rightDir](rightSpeed * servoMax);
        };
        
        theseWheels.stop = function () {
            theseWheels.left.center();
            theseWheels.right.center();
        };
        
        theseWheels.forward = function (speed, steer, steerAmount) {
            move(speed, "f", steer, steerAmount);
        };
        
        theseWheels.reverse = function (speed, steer, steerAmount) {
            move(speed, "r", steer, steerAmount);
        };
        
        return theseWheels;
    };
    
    var eyes;
    var wheels = setupWheels();
    
    var startLineFollowing = function () {
        var drivingRules = {
            1: {
                steer: "r",
                steerAmount: 1
            },
            1500: {
                steer: "r",
                steerAmount: 0.5
            },
            2400: {
                steer: "r",
                steerAmount: 0.25
            },
            2600: {
            },
            3500: {
                steer: "l",
                steerAmount: 0.25
            },
            4999: {
                steer: "l",
                steerAmount: 0.5
            },
            5001: {
                steer: "l",
                steerAmount: 1
            }
        };
        
        var last = undefined;
        var setCourse = function (line) {
            var threshold = Object.keys(drivingRules).find(function (ruleThreshold) {
                return line <= parseInt(ruleThreshold);
            });
            if (threshold !== last) {
	            last = threshold;
                var rule = drivingRules[threshold];
	            wheels.forward(1, rule.steer, rule.steerAmount);
            }
        };
        
        eyes.on("line", function (err, line) {
            setCourse(line);
        });

	    setTimeout(function() {
            stdin.once("keypress", function () {
	            eyes.removeAllListeners();
			    wheels.stop();
			    setTimeout(function() { process.exit(0); }, 250);
		    });
	    });
    };
    
    var beginDriving = function () {
        console.log("Place the bot on the course and press enter to begin line following...");
        stdin.once("keypress", startLineFollowing);
    };
    
    setupEyes(wheels, function (theEyes) {
        eyes = theEyes;
        beginDriving();
    });
    
    this.repl.inject({ wheels: wheels, eyes: eyes });
});