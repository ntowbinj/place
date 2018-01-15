var globals = {
    downBoxes: {},
    downPitches: {},
    DONE_WAIT_SUCCESS: 1000,
    DONE_WAIT_FAIL: 2000,
    consecutiveEmpties: 0
};

var colors = {
    LISTEN: '#9feeff',
    PLAY: '#9feeff',
    CORRECT: 'white',
    INCORRECT: '#ff0'
};

var playListen = {
    PLAYING: 0,
    LISTENING: 1,
    IDLE: 2,
    BETWEEN: 3
}

var PLAYING_GROUP = 123;
var TIMER_GROUP = 456;

var state = {
    timeouts: {},
    basePitch: 36,
    running: false,
    downHandlers: {},
    playListen: playListen.PLAYING,
    lessonReqId: -1
}
var ctx;
var noteToColor = {
    'C': '#fd0100',
    'C#': '#6537fc',
    'D': '#ffff6b',
    'D#': '#c900c8',
    'E': '#d5ffeb',
    'F': '#c50224',
    'F#': '#6bb5fc',
    'G': '#ffbd35',
    'G#': '#be01fd',
    'A': '#9fff9e',
    'A#': '#97014b',
    'B': '#9feeff'
}
var noteToSpellings = {
    'C': 'C',
    'C#': 'C#/Db',
    'D': 'D',
    'D#': 'D#/Eb',
    'E': 'E',
    'F': 'F',
    'F#': 'F#/Gb',
    'G': 'G',
    'G#': 'G#/Ab',
    'A': 'A',
    'A#': 'A#/Bb',
    'B': 'B'
}
var noteToColors;

function byId(id) {
    return document.getElementById(id);
}

function buildNoteToColors() {
    ret = {};
    for (var n in noteToColor) {
        ret[n] = {};
        var color = noteToColor[n];
        ret[n].color = color;
        ret[n].altColor = '#' + tinycolor(noteToColor[n]).brighten(20).toHex();
        var isDark = tinycolor(color).isDark();
        ret[n].isDark = isDark;
        ret[n].slightlyDark = '#' + isDark ? color : tinycolor(color).darken(5).toHex();
        ret[n].dark = '#' + tinycolor(color).desaturate(20).darken(isDark ? 10 : 20).toHex();
        ret[n].veryDark = '#' + tinycolor(color).desaturate(20).darken(40).toHex();
        ret[n].light = '#' + tinycolor(color).brighten(40).toHex();
    };
    return ret;
}

var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var lowC = 0;
var dim = {
    x: 4,
    y: 5
}

function getPitch(offset) {
    return getRelativeFromBase(offset) + state.basePitch;
}

function getRelativeFromBase(offset) {
    var downNeck = offset % dim.y;
    var string = Math.floor(offset/dim.y);
    return string * crossColumnInterval + downNeck;
}

function boxW() {
    var ret = Math.floor((globals.canvas.width / dim.x));
    return ret;
}

function boxH() {
    var ret = Math.floor((globals.canvas.height / dim.y));
    return ret;
}

function _xy(x, y) {
    return {x: x, y: y};
}

function resolve(xy) {
    return _xy(
        Math.floor(xy.x / boxW()),
        Math.floor(xy.y / boxH())
    );
}

function getNoteDisplayFromOffset(o) {
    var pitch = getPitch(o);
    var idx = (lowC + pitch) % notes.length;
    return notes[idx];
}

function getNoteDisplayFromPitch(p) {
    return notes[p % notes.length];
}

var crossColumnInterval = 5;

function coordToNoteOffset(xy) {
    return xy.x*dim.y + xy.y;
}

function getBoundsForCoord(xy) {
    var ret = {
        xy: _xy(xy.x * boxW(), xy.y * boxH()),
        wh: _xy(boxW(), boxH())
    }
    return ret;
}

function toOffset(xy) {
    return (xy.x * dim.y) + xy.y;
}

