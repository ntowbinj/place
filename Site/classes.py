from collections import namedtuple

lesson_fields = [
    'user_id',
    'create_time',
    'note_duration_millis',
    'wait_time_millis',
    'tolerance',
    'span',
    'base',
    'spanning_interval',
    'max_interval',
    'hint_prefix',
    'length',
    'sequence'
]

all_lesson_fields = ['lesson_id'] + lesson_fields
LessonCreate = namedtuple('LessonCreate', lesson_fields)
Lesson = namedtuple('Lesson', all_lesson_fields)

user_fields = [
    'create_time',
    'addr'
]
all_user_fields = ['user_id'] + user_fields

User = namedtuple('User', all_user_fields)
UserCreate = namedtuple('UserCreate', user_fields)

lesson_factory_fields = [
    'max_interval',
    'note_duration_millis',
    'hint_prefix',
    'length',
    'span'
]

LessonFactory = namedtuple(
    'LessonFactory',
    lesson_factory_fields
)

recording_fields = [
    'lesson_id',
    'passed',
    'notes',
    'note_times'
]

Recording = namedtuple('Recording', recording_fields)

lesson_recording_fields = [
    'lesson',
    'recording'
]

LessonRecording = namedtuple(
    'LessonRecording',
    lesson_recording_fields
)
