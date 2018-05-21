import config
import alg
import json
import logging
import datetime
import time
from data import do_insert, get_cursor, close, commit
from events import event_value_ids
from classes import Recording
from flask import Flask, render_template, jsonify, request, g, make_response, session
from collections import namedtuple
from usercookie import get_or_create_user, hashids

app = Flask(__name__)
app.secret_key = config.secret_key
if app.debug:
    app.logger.addHandler(logging.StreamHandler())
else:
    gunicorn_error_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers.extend(gunicorn_error_logger.handlers)
app.logger.setLevel(logging.INFO)



@app.before_request
def ensure_user():
    get_or_create_user()

@app.after_request
def set_user_cookie(resp):
    expire_date = datetime.datetime.now() + datetime.timedelta(days=200)
    user_id = g.user_id
    resp.set_cookie('u', hashids.encrypt(user_id), expires=expire_date)
    return resp

@app.route("/")
def hello():
    return render_template('template.html', is_mobile=is_mobile())

def make_safe(lesson):
    return dict(
        lessonKey=hashids.encrypt(lesson.lesson_id),
        restMillis=lesson.note_duration_millis/3,
        noteDurationMillis=lesson.note_duration_millis,
        sequence=lesson.sequence,
        hintPrefix=lesson.hint_prefix,
        base=lesson.base,
        span=lesson.span,
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

@app.route("/exc123")
def exc123():
    raise 'dogs'


@app.route("/lessons")
def lessons():
    user_id = g.user_id
    lesson_result = alg.get_lessons_for_user(user_id)
    lessons = [make_safe(l) for l in lesson_result['lessons']]
    ret = dict(lessonList=lessons, level=lesson_result['level'])
    return jsonify(ret)


@app.route("/recording", methods=['POST'])
def recording():
    recordings = hack_json()
    for rec in recordings:
        do_insert('recordings', rec)
    return 'OK';

@app.route("/event/<ev>", methods=['POST'])
def post_event(ev):
    event(g.user_id, ev)
    return 'OK'

@app.route("/progress")
def progress():
    return render_template('progress.html')

@app.route("/get-progress")
def get_progress():
    return jsonify(alg.get_smoothed_levels(g.user_id))


def event(user_id, event_name):
    sql = "INSERT INTO events (user_id, timestamp, event_value_id) VALUES (%s, %s, %s)"
    cursor = get_cursor();
    cursor.execute(sql, (user_id, time.time(), event_value_ids[event_name]))
    commit()
    close()

def hack_json():
    return from_safe_buffer(json.loads(request.form['json']))

def is_mobile():
    if not request.user_agent or not request.user_agent.platform:
        return True
    lower = request.user_agent.platform.lower()
    return any((s in lower for s in ['iphone', 'android']))