function getBoxFromCoord(xy) {
    var offset = coordToNoteOffset(xy);
    var pitch = getPitch(offset);
    var noteDisplay = getNoteDisplayFromPitch(pitch);
    var tritone = getNoteDisplayFromPitch(pitch + 6);
    var isDark = noteToColors[noteDisplay].isDark;
    var slightlyDark = noteToColors[noteDisplay].slightlyDark;
    var dark = noteToColors[noteDisplay].dark;
    var altColor = noteToColors[noteDisplay].altColor;
    var veryDark = noteToColors[noteDisplay].veryDark; 
    var light = noteToColors[noteDisplay].light;
    var textColor = '#' + tinycolor(noteToColor[tritone]).desaturate(10).lighten(20).toHex();
    return {
        xy: xy,
        offset: offset,
        noteDisplay: noteDisplay,
        pitch: pitch,
        //note: this.offset + lowC,
        color: noteToColors[noteDisplay].color,
        textColor: textColor,
        border: false,
        bounds: getBoundsForCoord(xy),
        draw: function() {
            if (this.border) {
                this.drawColor(veryDark);
                this.drawSmall(light, 55);
                this.drawSmall(slightlyDark, 10);
            } else {
                this.drawColor("black");
                this.drawSmall(dark, 55);
                this.drawSmall(this.color, 10);
            }
            ctx.fillStyle = this.textColor;
            var font = Math.floor(this.bounds.wh.x/5) + 'px sans serif';
            ctx.font = font;
            ctx.fillText(
                noteToSpellings[this.noteDisplay],
                this.bounds.xy.x + this.bounds.wh.x * 0.15,
                this.bounds.xy.y + this.bounds.wh.y * 0.85,
                this.bounds.wh.x - (this.bounds.wh.x / 10)
            );
        },
        drawAlt: function() {
            this.drawColor(light);
            this.drawSmall(altColor, 20);
        },
        drawColor: function(color) {
            ctx.fillStyle = color;
            ctx.fillRect(this.bounds.xy.x, this.bounds.xy.y, this.bounds.wh.x, this.bounds.wh.y);
        },
        drawSmall: function(color, smallness) {
            ctx.fillStyle = color;
            var offset = this.bounds.wh.y / smallness;
            ctx.fillRect(
                this.bounds.xy.x + offset,
                this.bounds.xy.y + offset,
                this.bounds.wh.x - 2 * offset,
                this.bounds.wh.y - 2 * offset
            );
        },
        down: function(skipDraw) {
            noteOn(pitch);
            if (!skipDraw) {
                this.drawAlt();
            }
            globals.downBoxes[this.offset] = 1;
        },
        up: function() {
            noteOff(pitch);
            this.draw();
            delete globals.downBoxes[this.offset];
        }
    };
}

var grid;
var pitchToGrid;
function getGrid() {
    var grid = [];
    pitchToGrid = {}; // could use list since contiguous keys
    for (var i = 0; i < dim.x; i++) {
        for (var j = 0; j < dim.y; j++) {
            var box = getBoxFromCoord(_xy(i, j));
            grid.push(box);
            if (!pitchToGrid[box.pitch]) {
                pitchToGrid[box.pitch] = box;
            }
        }
    }
    return grid;
}

function xyFromEvent(ev) {
    var ret = _xy(
        ev.pageX - globals.canvas.offsetLeft,
        ev.pageY - globals.canvas.offsetTop
    );
    return ret;
}


