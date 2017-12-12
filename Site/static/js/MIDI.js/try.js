function playnote(){
    var delay = 0;
    var note = 50;
    var velocity = 127;
    MIDI.setVolume(0, 127);
    MIDI.noteOn(0, note, velocity, delay);
    MIDI.noteOff(0, note, delay + 0.75);
    for var element in document.getElementsByClassName('notechoice'){
        alert(element.value);
    }
}

var player = function(){
    alert("original function");
}

window.onload = function () {
//	MIDI.loader = new widgets.Loader;
//	document.getElementById("clicked").onclick = say
	MIDI.noteOn(0, 50, 127, 0);
	MIDI.loadPlugin({
		instrument: "acoustic_grand_piano", // or multiple instruments
		callback: function() {
//			MIDI.loader.stop();	
                        MIDI.setVolume(0, 127);
                        document.getElementById("click").onclick = playnote;
                        player = function play(note){
                            MIDI.noteOn(0, note, velocity, delay);
                            MIDI.noteOff(0, note, delay + 0.75);
                        }

		}
	});
        alert("end of window.onload");
        player(51);
        var delay = 0; // play one note every quarter second
        var note = 50; // the MIDI note
        var velocity = 127; // how hard the note hits
        // play the note
        
};
