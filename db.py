import sqlite3
from passlib.hash import pbkdf2_sha256

db = sqlite3.connect('algonquin.db', check_same_thread=False)
cursor = db.cursor()

def set_properties(c, properties):
    class Attr(object):
        def __init__(self, attr):
            self.attr = attr
        def __get__(self, obj, objtype):
            if self.attr in obj.data:
                return obj.data[self.attr]
            else:
                return None
        def __set__(self, obj, value):
            obj.data[self.attr] = value

    class ChildAttr(object):
        def __init__(self, table, related_column):
            self.table = table
            self.key   = None
            self.related_column = related_column
        def __get__(self, obj, objtype):
            return DBChild(self.table, obj.id, self.related_column)

    DBTable.add_table(c)
    for i in properties: 
        setattr(c, i, Attr(i))
        if 'fkey' in properties[i]:
            print(properties[i])
            from_table = DBTable.tables[properties[i]['fkey'][2]]
            to_table   = c
            setattr(from_table, 
                    properties[i]['fkey'][3],
                    ChildAttr(to_table, i))
class DBChild:
    def __init__(self, table, key, related_column):
        self.table          = table
        self.columns        = list(table.attrs.keys())
        self.key            = key
        self.current        = 0
        self.related_column = related_column
        self.child_rows     = []

    def add(self, **args):
        new_row = self.table(**args)
        setattr(new_row, self.related_column, self.key)
        new_row.save()

    def __iter__(self):
        self.child_rows = self.table.select(self.table.table_name, 
                                            self.columns, 
                                            self.related_column+'='+str(self.key))
        return self

    def __next__(self):
        if self.current < len(self.child_rows):
            self.current += 1
            values = self.child_rows[self.current-1]
            return self.table(**dict(zip(self.columns, values)))
        else:
            raise StopIteration

class DBTable:
    insert_stmt = "INSERT INTO %s(%s) VALUES(%s)"
    select_stmt = "SELECT %s FROM %s WHERE %s"
    update_stmt = "UPDATE %s SET %s WHERE %s"
    create_stmt = "CREATE TABLE IF NOT EXISTS %s (%s)"
    delete_stmt = "DELETE FROM %s WHERE %s LIMIT %s"
    foreign_key = "FOREIGN KEY(%s) REFERENCES %s(%s)"
    tables      = {}

    def __init__(self, **kwargs):
        self.data = kwargs
   
    def add_table(table_class):
        DBTable.tables[table_class.__name__] = table_class

    @classmethod
    def commit(cls):
        db.commit()
    
    @classmethod
    def raw_select(cls, tables, where, order_by):
        columns  = cls.attrs.keys()
        columns2 = [cls.table_name + '.' + key for key in columns]
        stmt = DBTable.select_stmt % (",".join(columns2), 
                                      tables, 
                                      where)
        if order_by:
            stmt += " order by " + order_by
        print(stmt)
        cursor.execute(stmt)
        rows = cursor.fetchall()
        return [ cls(**dict(zip(columns, values))) for values in rows ]

    def select(table, columns, where_clause):
        stmt = DBTable.select_stmt % (",".join(columns), table, where_clause)
        print(stmt)
        cursor.execute(stmt)
        return cursor.fetchall()

    def select_one(table, columns, **kwargs):
        where_columns = ""
        where_values = []
        for key in kwargs:
            where_columns += key + "=? "
            where_values.append(kwargs[key])

        stmt = DBTable.select_stmt % (",".join(columns), table, where_columns)
        print(stmt)
        cursor.execute(stmt, where_values)
        return cursor.fetchone()

    def is_public(self, field):
        if 'private' not in self.attrs[field]:
            return True
        else:
            return not self.attrs[field]['private']

    def public_fields(self):
        return { key:value for (key, value) in self.data.items() if self.is_public(key) }

    @classmethod
    def get(cls, id):
        columns = [i for i in cls.attrs]
        values  = DBTable.select_one(cls.table_name, columns, id=id)
        return cls(**dict(zip(columns, values)))

    @classmethod
    def get_where(cls, **kwargs):
        columns = [i for i in cls.attrs]
        values  = DBTable.select_one(cls.table_name, columns, **kwargs)
        if values:
            return cls(**dict(zip(columns, values)))
        else:
            return None
    @classmethod
    def delete_where(cls, limit=1, **kwargs):
        where_columns = ""
        where_values = []
        for key in kwargs:
            where_columns += key + "=? "
            where_values.append(kwargs[key])
        stmt = DBTable.delete_stmt % (cls.table_name, where_columns, str(limit))
        print(stmt+"-->"+str(where_values))
        cursor.execute(stmt, where_values)

    def insert(self):
        if self.id:
            raise Exception("Attempted insert into database with object that already has id")
        columns = []
        values = []
        for col, val in self.data.items():
            columns.append(col)
            values.append(val)
        columns = ','.join(columns)
        stmt = DBTable.insert_stmt % (self.table_name,
                                       columns,
                                       ("?,"*len(values))[:-1])
        print(stmt)
        cursor.execute(stmt, values)
        self.id = cursor.lastrowid

    def update(self):
        if not self.id:
            raise Exception("Attempted update into database with object that doesn't have id")
        columns = []
        values  = []
        for col,val in self.data.items():
            if col != 'id':
                columns.append(col+' = ?')
                values.append(val)
        columns = ','.join(columns)
        values.append(self.id)
        stmt = DBTable.update_stmt % (self.table_name,
                                      columns,
                                      'id = ?')
        print(stmt)
        cursor.execute(stmt, values)

    def save(self):
        if self.id:
            self.update()
        else:
            self.insert()

