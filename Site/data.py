import config
import MySQLdb
from MySQLdb.cursors import DictCursor
import json


def get_cursor():
    global conn
    conn = MySQLdb.connect(db='hearit', user='root', passwd=config.mysql_pass, host='localhost')
    return conn.cursor(DictCursor)

def close():
    global conn
    conn.close()



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
    cursor = get_cursor();
    cursor.execute(sql, args)
    rows = cursor.fetchall()
    ret = []
    for row in rows:
        row_dict = {}
        for table, clas in table_classes.items():
            asdict = {field: row[get_alias(table, field)] for field in clas._fields}
            row_dict[clas.__name__.lower()] = clas(**asdict)
        ret.append(row_dict)
    close();
    return ret



def do_insert(table, obj):
    sql = get_insert(table, obj._fields)
    values = tuple(obj)
    values = tuple([serialize(v) for v in values])
    cursor = get_cursor();
    cursor.execute(sql, values)
    conn.commit()
    ret = cursor.lastrowid
    close()
    return ret

def commit():
    conn.commit()

def serialize(v):
    if type(v) is list:
        return json.dumps(v)
    return v
