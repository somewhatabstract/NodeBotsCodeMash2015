var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function () {
    var led = new five.Led(11);
    led.pulse(1000);

    var input = new five.Sensor("A0");
    input.on("data", function() {
        console.log(this.value);
    });
});