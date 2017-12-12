var globals = {
    downBoxes: {}
};
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
        ret[n] = '#' + tinycolor(noteToColor[n]).desaturate(30).lighten(5).brighten(20).toHex();
    };
    return ret;
}

var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var lowC = 0;
var dim = {
    x: 3,
    y: 3
}

function boxW() {
    var ret = Math.floor((globals.canvas.width / dim.x));
    //console.log('boxW: ' + ret);
    return ret;
}

function boxH() {
    var ret = Math.floor((globals.canvas.height / dim.y));
    //console.log('boxH: ' + ret);
    return ret;
}

function _xy(x, y) {
    return {'x': x, 'y': y};
}

function resolve(xy) {
    return _xy(
        Math.floor(xy.x / boxW()),
        Math.floor(xy.y / boxH())
    );
}

function getNoteFromOffset(o) {
    var idx = (lowC + o) % notes.length;
    return notes[idx];
}
var crossColumnInterval = 5;

function coordToNoteOffset(xy) {
    return xy.x*crossColumnInterval + xy.y;
}

function getBoundsForCoord(xy) {
    return {
        'xy': _xy(xy.x * boxW(), xy.y * boxH()),
        'wh': _xy(boxW(), boxH())
    }
}

function toId(xy) {
    return (xy.x * dim.y) + xy.y;
}

function getBoxFromCoord(xy) {
    var offset = coordToNoteOffset(xy);
    var note = getNoteFromOffset(offset);
    var color = noteToColor[note];
    return {
        'xy': xy,
        'id': toId(xy),
        'offset': offset,
        'note': note,
        'color': color,
        'altColor': noteToAltColor[note],
        'bounds': getBoundsForCoord(xy),
        'draw': function() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.bounds.xy.x, this.bounds.xy.y, this.bounds.wh.x, this.bounds.wh.y);
        },
        'drawAlt': function() {
            ctx.fillStyle = this.altColor;
            ctx.fillRect(this.bounds.xy.x, this.bounds.xy.y, this.bounds.wh.x, this.bounds.wh.y);
        },
        'down': function() {
            console.log(this.id + ' down');
            this.drawAlt();
        },
        'up': function() {
            console.log(this.id + ' up');
            this.draw();
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
    canvas = document.getElementById('canvas');
    canvas.addEventListener('touchstart', function(ev) {
        console.log('touch');
    });
    canvas.onclick = function(ev) {
        var list = [resolve(xyFromEvent(ev))];
        touches(list);
    }
    globals.canvas = canvas;
    noteToAltColor = buildNoteToAltColor();
    resize();
}

function touches(list) {
    var boxes = [];
    for (var t = 0; t < list.length; t++) {
        touch = list[t];
        boxes.push(grid[toId(touch)]);
    }
    doDownBoxes(boxes);
}

function indexBoxes(boxList) {
    var index = {};
    for (var b = 0; b < boxList.length; b++) {
        var box = boxList[b];
        index[box.id] = box;
    }
    return index;
}

function doDownBoxes(boxes) {
    var index = indexBoxes(boxes);
    for (var b = 0 ; b < boxes.length; b++) {
        var box = boxes[b];
        if (!(box.id in globals.downBoxes)) {
            box.down();
            globals.downBoxes[box.id] = 1;
        }
    }
    for (var boxId in globals.downBoxes) {
        // list containment, O(n)
        if (!(boxId in index)) {
            grid[boxId].up();
            delete globals.downBoxes[boxId];
        }
    }
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


window.addEventListener('load', init);
window.addEventListener('resize', resize);
