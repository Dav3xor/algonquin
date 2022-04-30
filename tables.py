from db import DBTable, set_properties, build_tables
from passlib.hash import pbkdf2_sha256
import hashlib
from formats import formats

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
    def membership_list(self):
        rooms = Room.raw_select("rooms, memberships", 
                                "rooms.id = memberships.room and memberships.user = %s" % self.id,
                                "rooms.id",
                                ["last_seen"])

        return { room.id:room.public_fields() for room in rooms }
        
    def message_list(self):
        messages = Message.raw_select("messages, memberships", 
                                      "messages.room = memberships.room and memberships.user = %s" % self.id,
                                      "messages.id desc limit 100")
        return { message.id:message.public_fields() for message in messages }

    def file_list(self):
        files = File.raw_select("files, memberships", 
                                      """(files.room = memberships.room and memberships.user = %s) or
                                         (files.room = NULL) or (files.owner = %s)""" % (self.id, self.id),
                                      "files.id desc limit 100")
        return { file.id:file.public_fields() for file in files }

    def card_list(self):
        cards = Card.raw_select("cards, memberships", 
                                      """(cards.room = memberships.room and memberships.user = %s) or 
                                         (cards.owner = NULL) or (cards.owner = %s)""" % (self.id,self.id),
                                      "cards.id desc limit 100")
        return { card.id:card.public_fields() for card in cards }

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
        user_ids = set(user_ids)
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
             'owner':     {'type': 'INTEGER NOT NULL',
                           'fkey': ['owner', 'id', 'User', 'cards']},
             'room':      {'type': 'INTEGER',
                           'fkey': ['room', 'id', 'Room', 'cards']},
             'title':     {'type': 'TEXT'},
             'locked':    {'type': 'BOOLEAN'},
             'contents':  {'type': 'TEXT'}}
    table_name = 'cards'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(Card, Card.attrs)

class Card_Edit(DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'editor':    {'type': 'INTEGER NOT NULL',
                           'fkey': ['editor', 'id', 'User', 'card_edits']},
             'diff':      {'type': 'TEXT'}}
    table_name = 'card_edits'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(Card_Edit, Card_Edit.attrs)

class Folder(DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'name':      {'type': 'TEXT'},
             'parent':    {'type': 'INTEGER',
                           'fkey': ['folder', 'id', 'Folder', 'child_folders']}}
    table_name = 'folders'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)
set_properties(Folder, Folder.attrs)
             



class File(DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'owner':     {'type': 'INTEGER NOT NULL',
                           'fkey': ['user', 'id', 'User', 'files']},
             'room':      {'type': 'INTEGER',
                           'fkey': ['room', 'id', 'Room', 'files']},
             'folder':    {'type': 'INTEGER',
                           'fkey': ['folder', 'id', 'Folder', 'files']},
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

    @classmethod
    def hash_file(cls, file):
        BUF_SIZE = 65536
        md5 = hashlib.md5()
        while True:
            data = file.read(BUF_SIZE)
            if not data:
                break
            md5.update(data)

        length = file.tell()

        # seek back to the beginning
        file.seek(0);

        return md5.hexdigest(), length

    @classmethod
    def file_type(cls, filename):
        type      = "unknown"
        extension = ""
        if '.' in filename:
            extension = filename.split('.')[-1].lower()
            if extension in formats:
                type = formats[extension]
        return type, extension
     
    @classmethod
    def hash_exists(cls, hash, size):
        original_file = File.get_where(hash=hash, size=size)
        return original_file

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
        if Membership.count(user=user, room=room) == 0:
            membership = Membership(user=user, room=room, last_seen=0)
            membership.save()
            membership.commit()

set_properties(Membership, Membership.attrs)


