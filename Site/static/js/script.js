var globals = {
    downBoxes: {},
    downPitches: {},
    DONE_WAIT_SUCCESS: 1500,
    DONE_WAIT_FAIL: 3000,
    consecutiveEmpties: 0
};

var playListen = {
    PLAYING: 0,
    LISTENING: 1
}

var GROUP = 123;

var state = {
    timeouts: {},
    basePitch: 36,
    running: false,
    downHandlers: {},
    playListen: playListen.LISTENING
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
var noteToAltColor;

function buildNoteToAltColor() {
    ret = {};
    for (var n in noteToColor) {
        ret[n] = '#' + tinycolor(noteToColor[n]).desaturate(20).lighten(3).brighten(15).toHex();
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
    var color = noteToColor[noteDisplay];
    var textColor = '#' + tinycolor(noteToColor[tritone]).desaturate(20).lighten(20).toHex();
    return {
        xy: xy,
        offset: offset,
        noteDisplay: noteDisplay,
        pitch: pitch,
        //note: this.offset + lowC,
        color: color,
        altColor: noteToAltColor[noteDisplay],
        textColor: textColor,
        bounds: getBoundsForCoord(xy),
        draw: function() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.bounds.xy.x, this.bounds.xy.y, this.bounds.wh.x, this.bounds.wh.y);
            ctx.fillStyle = this.textColor;
            var font = Math.floor(this.bounds.wh.x/6) + 'px sans serif';
            ctx.font = font;
            ctx.fillText(
                noteToSpellings[this.noteDisplay],
                this.bounds.xy.x + this.bounds.wh.x * 0.025,
                this.bounds.xy.y + this.bounds.wh.y * 0.9,
                this.bounds.wh.x
            );
        },
        drawAlt: function() {
            ctx.fillStyle = this.altColor;
            ctx.fillRect(this.bounds.xy.x, this.bounds.xy.y, this.bounds.wh.x, this.bounds.wh.y);
        },
        down: function(skipDraw) {
            if (!skipDraw) {
                this.drawAlt();
            }
            globals.downBoxes[this.offset] = 1;
            noteOn(pitch);
        },
        up: function() {
            this.draw();
            delete globals.downBoxes[this.offset];
            noteOff(pitch);
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
            MIDI.noteOn(0, 0, 0, 0); //for instant start
            MIDI.noteOff(0, 0, 100);
            canvas = document.getElementById('canvas');
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
            noteToAltColor = buildNoteToAltColor();
            window.addEventListener('resize', resize);
            var resizeAndStart = function() {
                resize();
                start();
            }
            setTimeout(resizeAndStart,500);
        }
    });
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

function indexBoxes(boxList) {
    var index = {};
    for (var b = 0; b < boxList.length; b++) {
        var box = boxList[b];
        index[box.offset] = box;
    }
    return index;
}

function doDownBoxes(boxes, force) {
    var index = indexBoxes(boxes);
    for (var b = 0 ; b < boxes.length; b++) {
        var box = boxes[b];
        if (!(box.offset in globals.downBoxes)) {
            if ((state.playListen == playListen.LISTENING) || force) {
                box.down();
            }
            for (var k in state.downHandlers) {
                state.downHandlers[k](box.offset);
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
    ctx.fillStyle = '#eee';
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

function startBatch(lessonList) {
    doAllLessons(lessonList, finishBatch);
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
    state.running = false;
    state.playListen = playListen.LISTENING;
    globals.consecutiveEmpties = 0;
}

function noteOn(v) {
    MIDI.noteOn(0, v, 127, 0); 
    globals.downPitches[v] = 1;
}

function noteOff(v) {
    MIDI.noteOff(0, v, 0); 
    delete globals.downPitches[v];
}

function downWithHintMaybe(pitch, hint) {
    if (hint) {
        doDownBoxes([pitchToGrid[pitch]], true);
    } else {
        noteOn(pitch);
    }
}

function upWithHintMaybe(pitch, hint) {
    if (hint) {
        doDownBoxes([]);
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
    timeout(GROUP, function() {
        //noteOff(pitch);
        upWithHintMaybe(pitch, isHint);
        timeout(GROUP,
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
    if (recording.notes.length > doneLength) {
        return {isDone: true, wait: globals.DONE_WAIT_FAIL, success: false};
    }
    var success = isSubSequence(lesson.sequence, recording.notes);
    var wait = success ? globals.DONE_WAIT_SUCCESS : globals.DONE_WAIT_BAD;
    return {isDone: success, wait: wait, success: success};
}

function listening() {
    state.playListen = playListen.LISTENING;
}

function playing() {
    state.playListen = playListen.PLAYING;
}

function unixtime() {
    return new Date().getTime();
}


recordingBuffer = {};
function doRecordResponse(lesson, finishRecording) {
    listening();
    var recording = {};
    var baseTime = unixtime();
    recording['notes'] = [];
    recording['noteTimes'] = [];
    var finalize = function(isDoneResult) {
        delete state.downHandlers[DOWN_HANDLER];
        recording['passed'] = isDoneResult.success;
        recordingBuffer[lesson.lessonKey] = recording;
        if (recording.notes.length === 0) {
            globals.consecutiveEmpties++;
            if (globals.consecutiveEmpties > 1) {
                stop();
            }
        } else {
            globals.consecutiveEmpties = 0;

        }

        flushRecordingBuffer(recordingBuffer);
        recordingBuffer = {};
        timeout(
            GROUP,
            finishRecording,
            isDoneResult.wait
        );
    };
    var downHandler = function(offset) {
        recording.notes.push(getPitch(offset));
        recording.noteTimes.push(unixtime() - baseTime);
        var isDoneResult = isDone(recording, lesson);
        if (isDoneResult.isDone) {
            clear(GROUP);
            finalize(isDoneResult);
        }
    }
    state.downHandlers[DOWN_HANDLER] = downHandler;
    timeout(
        GROUP,
        function() { finalize(isDone(recording, lesson)); },
        lesson.waitTimeMillis
    )
}

function flushRecordingBuffer(recordingBuffer) {
    postJson("/recording", recordingBuffer);
}

function doLesson(lesson, next) {
    playing();
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
    timeout(GROUP, startLesson, 500);
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


lessonBuffer = [];

function run() {
    if (!state.running) {
        return;
    }
    if (lessonBuffer.length == 0) {
        $.get(
                "/lessons", {}, function(result) {
                    prependToBuffer(result.lessonList);
                    dequeueFromBuffer();
                }
        );
    } else if (lessonBuffer.length <= 5) {
        $.get(
                "/lessons", {}, function(result) {
                    prependToBuffer(result.lessonList);
                }
        );
        dequeueFromBuffer();
    } else {
        dequeueFromBuffer();
    }
}

function prependToBuffer(lessonList) {
    lessonBuffer = lessonList.concat(lessonBuffer);
}

function dequeueFromBuffer() {
    singleton = [lessonBuffer[lessonBuffer.length - 1]];
    lessonBuffer = lessonBuffer.slice(0, lessonBuffer.length - 1);
    console.log(lessonBuffer.map(function(l) { return l.lessonKey }));
    console.log(lessonBuffer.map(function(l) { return l.sequence.length }));
    startBatch(singleton);
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
