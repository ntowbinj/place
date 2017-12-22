from flask import request, session, g
from hashids import Hashids
import config
import data
from classes import UserCreate
import time

hashids = Hashids(min_length=16, alphabet='abcdefghijklmnop', salt=config.hashids_key)

def get_or_create_user():
    maybe_present = session.get('u')
    if not maybe_present:
        user_create = UserCreate(create_time=int(time.time()))
        u = data.do_insert('users', user_create)
        session['u'] = hashids.encrypt(u)
    u = session['u']
    g.user_id = hashids.decrypt(u)








