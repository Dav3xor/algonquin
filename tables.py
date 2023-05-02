import db
from db import build_tables, left_join, db_join 
from passlib.hash import pbkdf2_sha256
from urllib.parse import urlencode
import hashlib
import os
from formats import formats

class Person(db.DBTable):
    attrs = {'id':       {'type': 'INTEGER PRIMARY KEY'},
             'email':    {'type': 'TEXT NOT NULL UNIQUE', 
                          'xss-filter': True, 
                          'searchable': True}, 
             'handle':   {'type': 'TEXT NOT NULL', 
                          'xss-filter': True,
                          'searchable': True},
             'portrait': {'type': 'TEXT'},
             'bot':      {'type': 'BOOLEAN DEFAULT FALSE'},
             'about':    {'type': 'TEXT', 
                          'xss-filter': True,
                          'searchable': True},
             'pwhash':   {'type': 'TEXT', 'private': True}}
    table_name = 'persons'

    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)

    def set_password(self, password):
        self.pwhash = pbkdf2_sha256.hash(password)
        
    def verify_password(self, password):
        if self.pwhash:
            return pbkdf2_sha256.verify(password, self.pwhash)
        else:
            return None

    def join_public(self):
        public_rooms = Room.raw_select("public = :public", {'public': 1})
        for room in public_rooms:
            membership = Membership(person = self.id,
                                    room = room.id)
            membership.save()

    def related_persons(self):
        tables = db_join(Person, Membership, 'id', 'person')
        where  = Membership.subquery_in('room', 'memberships.person = :self_id')
        persons = self.raw_select(where, 
                                {'self_id': self.id}, 
                                tables=tables)
        return [ person.public_fields() for person in persons ]

    #( ((Room,'id'), '=', (Membership, 'room')), 'and'
    def membership_list(self):
        #"rooms.id = memberships.room and memberships.person = :self_id",
        rooms = Room.raw_select((Room.id_, '=', Membership.room_, 'and',
                                 Membership.person_, '=', ':self_id'),
                                {'self_id': self.id},
                                order_by      = "rooms.id",
                                tables        = [Room, Membership],
                                extra_columns = ["last_seen"])

        return [ room.public_fields() for room in rooms ]
        
    # TODO: add better filtering
    def message_list(self, rooms):
        messages = []
        for room in rooms: 
            messages += Message.raw_select(((Message,'room'), '=', ':room'),
                                           {'room': room},
                                           order_by = "messages.id desc limit 20",
                                           distinct = True)
        return [ message.public_fields() for message in messages ]

    # TODO: modify this after adding folder support?
    def file_list(self, folder=None):
        files = File.raw_select( (((File.room_, 'in', ('select', Membership.room_, 'from', (Membership,), 
                                                   'where', Membership.person_, '=', ':self_id')) ,'or',
                                   (File.room_, 'is', 'NULL') ,'or',
                                   (File.owner_ ,'=', ':self_id' ) ,'or', 
                                   (File.public_ ,'=', 1)) ,'and',
                                  File.folder_, 'is', ':folder' ),
                                {'self_id': self.id, 
                                 'folder':  folder},
                                order_by = "files.id desc limit 100",
                                distinct = True)
        #print(f"files = {files}")
        return [ file.public_fields() for file in files ]
    
    def folder_list(self, folder=1):
        folders = Folder.raw_select((((Folder.owner_, 'is', 'NULL'), 'or',
                                      (Folder.owner_, '=', ':self_id' ), 'or',
                                      (Folder.public_, '=', 1), 'or',
                                      (Room.id_, '=', Membership.room_, 'and', 
                                       Membership.person_, '=', ':self_id')), 'and',
                                     (Folder.parent_, 'is', ':folder')),
                                    {'self_id': self.id, 
                                     'folder':  folder},
                                    order_by = "folders.id desc limit 100",
                                    distinct = True,
                                    tables = [left_join(Folder, Room, 'id', 'root_folder'),
                                              Membership],
                                    extra_columns = ['last_seen_file'])
        #print(f"folders = {folders}")
        return [ folder.public_fields() for folder in folders ]

    def card_list(self):
        cards = Card.raw_select(((Card.room_, 'in', ('select', Membership.room_, 'from', (Membership,),
                                                    'where', Membership.person_, '=', ':self_id')), 'or', 
                                    (Card.owner_, 'is', 'NULL'), 'or',
                                    (Card.owner_, '=', ':self_id'), 'or',
                                    (Card.room_, 'is', 'NULL')),
                                 {'self_id': self.id},
                                 order_by = "cards.id desc limit 100")
        return [ card.public_fields() for card in cards ]
    
    def send_file_to(self, recipient_id):
        return Room.get_or_set_chat(self.id, [self.id, recipient_id]).root_folder


class Folder(db.DBTable):
    attrs = {'id':             {'type': 'INTEGER PRIMARY KEY'},
             'name':           {'type': 'TEXT',
                                'searchable': True,
                                'xss-filter': True},
             'room':           {'type': 'INTEGER',
                                'fkey': ['room', 'id', 'Room', 'folders']},
             'owner':          {'type': 'INTEGER NOT NULL',
                                'fkey': ['person', 'id', 'Person', 'folders']},
             'public':         {'type': 'BOOLEAN'},
             'parent':         {'type': 'INTEGER',
                                'fkey': ['folder', 'id', 'Folder', 'child_folders']},
             'last_seen_file': {'relative': 'memberships'}}
    table_name = 'folders'
    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)


             


