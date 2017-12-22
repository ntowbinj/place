import MySQLdb
from MySQLdb.cursors import DictCursor
import json

conn = MySQLdb.connect(db='hearit', user='root', passwd='rewt', host='localhost')
cursor = conn.cursor(DictCursor)


def get_insert(table, fields):
    cols = ', '.join(fields)
    params = ', '.join(['%s' for i in range(len(fields))])
    return 'INSERT INTO ' + table + ' (' + cols + ') VALUES (' + params + ')'

def get_select_clause(table_classes):
    col_list = []
    for table, clas in table_classes.items():
        for field in clas._fields:
            col_list.append(table + '.' + field + ' AS ' + get_alias(table, field))
    cols = ', '.join(col_list)
    return 'SELECT ' + cols

def get_alias(table, field):
    return table + '__' + field

def do_select(table_classes, from_where, args):
    sql = get_select_clause(table_classes) + from_where
    cursor.execute(sql, args)
    rows = cursor.fetchall()
    ret = []
    for row in rows:
        row_dict = {}
        for table, clas in table_classes.items():
            asdict = {field: row[get_alias(table, field)] for field in clas._fields}
            row_dict[clas.__name__.lower()] = clas(**asdict)
        ret.append(row_dict)
    return ret



def do_insert(table, obj):
    sql = get_insert(table, obj._fields)
    values = tuple(obj)
    values = tuple([serialize(v) for v in values])
    cursor.execute(sql, values)
    conn.commit()
    return cursor.lastrowid

def serialize(v):
    if type(v) is list:
        return json.dumps(v)
    return v
