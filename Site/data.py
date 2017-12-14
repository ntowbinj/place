import MySQLdb
from MySQLdb.cursors import DictCursor

conn = MySQLdb.connect(db='hearit', user='root', passwd='rewt', host='localhost')
cursor = conn.cursor(DictCursor)

def get_insert(table, fields):
    cols = ', '.join(fields)
    params = ', '.join(['%s' for i in range(len(fields))])
    return 'INSERT INTO ' + table + ' (' + cols + ') VALUES (' + params + ')'

def do_insert(table, obj):
    sql = get_insert(table, obj._fields)
    values = tuple(obj)
    cursor.execute(sql, values)
    conn.commit()
    return conn.insert_id()
