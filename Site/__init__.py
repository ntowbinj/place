import config
import alg
import json
from flask import Flask, render_template, jsonify, request, g, make_response, session
from collections import namedtuple
from usercookie import get_or_create_user, hashids

app = Flask(__name__)
app.secret_key = config.secret_key

@app.before_request
def ensure_user():
    get_or_create_user()

@app.route("/")
def hello():
    return render_template('template.html')

lessonList = [
    dict(lesson_key='a', millis=300, noteDuration=200, notes = [58, 60], base=58, time=10000, tolerance=1),
    dict(lesson_key='b', millis=300, noteDuration=200, notes = [65, 56], base=56, time=10000, tolerance=1),
    dict(lesson_key='b', millis=300, noteDuration=200, notes = [45, 47], base=45, time=10000, tolerance=1)
]

def make_safe(lesson):
    return dict(
        lessonKey=hashids.encrypt(lesson.lesson_id),
        restMillis=lesson.rest_millis,
        noteDurationMillis=lesson.note_duration_millis,
        sequence=lesson.sequence,
        base=lesson.base,
        w=lesson.w,
        h=lesson.h,
        waitTimeMillis=lesson.wait_time_millis,
        tolerance=lesson.tolerance
    )


@app.route("/lessons")
def lessons():
    user_id = g.user_id
    lessons = [make_safe(l) for l in alg.get_lessons_for_user(user_id)]
    ret = dict(lessonList=lessons, level=1)
    print(ret)
    print jsonify(ret)
    return jsonify(ret)


@app.route("/recording", methods=['POST'])
def recording():
    print hack_json()
    return 'OK';

def hack_json():
    return json.loads(request.form['json'])
