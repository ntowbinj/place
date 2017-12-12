
function playnote(){
    MIDI.setVolume(0, 127);
    var count = 0;
    var duration = .5;
    var choices = document.getElementsByClassName('noteChoice');
    var notes = new Array();
    for (var i = 0; i<choices.length; i++){
        count++;
        console.log(choices[i].value);
        if(choices[i].checked){
            notes.push(parseInt(choices[i].value));
        }
    }
    var repeats = parseInt(document.getElementById('repeats').value);
    for (var i = 0; i<repeats; i++){
        var index = Math.floor(Math.random()*notes.length);
        MIDI.noteOn(0, 48 + notes[index], 127, i/5);
        //MIDI.noteOff(0, 48+notes[index], i/5 + duration);
    }
}

function stop(){
    MIDI.stopAllNotes();
}
window.onload = function () {
//	MIDI.noteOn(0, 50, 127, 0);
	MIDI.loadPlugin({
		instrument: "acoustic_grand_piano",
		callback: function() {
                       alert("loaded"); 
                       document.getElementById("start").onclick = playnote; 
                       document.getElementById("stop").onclick = stop;
		}
	});
        
};

