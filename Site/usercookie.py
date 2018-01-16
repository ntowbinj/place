from flask import request, session, g
from hashids import Hashids
import pdb
import config
import data
from classes import UserCreate
import time

hashids = Hashids(min_length=16, alphabet='abcdefghijklmnop', salt=config.hashids_key)

def get_or_create_user():
    #pdb.set_trace()
    maybe_present = session.get('u')
    if request.headers.getlist("X-Real-IP"):
        addr = request.headers.getlist("X-Real-IP")[0]
    else:
        addr = request.remote_addr
    if not maybe_present:
        user_create = UserCreate(create_time=int(time.time()), addr=addr)
        u = data.do_insert('users', user_create)
        session['u'] = hashids.encrypt(u)
    u = session['u']
    g.user_id = hashids.decrypt(u)[0]