function init() {
    MIDI.loader = new widgets.Loader;
    MIDI.loadPlugin({
        instrument: "acoustic_grand_piano",
        soundfontUrl: "/static/js/MIDI.js/soundfont/",
        callback: function() {
            MIDI.loader.stop();	
            canvas = byId('canvas');
            var handler = function(ev) {
                var list = [resolve(xyFromEvent(ev))];
                touches(list);
            }
            var clickstate = false;
            var enter = function(ev) {
                clickstate = true;
                handler(ev);
            };
            var end = function(ev) {
                clickstate = false;
                touches([]);
            };
            var doTouch = function(ev) {
                ev.preventDefault();
                var touchList = [];
                tl = ev;
                for (var i = 0; i < ev.touches.length; i++) {
                    touchList.push(resolve(xyFromEvent(ev.touches.item(i))));
                }
                touches(touchList);
            };
            if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
                canvas.addEventListener('touchstart', doTouch);
                canvas.addEventListener('touchmove', doTouch);
                canvas.addEventListener('touchend', function(ev) {
                    touches([]);
                });
            } else {
                canvas.addEventListener('mousedown', enter);
                canvas.addEventListener('mousemove', function(ev) {
                    if (clickstate) {
                        handler(ev);
                    }
                });
                canvas.addEventListener('mouseup', end);
                canvas.addEventListener('mouseout', end);
            }
            globals.canvas = canvas;
            noteToColors = buildNoteToColors();
            window.addEventListener('resize', resize);
            resize();
            setUpCtrl();
        }
    });
}

function getStartStop() {
    return byId('startStop');
}

var superIrritatingHack = false;
function setUpCtrl() {
    var startStop = getStartStop();
    var startText = "START"; // storing state in the DOM :D
    var stopText = "STOP";
    startStop.onclick = function() {
        if (!superIrritatingHack) {
            superIrritatingHack = true;
            MIDI.noteOn(0, 25, 10, 0); 
            MIDI.noteOff(0, 25, 0); 
        }
        var innerText = startStop.innerText;
        if (innerText === startText) {
            start();
            startStop.innerText = stopText;
        } else {
            console.log("stopping");
            stop();
            startStop.innerText = startText;
        }
    }
}

function touches(list) {
    var boxes = [];
    for (var t = 0; t < list.length; t++) {
        touch = list[t];
        var box = grid[toOffset(touch)];
        if (box) { // TODO have precondition this is not undefined
            boxes.push(box);
        }
    }
    doDownBoxes(boxes);
}

function clearDownHandlers() {
    state.downHandlers = {};
}

function indexBoxes(boxList) {
    var index = {};
    for (var b = 0; b < boxList.length; b++) {
        var box = boxList[b];
        index[box.offset] = box;
    }
    return index;
}

function canUserPlayNotes() {
    return (state.playListen != playListen.LISTENING && state.playListen != playListen.BETWEEN);
}

function doDownBoxes(boxes) {
    var index = indexBoxes(boxes);
    if (canUserPlayNotes()) {
        for (var b = 0 ; b < boxes.length; b++) {
            var box = boxes[b];
            if (!(box.offset in globals.downBoxes)) {
                box.down();
                for (var k in state.downHandlers) {
                    state.downHandlers[k](box.offset);
                }
            }
        }
    }
    for (var offset in globals.downBoxes) {
        // list containment, O(n)
        if (!(offset in index)) {
            grid[offset].up();
        }
    }
}

function resize() {
    //canvas.width = window.innerWidth;
    //canvas.height = window.innerHeight;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();
}

function draw() {
    grid = getGrid();
    for (var n = 0; n < grid.length; n++) {
        grid[n].draw();
    }
}

function finishBatch() {
    run();
}

function startBatch(result) {
    doAllLessons(result.lessonList, finishBatch);
}

function setGrid(lesson) {
    state.basePitch = lesson.base;
    dim.x = lesson.w;
    dim.y = lesson.h;
    resize();
}

function start() {
    state.running = true;
    run();
}

function stop() {
    if (state.playListen === playListen.PLAYING) {
        playState.stops++;
    }
    clearRequest(state.lessonReqId);
    clearDownHandlers();
    clear(PLAYING_GROUP);
    playState.interrupt();
    state.running = false;
    idle();
    globals.consecutiveEmpties = 0;
    allNotesOff();
    draw();
}

function noteOn(v) {
    MIDI.noteOn(0, v, 127, 0); 
    globals.downPitches[v] = 1;
}

