import time
import json
import pdb
import operator as op
import math
import random
import data
from collections import defaultdict
from classes import LessonFactory, Lesson, LessonCreate, Recording, LessonRecording
from itertools import groupby

FOURTH = 5

def demote_random(lesson_factory):
    print 'demoting'
    demotions = []
    if lesson_factory.length > 2:
        demotions.append(demote_note_duration)
    if lesson_factory.max_interval > 2:
        demotions.append(demote_interval)
    if lesson_factory.length > 2:
        demotions.append(demote_length)
    if lesson_factory.w * FOURTH > lesson_factory.max_interval + 2:
        demotions.append(demote_width)
    if lesson_factory.hint_prefix < lesson_factory.length - 1:
        demotions.append(demote_hint_prefix)
    if not demotions:
        return lesson_factory
    rand = random.randint(0, len(demotions) - 1)
    return demotions[rand](lesson_factory)

def promote_random(lesson_factory):
    print 'promoting'
    promotions = [
        promote_interval,
        promote_length

    ]
    if lesson_factory.length > 3:
        promotions.append(promote_note_duration)
    if lesson_factory.w < 3:
        return promote_width(lesson_factory)
    if lesson_factory.w < 4:
        promotions.append(promote_width)
    if lesson_factory.hint_prefix > 1:
        promotions.append(promote_hint_prefix)
    rand = random.randint(0, len(promotions) - 1)
    return promotions[rand](lesson_factory)


def demote_note_duration(lesson_factory):
    return scale_note_duration_millis(lesson_factory, 1.10)

def promote_note_duration(lesson_factory):
    return scale_note_duration_millis(lesson_factory, 0.90)

def demote_interval(lesson_factory):
    return change_interval(lesson_factory, -1)

def promote_interval(lesson_factory):
    promoted = change_interval(lesson_factory, 1)
    if promoted.max_interval > lesson_factory.w * FOURTH:
        return promote_width(promoted)
    else:
        return promoted

def demote_length(lesson_factory):
    demoted = change_length(lesson_factory, -1)
    if demoted.hint_prefix == demoted.length:
        return promote_hint_prefix(demoted)
    else:
        return demoted

def promote_length(lesson_factory):
    return demote_hint_prefix(change_length(lesson_factory, 1))

def demote_width(lesson_factory):
    return change_width(lesson_factory, -1)

def promote_width(lesson_factory):
    return change_width(lesson_factory, 1)

def demote_hint_prefix(lesson_factory):
    return change_hint_prefix(lesson_factory, 1)

def promote_hint_prefix(lesson_factory):
    return change_hint_prefix(lesson_factory, -1)

def scale_note_duration_millis(lesson_factory, factor):
    as_dict = lesson_factory._asdict()
    as_dict['note_duration_millis'] = int(factor * lesson_factory.note_duration_millis)
    return LessonFactory(
        **as_dict
    )

def change_interval(lesson_factory, change):
    as_dict = lesson_factory._asdict()
    as_dict['max_interval'] = change + lesson_factory.max_interval
    return LessonFactory(
        **as_dict
    )

def change_length(lesson_factory, change):
    as_dict = lesson_factory._asdict()
    as_dict['length'] = change + lesson_factory.length
    return LessonFactory(
        **as_dict
    )

def change_width(lesson_factory, change):
    as_dict = lesson_factory._asdict()
    as_dict['w'] = change + lesson_factory.w
    return LessonFactory(
        **as_dict
    )

def change_hint_prefix(lesson_factory, change):
    as_dict = lesson_factory._asdict()
    as_dict['hint_prefix'] = change + lesson_factory.hint_prefix
    return LessonFactory(
        **as_dict
    )

def get_stats(les_recs):
    count = len(les_recs)
    successes = sum([1 for les_rec in les_recs if les_rec.recording.passed])
    time_sum = sum([les_rec.lesson.note_duration_millis for les_rec in les_recs])
    length_sum = sum([les_rec.lesson.length for les_rec in les_recs])
    success_rate = successes / (1.0 * count)
    avg_time = int(time_sum / count)
    avg_length = int(length_sum / count)
    return dict(
        avg_time=avg_time,
        success_rate=success_rate,
        count=count,
        avg_length=avg_length
    )

