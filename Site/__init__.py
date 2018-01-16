import config
import alg
import json
from data import do_insert
from classes import Recording
from flask import Flask, render_template, jsonify, request, g, make_response, session
from collections import namedtuple
from usercookie import get_or_create_user, hashids

app = Flask(__name__)
app.secret_key = config.secret_key

@app.before_request
def ensure_user():
    print request.remote_addr
    get_or_create_user()

@app.route("/")
def hello():
    return render_template('template.html', is_mobile=is_mobile())

def make_safe(lesson):
    return dict(
        lessonKey=hashids.encrypt(lesson.lesson_id),
        restMillis=lesson.note_duration_millis/4,
        noteDurationMillis=lesson.note_duration_millis,
        sequence=lesson.sequence,
        hintPrefix=lesson.hint_prefix,
        base=lesson.base,
        w=lesson.w,
        h=lesson.h,
        waitTimeMillis=lesson.wait_time_millis,
        tolerance=lesson.tolerance
    )

def from_safe_buffer(recording_buffer):
    res = []
    for k, v in recording_buffer.items():
        res.append(from_safe(k, v))
    return res

def from_safe(lesson_key, safe_recording):
    return Recording(
        lesson_id=hashids.decrypt(lesson_key)[0],
        passed=safe_recording['passed'],
        notes=safe_recording['notes'],
        note_times=safe_recording['noteTimes']
    )


@app.route("/lessons")
def lessons():
    user_id = g.user_id
    lessons = [make_safe(l) for l in alg.get_lessons_for_user(user_id)]
    ret = dict(lessonList=lessons, level=1)
    return jsonify(ret)


@app.route("/recording", methods=['POST'])
def recording():
    recordings = hack_json()
    for rec in recordings:
        do_insert('recordings', rec)
    return 'OK';

def hack_json():
    return from_safe_buffer(json.loads(request.form['json']))

def is_mobile():
    if not request.user_agent or not request.user_agent.platform:
        return True
    lower = request.user_agent.platform.lower()
    return any((s in lower for s in ['iphone', 'android']))
