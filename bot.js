var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function () {
    var wheels = {
        left: new five.Servo({ pin: 9, type: 'continuous' }),
        right: new five.Servo({ pin: 10, type: 'continuous' })
    };

    this.repl.inject({ wheels: wheels });

    wheels.left.center();
	wheels.right.center();
});