from flask import request, session, g
from hashids import Hashids
import config
import data
from classes import UserCreate
import time

hashids = Hashids(min_length=16, alphabet='abcdefghijklmnop', salt=config.hashids_key)

def get_or_create_user():
    maybe_present = request.cookies.get('u')
    if maybe_present:
        g.user_id = hashids.decrypt(maybe_present)[0]
        return;
    if request.headers.getlist('X-Forwarded-For'):
        addr = request.headers.getlist('X-Forwarded-For')[0]
    else:
        addr = request.remote_addr
    if not maybe_present:
        user_create = UserCreate(create_time=int(time.time()), addr=addr)
        g.user_id = data.do_insert('users', user_create)
















