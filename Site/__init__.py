from flask import Flask, render_template, jsonify
from collections import namedtuple

app = Flask(__name__)


@app.route("/")
def hello():
    return render_template('template.html')

lessonList = [
    dict(lesson_key='a', millis=300, noteDuration=200, notes = [58, 60], base=58, time=10000, tolerance=1),
    dict(lesson_key='b', millis=300, noteDuration=200, notes = [65, 56], base=56, time=10000, tolerance=1),
    dict(lesson_key='b', millis=300, noteDuration=200, notes = [45, 47], base=45, time=10000, tolerance=1)
]


@app.route("/lessons")
def lessons():
    ret = dict(lessonList=lessonList, level=1)
    print(ret)
    print jsonify(ret)
    return jsonify(ret)




