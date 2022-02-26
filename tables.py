from db import DBTable, set_properties, build_tables
from passlib.hash import pbkdf2_sha256

class User(DBTable):
    attrs = {'id':       {'type': 'INTEGER PRIMARY KEY'},
            'email':    {'type': 'TEXT NOT NULL UNIQUE', 'xss-filter': True}, 
            'handle':   {'type': 'TEXT NOT NULL', 'xss-filter': True},
             'portrait': {'type': 'TEXT'},
             'about':    {'type': 'TEXT', 'xss-filter': True},
             'pwhash':   {'type': 'TEXT', 'private': True}}
    table_name = 'users'

    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)

    def set_password(self, password):
        self.pwhash = pbkdf2_sha256.hash(password)
        
    def verify_password(self, password):
        if self.pwhash:
            return pbkdf2_sha256.verify(password, self.pwhash)
        else:
            return None

    def join_public(self):
        public_rooms = Room.raw_select("rooms", "public = 1")
        for room in public_rooms:
            membership = Membership(user = self.id,
                                    room = room.id)
            membership.save()
        
set_properties(User, User.attrs)

class Room(DBTable):
    attrs = {'id':     {'type': 'INTEGER PRIMARY KEY'},
             'owner':  {'type': 'INTEGER NOT NULL',
                       'fkey': ['user', 'id', 'User','rooms']},
             'public': {'type': 'BOOLEAN'},
             'name':   {'type': 'TEXT NOT NULL', 'xss-filter': True},
             'last_seen': {'relative': 'memberships'}}
    table_name = 'rooms'

    @classmethod
    def chat_name(cls, user_ids):
        user_ids.sort()
        user_ids = set(user_ids)
        return '$%^&-' + '-'.join(str(i) for i in user_ids)
    
    @classmethod
    def get_or_set_chat(cls, owner, user_ids):
        name = cls.chat_name(user_ids)
        chat = Room.get_where(name=name)
        if not chat:
            chat = Room(owner  = owner, 
                        public = False, 
                        name   = name)
            chat.save()
            for user in user_ids:
                Membership.join(user, chat.id)
            chat.commit()
        return chat

    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)

set_properties(Room, Room.attrs)

class Card(DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'room':      {'type': 'INTEGER NOT NULL',
                           'fkey': ['room', 'id', 'Room', 'cards']},
             'parent':    {'type': 'INTEGER NOT NULL',
                           'fkey': ['card', 'id', 'Card', 'children']},
             'contents':  {'type': 'TEXT'}}
    table_name = 'cards'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(Card, Card.attrs)

class File(DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'owner':     {'type': 'INTEGER NOT NULL',
                           'fkey': ['user', 'id', 'User', 'files']},
             'room':      {'type': 'INTEGER',
                           'fkey': ['room', 'id', 'Room', 'files']},
             'name':      {'type': 'TEXT', 'xss-filter': True},
             'localname': {'type': 'TEXT'},
             'public':    {'type': 'BOOLEAN'},
             'type':      {'type': 'TEXT'},
             'size':      {'type': 'INTEGER'},
             'hash':      {'type': 'INTEGER', 'private':True},
             'uploaded':  {'type': "TIMESTAMP DATETIME DEFAULT (datetime('now', 'localtime'))"}}
    table_name = 'files'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(File, File.attrs)

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
             'written':   {'type': "TIMESTAMP DATETIME DEFAULT (datetime('now', 'localtime'))"},
             'message':   {'type': 'TEXT', 'xss-filter': True}}
    table_name = 'messages'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(Message, Message.attrs)

class Membership(DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'user':      {'type': 'INTEGER NOT NULL',
                           'fkey': ['user', 'id', 'User', 'memberships']},
             'last_seen': {'type': 'INTEGER DEFAULT 0'},
             'room':      {'type': 'INTEGER NOT NULL',
                           'fkey': ['room', 'id', 'Room', 'members']}}
    table_name = 'memberships'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
    @classmethod
    def join(cls, user, room):
        membership = Membership(user=user, room=room)
        membership.save()

set_properties(Membership, Membership.attrs)


build_tables([User, Session, Message, Room, File, Membership])
