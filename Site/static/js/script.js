var globals = {
    downBoxes: {},
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
    playListen: playListen.PLAYING
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
    x: 7,
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

var crossColumnInterval = 5;

function coordToNoteOffset(xy) {
    return xy.x*dim.y + xy.y;
}

function getBoundsForCoord(xy) {
    return {
        xy: _xy(xy.x * boxW(), xy.y * boxH()),
        wh: _xy(boxW(), boxH())
    }
}

function toOffset(xy) {
    return (xy.x * dim.y) + xy.y;
}

function getBoxFromCoord(xy) {
    var offset = coordToNoteOffset(xy);
    var noteDisplay = getNoteDisplayFromOffset(offset);
    var color = noteToColor[noteDisplay];
    return {
        xy: xy,
        offset: offset,
        noteDisplay: noteDisplay,
        note: this.offset + lowC,
        color: color,
        altColor: noteToAltColor[noteDisplay],
        bounds: getBoundsForCoord(xy),
        draw: function() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.bounds.xy.x, this.bounds.xy.y, this.bounds.wh.x, this.bounds.wh.y);
        },
        drawAlt: function() {
            ctx.fillStyle = this.altColor;
            ctx.fillRect(this.bounds.xy.x, this.bounds.xy.y, this.bounds.wh.x, this.bounds.wh.y);
        },
        down: function() {
            console.log("down: " + this.offset);
            this.drawAlt();
            MIDI.noteOn(0, getPitch(this.offset), 127, 0); //for instant start
        },
        up: function() {
            console.log("up: " + this.offset);
            this.draw();
            MIDI.noteOff(0, getPitch(this.offset), 0);
        }
    };
}

var grid;
function getGrid() {
    var grid = [];
    for (var i = 0; i < dim.x; i++) {
        for (var j = 0; j < dim.y; j++) {
            grid.push(getBoxFromCoord(_xy(i, j)));
        }
    }
    return grid;
}

function xyFromEvent(ev) {
    return _xy(
        ev.pageX,// - globals.canvas.offsetLeft,
        ev.pageY //- globals.canvas.offsetTop
    );
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
        boxes.push(grid[toOffset(touch)]);
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

function doDownBoxes(boxes) {
    console.log('before: ' + JSON.stringify(globals.downBoxes));
    console.log(grid);
    var index = indexBoxes(boxes);
    for (var b = 0 ; b < boxes.length; b++) {
        var box = boxes[b];
        if (!(box.offset in globals.downBoxes)) {
            if (state.playListen == playListen.LISTENING) {
                box.down();
            }
            for (var k in state.downHandlers) {
                state.downHandlers[k](box.offset);
            }
            globals.downBoxes[box.offset] = 1;
        }
    }
    for (var offset in globals.downBoxes) {
        // list containment, O(n)
        if (!(offset in index)) {
            grid[offset].up();
            delete globals.downBoxes[offset];
        }
    }
    console.log('after: ' + JSON.stringify(globals.downBoxes));
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
    state.running = false;
    state.playListen = playListen.LISTENING;
    globals.consecutiveEmpties = 0;
}

function noteOn(v) {
    MIDI.noteOn(0, v, 127, 0); 
}

function noteOff(v) {
    MIDI.noteOff(0, v, 0); 
}

function doPlayLessonResume(lesson, index, next) {
    if (index >= lesson.sequence.length) {
        next();
        return;
    }
    var pitch = lesson.sequence[index];
    noteOn(pitch);
    timeout(GROUP, function() {
        noteOff(pitch);
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
    doPlayLessonResume(
        lesson,
        0,
        function() {
            doRecordResponse(lesson, next);
        }
    );
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

function run() {
    if (!state.running) {
        return;
    }
    $.get("/lessons", {}, startBatch);
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
