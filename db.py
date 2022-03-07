import sqlite3
import pprint
from pxfilter import XssHtml

pprint = pprint.PrettyPrinter()

def set_properties(c, properties):
    class Attr(object):
        def __init__(self, attr, attr_attrs):
            self.attr = attr
            self.attr_attrs = attr_attrs
        def __get__(self, obj, objtype):
            if self.attr in obj.data:
                return obj.data[self.attr]
            else:
                return None
        def __set__(self, obj, value):
            if 'xss-filter' in self.attr_attrs:
                parser = XssHtml()
                parser.feed(value)
                parser.close()
                value = parser.getHtml()
            obj.data[self.attr] = value

    class ChildAttr(object):
        def __init__(self, table, related_column):
            self.table = table
            self.key   = None
            self.related_column = related_column
        def __get__(self, obj, objtype):
            return DBChild(self.table, obj.id, self.related_column)

    DBTable.add_table(c)

    # add an attribute for every table column
    for i, attrs in properties.items(): 
        setattr(c, i, Attr(i, attrs))
        if 'fkey' in attrs:
            #print(properties[i])
            from_table = DBTable.tables[attrs['fkey'][2]]
            to_table   = c
            setattr(from_table, 
                    attrs['fkey'][3],
                    ChildAttr(to_table, i))

class DBChild:
    def __init__(self, table, key, related_column):
        print("-----------")
        self.table          = table
        self.columns        = [key for key in table.attrs.keys() if 'relative' not in table.attrs[key]]
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
    db          = None
    cursor      = None
    tables      = {}

    def __init__(self, **kwargs):
        self.data = {}
        for name, value in kwargs.items():
            if value or type(value) in (bool,int, float, str):
                setattr(self, name, value)
   
    def add_table(table_class):
        DBTable.tables[table_class.__name__] = table_class

    @classmethod
    def set_db(cls, database): 
        print(f"connecting to database: {database}")
        DBTable.db = sqlite3.connect(database, check_same_thread=False)
        DBTable.cursor = DBTable.db.cursor()

    @classmethod
    def commit(cls):
        DBTable.db.commit()
    
    @classmethod
    def raw_select(cls, tables, where, order_by = None, extra_columns = None):
        columns = [cls.table_name + '.' + key for key in cls.attrs.keys() 
                                              if 'relative' not in cls.attrs[key]]
        print(columns)
        print(extra_columns)
        if extra_columns:
            columns = columns+[cls.attrs[column]['relative']+'.'+column for column in extra_columns]
        stmt = DBTable.select_stmt % (",".join(columns), 
                                      tables, 
                                      where)
        if order_by:
            stmt += " order by " + order_by
        print(stmt)
        DBTable.cursor.execute(stmt)
        rows = DBTable.cursor.fetchall()
        return [ cls(**dict(zip(cls.attrs.keys(), values))) for values in rows ]

    def select(table, columns, where_clause):
        stmt = DBTable.select_stmt % (",".join(columns), table, where_clause)
        #print(stmt)
        DBTable.cursor.execute(stmt)
        return DBTable.cursor.fetchall()

    def select_one(table, columns, **kwargs):
        where_columns = ""
        where_values = []
        for key in kwargs:
            if len(where_columns) > 0:
                where_columns += "and "
            where_columns += key + "=? "
            where_values.append(kwargs[key])

        stmt = DBTable.select_stmt % (",".join(columns), table, where_columns)
        
        DBTable.cursor.execute(stmt, where_values)
        return DBTable.cursor.fetchone()

    @classmethod
    def is_public(cls, field):
        if 'private' not in cls.attrs[field]:
            return True
        else:
            return not cls.attrs[field]['private']

    def public_fields(self):
        return { key:value for (key, value) in self.data.items() if self.is_public(key) }

    @classmethod
    def get(cls, id):
        columns = [i for i in cls.attrs]
        values  = DBTable.select_one(cls.table_name, columns, id=id)
        if values:
            return cls(**dict(zip(columns, values)))
        else:
            return None

    @classmethod
    def get_where(cls, **kwargs):
        columns = [i for i in cls.attrs if 'relative' not in cls.attrs[i]]
        values  = DBTable.select_one(cls.table_name, columns, **kwargs)
        if values:
            return cls(**dict(zip(columns, values)))
        else:
            return None

    @classmethod
    def get_public_where(cls, **kwargs):
        columns = [i for i in cls.attrs if ('private' not in cls.attrs[i] or 
                                           cls.attrs[i]['private'] == False) and 
                                           'relative' not in cls.attrs[i] ]
        values = DBTable.select_one(cls.table_name, columns, **kwargs)
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
        #print(stmt+"-->"+str(where_values))
        DBTable.cursor.execute(stmt, where_values)

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
        DBTable.cursor.execute(stmt, values)
        self.id = DBTable.cursor.lastrowid

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
        #print(stmt)
        #print(values)
        DBTable.cursor.execute(stmt, values)

    @classmethod
    def count(cls, **kwargs):
        where_columns = ""
        where_values = []

        for key in kwargs:
            if len(where_columns) > 0:
                where_columns += "and "
            where_columns += key + "=? "
            where_values.append(kwargs[key])
        query = f"select count(*) from {cls.table_name}"
        if len(where_columns) > 0:
            query += " where " + where_columns + ";"
        print("----- " + query + " ---- " + str(where_values))
        DBTable.cursor.execute(query, where_values)
        return DBTable.cursor.fetchone()[0]

    def save(self):
        if self.id:
            self.update()
        else:
            self.insert()

def build_tables(tables):
    for table in tables:
        attrs = table.attrs
        table_name = table.table_name
        clauses = ','.join([i + ' ' + attrs[i]['type'] for i in attrs if 'relative' not in attrs[i]])
        for i in attrs:
            if 'fkey' in attrs[i]:
                clauses += "," + DBTable.foreign_key % (i,attrs[i]['fkey'][0],attrs[i]['fkey'][1])
        db_stmt = DBTable.create_stmt % ( table_name, clauses )
        DBTable.cursor.execute(db_stmt)

