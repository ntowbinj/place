import MySQLdb
from MySQLdb.cursors import DictCursor
import json

conn = MySQLdb.connect(db='hearit', user='root', passwd='rewt', host='localhost')
cursor = conn.cursor(DictCursor)


def get_insert(table, fields):
    cols = ', '.join(fields)
    params = ', '.join(['%s' for i in range(len(fields))])
    return 'INSERT INTO ' + table + ' (' + cols + ') VALUES (' + params + ')'

def do_insert(table, obj):
    sql = get_insert(table, obj._fields)
    print sql
    values = tuple(obj)
    values = tuple([serialize(v) for v in values])
    print values
    cursor.execute(sql, values)
    conn.commit()
    return conn.insert_id()

def serialize(v):
    if type(v) is list:
        return json.dumps(v)
    return v
