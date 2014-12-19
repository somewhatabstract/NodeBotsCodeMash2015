var five = require("johnny-five");
var board = new five.Board();

var stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();

board.on("ready", function () {
    
    var calibrating = true;
    var eyes = new five.IR.Reflect.Array({
        emitter: 13,
        pins: ["A0", "A1", "A2", "A3", "A4", "A5"]
    });
    
    eyes.enable();
    
    eyes.calibrateUntil(function () { return !calibrating; });
    
    console.log("When calibration is complete, hit enter");
    setImmediate(function () {
        stdin.once("keypress", function () {
            // Stop calibration
            calibrating = false;
            
            eyes.on("line", function (err, line) {
                console.log(line);
            });
            
            setImmediate(function () {
                stdin.once("keypress", function () {
                    // Stop the bot and quit
                    eyes.removeAllListeners();
                    // Need to give time for the signals to get to the wheels
                    setTimeout(function () { process.exit(0); }, 250);
                });
            });
        });
    });
});
