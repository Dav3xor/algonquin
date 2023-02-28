import sqlite3
import pprint
import inspect
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
            if ('xss-filter' in self.attr_attrs) and (value != None):
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
        setattr(c, i+'_', f"{c.table_name}.{i}")
        if 'fkey' in attrs:
            #print(properties[i])
            from_table = DBTable.tables[attrs['fkey'][2]]
            to_table   = c
            setattr(from_table, 
                    attrs['fkey'][3],
                    ChildAttr(to_table, i))

class DBChild:
    def __init__(self, table, key, related_column):
        #print("-----------")
        self.table          = table
        #self.columns        = [key for key in table.attrs.keys() if 'relative' not in table.attrs[key]]
        self.key            = key
        self.current        = 0
        self.related_column = related_column
        self.child_rows     = []

    def add(self, **args):
        new_row = self.table(**args)
        setattr(new_row, self.related_column, self.key)
        new_row.save()

    def __iter__(self):
        #print(f"iter: {self.table.table_name}")
        self.child_rows = self.table.raw_select(f"{self.related_column} = :key",
                                                {'key': self.key})
                                                
        return self

    def __next__(self):
        #print(f"next: {self.table.table_name}")
        if self.current < len(self.child_rows):
            self.current += 1
            return self.child_rows[self.current-1]
        else:
            raise StopIteration

def left_join(left, right, left_, right_):
    return f"{left.table_name} left join {right.table_name} on {left.table_name}.{left_} = {right.table_name}.{right_}"

def db_join(left, right, left_, right_):
    return f"{left.table_name} join {right.table_name} on {left.table_name}.{left_} = {right.table_name}.{right_}"

def build_where(clause):
    #print(clause)
    #print(type(clause))
    if type(clause) in (str,int,float,bool):
        #print("1")
        return f" {clause} "
    elif type(clause) == tuple and inspect.isclass(clause[0]) and issubclass(clause[0], DBTable):
        #print(f"2 - {clause}")
        return f" {'.'.join((clause[0].table_name,)+clause[1:])} "
    else:
        #print("3")
        output = ''
        for i in clause:
            output += build_where(i)
        return f"({output})"

class DBTable:
    insert_stmt          = "INSERT INTO %s(%s) VALUES(%s)"
    select_stmt          = "SELECT %s FROM %s WHERE %s"
    select_distinct_stmt = "SELECT distinct %s FROM %s WHERE %s"
    select_first_stmt    = "SELECT %s FROM %s ORDER BY id LIMIT 1"
    select_last_stmt     = "SELECT %s FROM %s ORDER BY id DESC LIMIT 1"
    update_stmt          = "UPDATE %s SET %s WHERE %s"
    create_stmt          = "CREATE TABLE IF NOT EXISTS %s (%s)"
    create_fts_stmt      = "CREATE VIRTUAL TABLE IF NOT EXISTS %s USING fts5(id, %s)"
    create_trigger_stmt  = """CREATE TRIGGER IF NOT EXISTS %s AFTER %s ON %s
                                BEGIN
                                    %s
                                END;"""
    delete_stmt          = "DELETE FROM %s WHERE %s LIMIT %s"
    delete_stmt2         = "DELETE FROM %s WHERE %s"
    foreign_key          = "FOREIGN KEY(%s) REFERENCES %s(%s)"
    db                   = None
    cursor               = None
    tables               = {}

    def __init__(self, **kwargs):
        self.data = {}
        for name, value in kwargs.items():
            if value or type(value) in (bool,int, float, str):
                setattr(self, name, value)
            if value == None:
                setattr(self, name, value)
   
    def add_table(table_class):
        DBTable.tables[table_class.__name__] = table_class

    @classmethod
    def set_db(cls, database, debug=False): 
        print(f"connecting to database: {database}")
        DBTable.db = sqlite3.connect(database, check_same_thread=False)
        DBTable.cursor = DBTable.db.cursor()
        if debug:
            DBTable.db.set_trace_callback(print)

    @classmethod
    def commit(cls):
        DBTable.db.commit()
    
    @classmethod 
    def expand_select(cls, tables, where, 
                      order_by = None,
                      result_columns = None,
                      extra_columns = None,
                      distinct = False):

        if type(where) == tuple:
            where = build_where(where)

        if not tables:
            tables = cls.table_name

        if result_columns:
            columns = [cls.table_name + '.' + column for column in result_columns]
        else:
            columns = [cls.table_name + '.' + key for key in cls.attrs.keys() 
                                                  if 'relative' not in cls.attrs[key]]
        if extra_columns:
            columns = columns+[cls.attrs[column]['relative']+'.'+column for column in extra_columns]
        
        if distinct:
            stmt = DBTable.select_distinct_stmt % (",".join(columns), 
                                                   tables, 
                                                   where)
        else:
            stmt = DBTable.select_stmt % (",".join(columns), 
                                          tables, 
                                          where)
        
        if order_by:
            stmt += " order by " + order_by
        
        if distinct:
            stmt = DBTable.select_distinct_stmt % (",".join(columns), 
                                                   tables, 
                                                   where)
        else:
            stmt = DBTable.select_stmt % (",".join(columns), 
                                          tables, 
                                          where)
        
        if order_by:
            stmt += " order by " + order_by
        return stmt


    @classmethod
    def subquery_in(cls, output, where):
        query = cls.expand_select(cls.table_name, where, result_columns=[output])
        return f'{cls.table_name}.{output} in ({query})'

    @classmethod
    def raw_select(cls, where, args, 
                   tables = None,
                   order_by = None, 
                   extra_columns = None, 
                   distinct = False):
        
        if type(tables) == list:
            tables = ','.join([i if type(i) == str else i.table_name for i in tables])
        #print("raw select2:")
        stmt = cls.expand_select(tables, where, 
                                 order_by=order_by, 
                                 extra_columns=extra_columns,
                                 distinct=distinct)
        #print(stmt)
        DBTable.cursor.execute(stmt, args)
        rows = DBTable.cursor.fetchall()
        #print(rows)
        return [ cls(**dict(zip(cls.attrs.keys(), values))) for values in rows ]

    def select(table, columns, where_clause):
        stmt = DBTable.select_stmt % (",".join(columns), table, where_clause)
        #print("select:")
        #print(stmt)
        DBTable.cursor.execute(stmt)
        return DBTable.cursor.fetchall()

    @classmethod
    def where_and(cls, terms):
        output = " and ".join([f"{key} = :{key}" for key in terms.keys()])
        return output

    def select_one(table, columns, **kwargs):
        stmt = DBTable.select_stmt % (",".join(columns), table, DBTable.where_and(kwargs))
        
        DBTable.cursor.execute(stmt, kwargs)
        return DBTable.cursor.fetchone()

    @classmethod
    def is_public(cls, field):
        if 'private' not in cls.attrs[field]:
            return True
        else:
            return not cls.attrs[field]['private']

    def public_fields(self):
        fields = { key:value for (key, value) in self.data.items() if self.is_public(key) }
        return fields

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
    def last(cls):
        columns = [i for i in cls.attrs if 'relative' not in cls.attrs[i]]
        stmt    = DBTable.select_last_stmt % (','.join(columns), cls.table_name)
        values  = DBTable.cursor.execute(stmt).fetchone()
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
        stmt = DBTable.delete_stmt % (cls.table_name, DBTable.where_and(kwargs), str(limit))
        #print(stmt+"-->"+str(where_values))
        DBTable.cursor.execute(stmt, kwargs)

    def insert(self):
        if self.id:
            raise Exception("Attempted insert into database with object that already has id")
        columns = []
        values = []
        for col, val in self.data.items():
            columns.append(col)
            values.append(val)
        columns = ','.join(columns)
        #print(columns)
        #print(values)
        stmt = DBTable.insert_stmt % (self.table_name,
                                       columns,
                                       ("?,"*len(values))[:-1])
        #print(stmt)
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
        query = f"select count(*) from {cls.table_name}"
        if len(kwargs) > 0:
            query += f" where {DBTable.where_and(kwargs)};"
        #print("----- " + query + " ---- " + str(where_values))
        DBTable.cursor.execute(query, kwargs)
        return DBTable.cursor.fetchone()[0]

    def save(self):
        if self.id:
            self.update()
        else:
            self.insert()