function noteOff(v) {
    MIDI.noteOff(0, v, 0); 
    delete globals.downPitches[v];
}

function allNotesOff() {
    Object.keys(globals.downPitches).forEach(function(pitch) {
        noteOff(pitch);
    });
}

function downWithHintMaybe(pitch, hint) {
    if (hint) {
        pitchToGrid[pitch].border = true;
        pitchToGrid[pitch].down();
    } else {
        noteOn(pitch);
    }
}

function upWithHintMaybe(pitch, hint) {
    if (hint) {
        pitchToGrid[pitch].up();
    } else {
        noteOff(pitch);
    }
}

function doPlayLessonResume(lesson, index, next) {
    if (index >= lesson.sequence.length) {
        next();
        return;
    }
    var pitch = lesson.sequence[index];
    var isHint = index < lesson.hintPrefix; 
    downWithHintMaybe(pitch, isHint);
    timeout(PLAYING_GROUP, function() {
        //noteOff(pitch);
        upWithHintMaybe(pitch, isHint);
        timeout(PLAYING_GROUP,
            function() { doPlayLessonResume(lesson, index + 1, next); },
            lesson.restMillis
        );
    }, lesson.noteDurationMillis);
}

var DOWN_HANDLER = 'DOWN_HANDLER';

function timeout(group, f, t) {
    var wrapped = function() {
        deleteTimeout(group);
        f();
    };
    result = setTimeout(wrapped, t);
    state.timeouts[group] = result;
}

function deleteTimeout(group) {
    delete state.timeouts[group];
}

function clear(group) {
    clearTimeout(state.timeouts[group]);
    delete state.timeouts[group];
}

function isSubSequence(containee, container) {
    var j = 0;
    for (var i = 0; i < container.length; i++) {
        if (j >= containee.length) {
            return true;
        }
        if (containee[j] === container[i]) {
            j++;
        }
    }
    return j >= containee.length;
}

function isDone(recording, lesson) {
    var doneLength = lesson.sequence.length + lesson.tolerance;
    var success = isSubSequence(lesson.sequence, recording.notes);
    var wait = success ? globals.DONE_WAIT_SUCCESS : globals.DONE_WAIT_FAIL;
    var notTooLong = {isDone: success, wait: wait, success: success};
    if (success) {
        return notTooLong;
    }
    if (recording.notes.length >= doneLength) {
        return {isDone: true, wait: globals.DONE_WAIT_FAIL, success: false};
    }
    return notTooLong;
}

function listening() {
    var instruction = $('#instruction');
    instruction.text('LISTEN');
    //instruction.css({'color': colors.LISTEN});
    state.playListen = playListen.LISTENING;
}

function playing() {
    var instruction = $('#instruction');
    instruction.text('PLAY IT BACK');
    //instruction.css({'color': colors.PLAY});
    state.playListen = playListen.PLAYING;
}

function correct() {
    var instruction = $('#instruction');
    instruction.text('CORRECT');
    //instruction.css({'color': colors.CORRECT});
}

function incorrect() {
    var instruction = $('#instruction');
    instruction.text('INCORRECT');
    //instruction.css({'color': colors.INCORRECT});
}


function idle() {
    var instruction = $('#instruction');
    instruction.text('');
    state.playListen = playListen.IDLE;
}

function between() {
    var instruction = $('#instruction');
    instruction.text('');
    state.playListen = playListen.BETWEEN;
}

function unixtime() {
    return new Date().getTime();
}


var playState = {
    recordingStartTime: -1,
    recordingBuffer: {},
    stops: 0,
    interrupt: function() {}
};


var onces = {};
var oncesCounter = 0;
function once(f) {
    var id = oncesCounter++;
    onces[id] = 1; 
    return function() {
        if (id in onces) {
            delete onces[id];
            return f.apply(null, arguments);
        } else {
            console.log('already did once: ' + id);
        }
    };
}