class Room(db.DBTable):
    attrs = {'id':          {'type': 'INTEGER PRIMARY KEY'},
             'owner':       {'type': 'INTEGER NOT NULL',
                             'fkey': ['person', 'id', 'Person','rooms']},
             'root_folder': {'type': 'INTEGER NOT NULL',
                             'fkey': ['folder', 'id', 'Folder','rooms']},
             'topic':       {'type': 'TEXT', 'xss-filter': True,
                             'searchable': True},
             'about':       {'type': 'TEXT', 'xss-filter': True,
                             'searchable': True},
             'public':      {'type': 'BOOLEAN'},
             'name':        {'type': 'TEXT NOT NULL', 'xss-filter': True,
                             'searchable': True},
             'last_seen':   {'relative': 'memberships'}}
    table_name = 'rooms'

    @classmethod
    def chat_name(cls, person_ids):
        person_ids.sort()
        person_ids = set(person_ids)
        return '$%^&-' + '-'.join(str(i) for i in person_ids)
    
    @classmethod
    def get_or_set_chat(cls, owner, person_ids):
        name = cls.chat_name(person_ids)
        chat = Room.get_where(name=name)
        person_ids = set(person_ids)
        if not chat:
            folder = Folder(name = name,
                            public = False,
                            owner  = owner,
                            parent = None)
            folder.save()

            chat = Room(owner       = owner, 
                        public      = False, 
                        root_folder = folder.id,
                        name        = name)
            chat.save()
            for person in person_ids:
                Membership.join(person, chat.id)
            chat.commit()
        return chat

    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)


class Card(db.DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'owner':     {'type': 'INTEGER NOT NULL',
                           'fkey': ['owner', 'id', 'Person', 'cards']},
             'room':      {'type': 'INTEGER',
                           'fkey': ['room', 'id', 'Room', 'cards']},
             'title':     {'type': 'TEXT', 'xss-filter': True,
                           'searchable': True},
             'locked':    {'type': 'BOOLEAN'},
             'public':    {'type': 'BOOLEAN'},
             'contents':  {'type': 'TEXT', 'xss-filter': True,
                           'searchable': True}}
    table_name = 'cards'
    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)

class Card_Edit(db.DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'editor':    {'type': 'INTEGER NOT NULL',
                           'fkey': ['editor', 'id', 'Person', 'card_edits']},
             'diff':      {'type': 'TEXT',
                           'searchable': True}}
    table_name = 'card_edits'
    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)


class File(db.DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'owner':     {'type': 'INTEGER NOT NULL',
                           'fkey': ['person', 'id', 'Person', 'files']},
             'room':      {'type': 'INTEGER',
                           'fkey': ['room', 'id', 'Room', 'files']},
             'folder':    {'type': 'INTEGER',
                           'fkey': ['folder', 'id', 'Folder', 'files']},
             'name':      {'type': 'TEXT', 
                           'searchable': True,
                           'xss-filter': True},
             'localname': {'type': 'TEXT'},
             'comment':   {'type': 'TEXT', 'searchable': True,
                           'xss-filter': True},
             'public':    {'type': 'BOOLEAN'},
             'deleted':   {'type': 'BOOLEAN DEFAULT 0'},
             'type':      {'type': 'TEXT',
                           'searchable': True},
             'size':      {'type': 'INTEGER'},
             'hash':      {'type': 'INTEGER', 'private':True},
             'uploaded':  {'type': "TIMESTAMP DATETIME DEFAULT (datetime('now', 'localtime'))"}}
    table_name = 'files'
    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)

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


class Session(db.DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'person':      {'type': 'INTEGER NOT NULL',
                           'fkey': ['person','id', 'Person', 'sessions']},
             'sessionid': {'type': 'INTEGER'}}
    table_name = 'sessions'
    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)

    @classmethod
    def make_sessionid(cls, person):
        return str(person.id) + '-' + str(int.from_bytes(os.urandom(32),'big'))

    @classmethod
    def make_token(cls, person):
        return '%s-token-%s' % (str(person.id), str(int.from_bytes(os.urandom(8),'big')))
        #return str(person.id) + "-token-" + str(int.from_bytes(os.urandom(8),'big'))

    @classmethod
    def make_token_url(cls, token, site):
        return 'https://%s/?%s' % (site, urlencode({'token': token}))
        #return 'https://' + config['site_url'] + '/?' + urlencode({'token': token})
        

class Message(db.DBTable):
    attrs = {'id':        {'type': 'INTEGER PRIMARY KEY'},
             'person': {'type': 'INTEGER NOT NULL',
                           'fkey': ['person', 'id', 'Person', 'messages']},
             'room':      {'type': 'INTEGER NOT NULL',
                           'fkey': ['room', 'id', 'Room', 'messages']},
             'written':   {'type': "TIMESTAMP DATETIME DEFAULT (datetime('now', 'localtime'))"},
             'left':      { 'type': 'BOOL'},    # print message on the left if true
             'message':   {'type': 'TEXT', 
                           'searchable': True,
                           'xss-filter': True}}
    table_name = 'messages'
    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)

class Membership(db.DBTable):
    attrs = {'id':             {'type': 'INTEGER PRIMARY KEY'},
             'person':         {'type': 'INTEGER NOT NULL',
                                'fkey': ['person', 'id', 'Person', 'memberships']},
             'last_seen':      {'type': 'INTEGER DEFAULT 0'},
             'last_seen_file': {'type': 'INTEGER DEFAULT 0'},
             'room':           {'type': 'INTEGER NOT NULL',
                                'fkey': ['room', 'id', 'Room', 'members']}}
    table_name = 'memberships'
    def __init__(self, **kwargs):
        db.DBTable.__init__(self, **kwargs)
    @classmethod
    def join(cls, person, room):
        if Membership.count(person=person, room=room) == 0:
            membership = Membership(person=person, room=room, last_seen=0)
            membership.save()
            membership.commit()



