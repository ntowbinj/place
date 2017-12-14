from collections import namedtuple

lesson_fields = [
    'user_id',
    'create_time',
    'note_duration_millis',
    'rest_millis',
    'wait_time_millies',
    'tolerance',
    'w',
    'h',
    'base',
    'spanning_interval',
    'max_interval',
    'sequence'
]

all_lesson_fields = ['lesson_id'] + lesson_fields
LessonCreate = namedtuple('LessonCreate', lesson_fields)
Lesson = namedtuple('Lesson', all_lesson_fields)

user_fields = [
    'create_time'
]
all_user_fields = ['user_id'] + user_fields

User = namedtuple('User', all_user_fields)
UserCreate = namedtuple('UserCreate', user_fields)