class User(DBTable):
    attrs = {'id':       {'type': 'INTEGER PRIMARY KEY'},
             'email':    {'type': 'TEXT NOT NULL UNIQUE'}, 
             'handle':   {'type': 'TEXT NOT NULL'},
             'portrait': {'type': 'TEXT'},
             'pwhash':   {'type': 'TEXT', 'private': True}}
    table_name = 'users'

    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)

    def set_password(self, password):
        self.pwhash = pbkdf2_sha256.hash(password)
        
    def verify_password(self, password):
        return pbkdf2_sha256.verify(password, self.pwhash)

set_properties(User, User.attrs)

class Room(DBTable):
    attrs = {'id':     {'type': 'INTEGER PRIMARY KEY'},
             'owner':  {'type': 'INTEGER NOT NULL',
                       'fkey': ['user', 'id', 'User','rooms']},
             'public': {'type': 'BOOLEAN'},
             'name':   {'type': 'TEXT NOT NULL'}}
    table_name = 'rooms'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)

set_properties(Room, Room.attrs)

class Session(DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'user':      {'type': 'INTEGER NOT NULL',
                           'fkey': ['user','id', 'User', 'sessions']},
             'sessionid': {'type': 'INTEGER'}}
    table_name = 'sessions'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(Session, Session.attrs)

class Message(DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'user': {'type': 'INTEGER NOT NULL',
                           'fkey': ['user', 'id', 'User', 'messages']},
             'room':      {'type': 'INTEGER NOT NULL',
                           'fkey': ['room', 'id', 'Room', 'messages']},
             'message':   {'type': 'TEXT'}}
    table_name = 'messages'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(Message, Message.attrs)

class Membership(DBTable):
    attrs = {'id':   {'type': 'INTEGER PRIMARY KEY'},
             'user': {'type': 'INTEGER NOT NULL',
                      'fkey': ['user', 'id', 'User', 'memberships']},
             'room': {'type': 'INTEGER NOT NULL',
                      'fkey': ['room', 'id', 'Room', 'members']}}
    table_name = 'memberships'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(Membership, Membership.attrs)


class File(DBTable):
    attrs = {'id':      {'type': 'INTEGER PRIMARY KEY'},
             'owner':   {'type': 'INTEGER NOT NULL',
                         'fkey': ['user', 'id', 'User', 'files']},
             'message': {'type': 'INTEGER',
                         'fkey': ['user', 'id', 'Message', 'files']},
             'name':    {'type': 'TEXT NOT NULL'}}
    table_name = 'files'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(File, File.attrs)

def build_tables():
    for table in [User, Session, Message, Room, File, Membership]:
        attrs = table.attrs
        table_name = table.table_name
        clauses = ','.join([i + ' ' + attrs[i]['type'] for i in attrs])
        for i in attrs:
            if 'fkey' in attrs[i]:
                clauses += "," + DBTable.foreign_key % (i,attrs[i]['fkey'][0],attrs[i]['fkey'][1])

        cursor.execute(DBTable.create_stmt % ( table_name, clauses ))

build_tables()