var timer = {
    start: function (waitMillis) {
        var start = unixtime();
        var setter = function() {
            var el = $("#timer"); 
            //el.css({'color': colors.PLAY});
            el.text(
                Math.ceil((waitMillis - (unixtime() - start))/1000)
            );
            timeout(
                TIMER_GROUP,
                setter,
                300
            );
        };
        setter();
    },
    clear: function () {
        var el = $("#timer"); 
        el.text('');
        clear(TIMER_GROUP);
    }
};

function doRecordResponse(lesson, finishRecording) {
    playing();
    timer.start(lesson.waitTimeMillis);
    var recording = {};
    playState.recordingStartTime = unixtime();
    recording['notes'] = [];
    recording['noteTimes'] = [];
    var finalize = once(function(isDoneResult, ignoreRecording) {
        delete state.downHandlers[DOWN_HANDLER];
        between();
        timer.clear();
        recording['passed'] = isDoneResult.success;
        if (!ignoreRecording) {
            playState.recordingBuffer[lesson.lessonKey] = recording;
        }
        flushRecordingBuffer();
    });
    playState.interrupt = function() {
        var ignore = playState.stops <= 2;
        finalize(isDone(recording, lesson), ignore);
    }
    var finalizeAndContinue = function() {
        var isDoneResult = isDone(recording, lesson);
        finalize(isDoneResult);
        if (isDoneResult.success) {
            correct();
        } else {
            incorrect();
        }
        if (recording.notes.length === 0) {
            globals.consecutiveEmpties++;
            if (globals.consecutiveEmpties > 1) {
                stop();
                return;
            }
        } else {
            globals.consecutiveEmpties = 0;
        }
        timeout(
            PLAYING_GROUP,
            finishRecording,
            isDoneResult.wait
        );
    };
    var downHandler = function(offset) {
        recording.notes.push(getPitch(offset));
        recording.noteTimes.push(unixtime() - playState.recordingStartTime);
        var isDoneResult = isDone(recording, lesson);
        if (isDoneResult.isDone) {
            clear(PLAYING_GROUP);
            finalizeAndContinue();
        }
    }
    state.downHandlers[DOWN_HANDLER] = downHandler;
    timeout(
        PLAYING_GROUP,
        finalizeAndContinue,
        lesson.waitTimeMillis
    )
}

function flushRecordingBuffer() {
    if ($.isEmptyObject(playState.recordingBuffer)) {
        return;
    }
    postJson("/recording", playState.recordingBuffer);
    playState.recordingBuffer = {};
}

function doLesson(lesson, next) {
    listening();
    setGrid(lesson);
    var startLesson = function() {
        doPlayLessonResume(
            lesson,
            0,
            function() {
                doRecordResponse(lesson, next);
            }
        );
    }
    timeout(PLAYING_GROUP, startLesson, 500);
}

function doAllLessons(lessonList, finish) {
    doAllLessonsResume(lessonList, 0, finish);
}

function doAllLessonsResume(lessonList, index, finish) {
    if (index >= lessonList.length) {
        finish();
        return;
    }
    doLesson(
        lessonList[index],
        function() {
            doAllLessonsResume(lessonList, index + 1, finish)
        }
    );
}

var requests = {};
var reqCount = 0;
function getCancelably(path, data, callback) {
    var reqId = reqCount++;
    requests[reqId] = 1;
    $.get(path, data, function(result) {
        if (reqId in requests) {
            callback(result);
        } else {
            console.log("ignoring request " + reqId);
        }
        delete requests[reqId];
    });
    return reqId;
}

function clearRequest(reqId) {
    delete requests[reqId];
}

function run() {
    if (!state.running) {
        return;
    }
    state.lessonReqId = getCancelably("/lessons", {}, startBatch);
}

function postJson(path, data, success) {
    $.post(
        "/recording",
        {json: JSON.stringify(data)}, // why :(
        success,
        'json'
    );
}


window.addEventListener('load', init);