class DBSearch(DBTable):
    attrs = { 'ftable':         {'type': ''},
              'row':            {'type': ''},
              'row_id':         {'type': ''},
              'contents':       {'type': ''} }
    table_name = 'db_table_search'

    @classmethod
    def search(cls, query):
        return cls.raw_select(f"{cls.table_name} match :query",
                              {'query': query},
                              distinct = "rank limit 1000")
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)

set_properties(DBSearch, DBSearch.attrs)

def build_tables(tables):
    # build the full text search table

    search_rows = 'ftable, row, row_id, contents'

    def insert_term(search_table, table, row):
        return DBTable.insert_stmt % (search_table, 
                                      search_rows, 
                                      f"'{table}', '{row}', new.id, new.{row}") + ";\n"
    def delete_term(search_table, table, row):
        return DBTable.delete_stmt2 % (search_table, 
                                      f"ftable='{table}' and row='{row}' and row_id=old.id and contents=old.{row}") + ";\n"
    
    db_stmt = DBTable.create_fts_stmt % ('db_table_search', search_rows)
    DBTable.cursor.execute(db_stmt)

    for table in tables:
        attrs      = table.attrs
        searchable = []
        table_name = table.table_name
        clauses    = ','.join([i + ' ' + attrs[i]['type'] for i in attrs if 'relative' not in attrs[i]])

        for i in attrs:
            if 'fkey' in attrs[i]:
                clauses += "," + DBTable.foreign_key % (i,attrs[i]['fkey'][0],attrs[i]['fkey'][1])
            if 'searchable' in attrs[i] and attrs[i]['searchable'] == True:
                searchable.append(i)

        db_stmt = DBTable.create_stmt % ( table_name, clauses )
        DBTable.cursor.execute(db_stmt)

        # handle fields that go into the full text search table...
        if searchable:
            # on insert...
            terms = ""
            for term in searchable:
                terms += insert_term('db_table_search', 
                                     table_name, 
                                     term)
            trigger = DBTable.create_trigger_stmt % (f"{table_name}_search_insert",
                                                     "INSERT",
                                                     table_name,
                                                     terms)
            # print(trigger)
            DBTable.cursor.execute(trigger)

            # on delete...
            terms = ""
            for term in searchable:
                terms += delete_term('db_table_search',
                                     table_name,
                                     term)
                        
            trigger = DBTable.create_trigger_stmt % (f"{table_name}_search_delete",
                                                     "DELETE",
                                                     table_name,
                                                     terms)
            #print(trigger)
            DBTable.cursor.execute(trigger)

            # on update...
            terms = ""
            for term in searchable:
                terms += delete_term('db_table_search',
                                     table_name,
                                     term)
                terms += insert_term('db_table_search',
                                     table_name,
                                     term)
                        
            trigger = DBTable.create_trigger_stmt % (f"{table_name}_search_update",
                                                     "UPDATE",
                                                     table_name,
                                                     terms)
            # print(trigger)
            DBTable.cursor.execute(trigger)


