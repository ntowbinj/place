var globals = {};
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
    x: 4,
    y: 6
}

function _xy(x, y) {
    return {'x': x, 'y': y};
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
        'xy': _xy(xy.x * (globals.w / dim.x), xy.y * (globals.h / dim.y)),
        'wh': _xy((globals.w / dim.x), (globals.h / dim.y))
    }
}

function getBoxFromCoord(xy) {
    var offset = coordToNoteOffset(xy);
    var note = getNoteFromOffset(offset);
    var color = noteToColor[note];
    return {
        'xy': xy,
        'offset': offset,
        'note': note,
        'color': color,
        'altColor': noteToAltColor[note],
        'bounds': getBoundsForCoord(xy),
        'draw': function() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.bounds.xy.x, this.bounds.xy.y, this.bounds.wh.x, this.bounds.wh.y);
        }
    };
}

function getGrid() {
    var grid = [];
    for (var i = 0; i < dim.x; i++) {
        for (var j = 0; j < dim.y; j++) {
            grid.push(getBoxFromCoord(_xy(i, j)));
        }
    }
    return grid;
}


function init() {
    var canvas = document.getElementById('canvas');
    canvas.addEventListener('touchstart', function(ev) {
        console.log('touch');
    });
    canvas.addEventListener('click', function(ev) {
        console.log('click');
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eee';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    globals.canvas = canvas;
    globals.w = canvas.width;
    globals.h = canvas.height;
    noteToAltColor = buildNoteToAltColor();
}

function go() {
    init();
    var grid = getGrid();
    for (var n = 0; n < grid.length; n++) {
        grid[n].draw();
    }
}


window.addEventListener('load', go);