def get_base_lesson_factory():
    return LessonFactory(
        max_interval=4,
        note_duration_millis=400,
        length=2,
        hint_prefix=1,
        w=1,
        h=5
    )


def get_lessons_for_user(user_id):
    lesrecs = [LessonRecording(**lesrec) for lesrec in data.do_select(
        dict(lessons=Lesson, recordings=Recording),
        ' FROM lessons JOIN recordings USING (lesson_id) WHERE user_id = %s ORDER BY lessons.lesson_id DESC limit %s',
        (user_id, 20)
    )]
    factory = get_lesson_factory(lesrecs)
    print 'now: %s' % str(factory)
    return get_lesson_set(user_id, factory, 5)

def get_factory_from_lesson(lesson):
    ret = LessonFactory(
            max_interval=lesson.max_interval,
            note_duration_millis=lesson.note_duration_millis,
            length=lesson.length,
            hint_prefix=lesson.hint_prefix,
            w=lesson.w,
            h=lesson.h
    )
    #print '%s from %s' % (str(ret), str(lesson))
    return ret


def get_lesson_factory(recent_lesson_recordings):
    print 'recent: %s' % str(recent_lesson_recordings)
    if not recent_lesson_recordings:
        return get_base_lesson_factory()
    by_factory = defaultdict(list)
    latest = get_factory_from_lesson(recent_lesson_recordings[0].lesson)
    print 'was: %s' % str(latest)
    for les_rec in recent_lesson_recordings:
        by_factory[get_factory_from_lesson(les_rec.lesson)].append(les_rec)
    stats = get_stats(by_factory[latest])
    print stats
    if stats['count'] <= 3:
        return latest
    #pdb.set_trace()
    if stats['count'] > 3 and stats['success_rate'] == 0:
        return demote_random(latest)
    if stats['count'] > 3 and stats['success_rate'] == 1:
        return promote_random(latest)
    if stats['count'] > 10 and stats['success_rate'] > 0.9:
        return promote_random(latest)
    if stats['count'] > 10 and stats['success_rate'] < 0.7:
        return demote_random(latest)
    if stats['count'] <= 20:
        print 'not changing'
        return latest
    else:
        print 'shifting'
        return demote_random(promote_random(latest))

def get_lesson_set(user_id, factory, n):
    return [get_lesson(user_id, factory) for x in range(n)]

def get_lesson(user_id, factory):
    base = random.randint(40, 70)
    seq = get_lesson_sequence(base, factory)
    lesson_create = LessonCreate(
        user_id=user_id,
        create_time=int(time.time()),
        note_duration_millis=factory.note_duration_millis,
        wait_time_millis=10000,
        tolerance=int(max(1, ((factory.length - factory.hint_prefix)) * 0.2 + (factory.hint_prefix * 0.3 * 0.2))),
        w=factory.w,
        h=factory.h,
        base=base,
        spanning_interval=max(seq) - min(seq),
        max_interval = factory.max_interval,
        length=factory.length,
        hint_prefix=factory.hint_prefix,
        sequence=seq
    )
    lesson_id = data.do_insert('lessons', lesson_create)
    return Lesson(lesson_id, **lesson_create._asdict())


def get_lesson_sequence(base, factory):
    capacity = factory.w * factory.h;
    seq = [0]
    while len(seq) < factory.length:
        intv = random.randint(
            -1 * factory.max_interval,
            factory.max_interval
        )
        if not intv:
            continue
        nxt = seq[-1] + intv
        candidate = seq + [nxt]
        gap = max(candidate) - min(candidate)
        if gap < capacity:
            seq = candidate
    bottom = min(seq)
    relative = [n - bottom for n in seq]
    slack = capacity - (max(seq) - min(seq))
    seq_base_offset = random.randint(0, slack - 1) # randint is inclusive range :(
    return [n + base + seq_base_offset for n in relative]


    
