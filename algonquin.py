import logging

from db import DBTable, DBSearch, build_tables, left_join
from tables import Person, Session, Message, File, Folder, Room, Membership, Card, Card_Edit
from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit, send, disconnect, join_room
from urllib.parse import urlencode
from werkzeug.utils import secure_filename
from config import config, __version__, __protocol__
from pathlib import Path

import flask_mail
import os
import eventlet
import json
import time
import pprint
import difflib


pprint = pprint.PrettyPrinter()

log_level = logging.INFO
if config['debug_logging']:
    log_level = logging.DEBUG

logging.basicConfig(format='%(asctime)s %(levelname)s %(filename)s: %(lineno)d | %(message)s',
                    datefmt='%m/%d/%Y %I:%M:%S %p',
                    level=log_level)
logging.info(f"Algonquin IBBS startup.  {config['version']} protocol: {config['protocol']}")

DBTable.set_db(config['database'], debug=config['debug_logging'])

build_tables([Person, Session, Message, Room, File, Folder, Membership, Card, Card_Edit])

logging.info("Starting -- Flask App")
app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'a very very sekrit sekrit key'
if config['enable_email']:
    app.config['MAIL_SERVER']=config['mail_server']
    app.config['MAIL_PORT'] = config['mail_port']
    app.config['MAIL_USERNAME'] = config['mail_username']
    app.config['MAIL_PASSWORD'] = config['mail_password']
    app.config['MAIL_USE_TLS'] = config['mail_use_tls']
    app.config['MAIL_USE_SSL'] = config['mail_use_ssl']


logging.info("Starting -- SocketIO App")
socketio = SocketIO(app)

if config['enable_email']:
    mail = flask_mail.Mail(app)

differ = difflib.Differ()

if __name__ == '__main__':
    logging.info('Started')
    socketio.run(app, host='0.0.0.0')
    logging.info('Finished')
pp = Flask(__name__)

class Scoreboard:
    def __init__(self):
        self.sid_to_person   = {}
        self.person_to_sid   = {}
    def add(self, sid, person):
        self.sid_to_person[sid] = person
        if person not in self.person_to_sid:
            self.person_to_sid[person] = set()
        self.person_to_sid[person].add(sid)
    def remove(self, sid):
        if sid in self.sid_to_person:
            person = self.sid_to_person[sid]
            if person in self.person_to_sid and sid in self.person_to_sid[person]:
                self.person_to_sid[person].discard(sid)
            del self.sid_to_person[sid]
    def get_person_from_sid(self,sid):
        if sid not in self.sid_to_person:
            return False
        else:
            return self.sid_to_person[sid]
    def get_sids_from_person(self,person):
        if person not in self.person_to_sid:
            return set()
        else:
            return self.person_to_sid[person]
    def online_persons(self):
        return set(self.sid_to_person.values())
    def person_online(self, id):
        if id not in self.person_to_sid:
            return False
        return True if len(self.person_to_sid[id]) > 0 else False

scoreboard=Scoreboard()


def valid_portrait(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config['portrait_types']


def not_logged_in(f):
    def wrapper(*args, **kwargs):
        if request.sid not in scoreboard.sid_to_person:
            return f(*args, **kwargs)
        else:
            logging.info(f'not_logged_in failed -- person id:{scoreboard.get_person_from_sid(request.sid)}')
            pass

def person_logged_in(f):
    def wrapper(*args, **kwargs):
        if request.sid in scoreboard.sid_to_person:
            return f(*args, **kwargs)
        else:
            logging.info(f'person_logged_in failed -- sid:{request.sid}')
            pass

# decorator for making sure the json argument for socketio handler functions
# contains certain arguments
def json_has_keys(*keys):
    def Inner(func):
        def wrapper(*args, **kwargs):
            success = True
            for key in keys:
                if key not in args[0]:
                    logging.info(f'missing json key: {key} from: {args}')
                    success = False
            if success:
                result = func(*args, **kwargs)
            else:
                result = False
            return result
        return wrapper
    return Inner

def admin_logged_in(f):
    def wrapper(*args, **kwargs):
        if request.sid in scoreboard.sid_to_person and scoreboard.sid_to_person == 1:
            # TODO: don't assume person id 1 is admin
            return f(*args, **kwargs)
        else:
            logging.info(f'admin_logged_in failed -- sid:{request.sid} user id: {scoreboard.get_person_from_sid(sid)}.')
            pass


@app.route('/')
def index():
    return render_template('index.html', config=config)



def make_tmpdir(session, folder, file_number):
    tmp_dir = f'{ session.person }-{ session.id }-{ folder }-{ file_number }'
    path = os.path.join(config['file_root'], 'files', 'tmp', tmp_dir)
    return path 

def handle_file_chunk(req, session, path):
    file        = req.files['file']
    file_number = req.form['file_number']
    chunk       = int(req.form['chunk'])
    room        = req.form['room']
   
    chunk = int(chunk)

    if chunk == 0:
        logging.info(f"Upload -- starting -- session: {str(session.id)[:20]} room: {str(room)[:20]}")

    if 'room' not in req.form or req.form['room'] in ('null', None, 0, '0'):
        room = 1
    else:
        room = int(req.form['room'])


    Path(path).mkdir(parents=True, exist_ok=True)
    file.save(os.path.join(path, str(chunk)))
    
    return chunk, room

def reconstitute_file(req, path, filename, chunk):

    logging.info(f"Upload -- finishing: {filename}")
   
    # do it this way to give the interpreter a chance to switch threads
    # TODO: break this out into some sort of task queue deal
    
    outfile = os.path.join(path, 'output')

    for i in range(0,int(chunk)+1):
        infile  = os.path.join(path, str(i))
        os.system(f'cat { infile } >> { outfile }')
        #os.remove(infile)

    with open(outfile, 'rb') as f:
        hash, size   = File.hash_file(f)
        type, extension = File.file_type(filename)

    logging.info("Upload -- hash = " + hash)
    logging.info("Upload -- size = " + str(size))

    # check for duplicates
    
    original_file = File.hash_exists(hash=hash, size=size)
    if original_file:
        logging.info("Upload -- duplicate file - " + 
                     original_file.name + " - " + 
                     filename + " - " + 
                     original_file.localname)
        newfilename = original_file.localname
    else:
        newfilename     = str(time.time()) + '.' + extension
        os.rename(outfile, os.path.join(config['file_root'], 'files', newfilename))
    return size, newfilename, hash, type

def file_upload_common(req):
    # TODO: Jesus, this is fucking spaghetti...
    fields = ['sessionid', 'room', 'folder', 'person', 'chunk', 'file_number']

    to_folder = None
    to_room   = None
    to_person = None

    for field in fields:
        if field not in req.form:
            logging.info(f'request missing field: {field}')
            return (None, None, None), None, json.dumps({'error': error})

    session     = Session.get_where(sessionid=req.form['sessionid'])


    if not session:
        logging.info(f"Upload -- attempted with bad sessionid: {req.form['sessionid']}")
        return (None,None,None), None, json.dumps({'error': 'bad sessionid'})
    
    if 'folder' not in req.form or req.form['folder'] in ('null', None, 0, '0'):
        folder = 1
    else:
        folder = int(req.form['folder'])
    
    
    path        = make_tmpdir(session, folder, int(req.form['file_number']))
    chunk, room = handle_file_chunk(req,session,path)

    if 'end' not in req.form:
        return (None,None,None), None, None
    else:
        if 'filename' not in req.form:
            filename = 'unknown'
        else:
            filename = req.form['filename']
        
        from_person                   = Person.get(session.person)
        size, newfilename, hash, type = reconstitute_file(req, path, filename, chunk)

        if req.form['person'] not in [None, 'null']:
            print(req.form['person'])
            to_person = Person.get(int(req.form['person']))
            to_folder, to_room = Room.get_or_set_room(from_person.id, 
                                                      [from_person.id, to_person.id])
            folder = to_folder.id
            room   = to_room.id

        db_file = File(owner     = from_person.id,
                       public    = True,
                       name      = filename,
                       folder    = folder if folder > 1 else 1,
                       hash      = hash,
                       size      = size,
                       type      = type,
                       localname = newfilename)
        if room:
            db_file.room = room
        logging.info(f"Upload -- finished: {filename}")
        return (db_file, to_folder, to_room), from_person, None



@app.route('/upload-file', methods=['POST'])
def upload_file():
    objs, person, errors = file_upload_common(request)
    db_file, db_folder, db_room  = objs

    if (not errors) and (not db_file):
        # got a chunk, but not the last one
        return json.dumps({'status': 'ok'})
    elif not errors:
        # got the last chunk, so add file to the database, etc.

        print(db_file.data)
        db_file.save()
        db_file.commit()

        #if db_file.room: 
        #    emit('stuff-list', 
        #         { 'files':[ db_file.public_fields() ] },
        #         room = 'room-'+str(db_file.room),
        #         namespace = None)

        result = {'status': 'ok', 
                  'files': [db_file.public_fields()]}

        if db_folder:
            result['folders'] = [db_folder.public_fields()]
        if db_room:
            # if this is a file being sent to a user as part of a new chat...
            result['rooms']   = [db_room.public_fields()]

        # notify people in the room about new file
        print(f' db_file.room: {db_file.room}')
        emit('new-file',
             result,
             room      = f'room-{db_file.room}',
             namespace = None)

        #return json.dumps({'status': 'ok', 'files': [db_file.public_fields()]})
        #TODO: only send this to the session that uploaded it (currently sends it to all logged
        #      in user sessions)
        for sid in scoreboard.get_sids_from_person(person.id):
            emit('your-new-file', 
                 {'file_id': db_file.id},
                 room      = sid,
                 namespace = None)
        return json.dumps({'status': 'ok'})
    else:
        return errors

@app.route('/upload-portrait', methods=['POST'])
def upload_portrait():
    objs, person, errors = file_upload_common(request)
    print(objs)
    db_file, db_folder, db_room  = objs

    if (not errors) and (not db_file):
        # got a chunk, but not the last one
        return json.dumps({'status': 'ok'})
    if errors:
        return errors
    else:
        if not valid_portrait(db_file.name):
            return  json.dumps({'error': 'filetype not supported for portrait'})

        db_file.folder = config['portrait_folder']
        db_file.save()

        person.portrait = db_file.localname
        person.save()
        person.commit()

        
        for sid in scoreboard.get_sids_from_person(person.id):
            emit('your-new-portrait', 
                 {'status': 'ok',
                  'person': person.public_fields(),
                  'files': [db_file.public_fields()]}, 
                 room = sid,
                 namespace = None)
        send_person(person, True, namespace=None)
        return json.dumps({'status': 'ok'})


# TODO: handle these with a real web server?
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/files/<path:path>')
def send_files(path):
    return send_from_directory('files', path)

@app.route('/portraits/<path:path>')
def send_portraits(path):
    return send_from_directory('files', path)

def online_persons():
    persons = scoreboard.online_persons()
    return {person:Person.get(person).public_fields() for person in persons }


def send_person(person, broadcast=False, **kwargs):

    if 'namespace' in kwargs:
        namespace = kwargs['namespace']
    send_stuff(broadcast, persons=[ person.public_fields() ] )


def do_login(person, session, send_session_id=False):
    response = {'authenticated': False}

    if (not person) or (not session):
        response['result'] = 'Bad Email/Password'
    else:
        scoreboard.add(request.sid, person.id)

        for membership in person.memberships:
            join_room('room-'+str(membership.room))

        response['personid']        = person.id
        response['persons']         = [ person.public_fields() ]
        response['authenticated'] = True
        response['result']        = 'Login Ok'
        response['__protocol__']    = __protocol__
        if send_session_id:
            response['sessionid'] = session.sessionid
        
        if '-token-' in session.sessionid:
            response['new-person'] = True
    
    emit('login-result', response, broadcast=False);
    
    if person:
        response = {}
        response['persons']       = person.related_persons()
        response['rooms']         = person.membership_list()
        response['messages']      = person.message_list([i['id'] for i in response['rooms']])
        response['files']         = person.file_list()
        response['folders']       = person.folder_list()
        response['cards']         = person.card_list()
        response['block']         = True
        send_stuff(request.sid, **response)

        send_person(person, True)


    return response

def disconnect_person(sid):
    person = Person.get_where(id=scoreboard.get_person_from_sid(sid))
    scoreboard.remove(sid)
    if person:
        send_stuff(True, persons=[ person.public_fields() ])


@person_logged_in
@socketio.on('logout')
def handle_logout(json):
    #print("logging out: " + str(json['sessionid']))
    Session.delete_where(sessionid=json['sessionid'])
    Session.commit()
    disconnect_person(request.sid)

@person_logged_in
@socketio.on('disconnect')
def handle_disconnect():
    #print("client disconnecting: " + request.sid)
    disconnect_person(request.sid)

@not_logged_in
@socketio.on('login-email')
@json_has_keys('email', 'password')
def handle_login_email(json):
    logging.info(f"Login -- email: {str(json['email'])}")
    email    = json['email']
    password = json['password']
    person   = Person.get_where(email=email)
    session  = None
    if person and person.verify_password(password):
        session = Session(sessionid=Session.make_sessionid(person),
                          person = person.id)
        session.save()
        session.commit()
        logging.info(f"Login -- email: success")
    else:
        logging.info(f"Login -- email: failure")
    do_login(person, session, True)

@not_logged_in
@socketio.on('login-session')
@json_has_keys('sessionid')
def handle_login_session(json):
    #print("session login: " + str(json))
    logging.info(f"Login -- session: {str(json['sessionid'][:10])}...")
    sessionid = json['sessionid']
    session   = Session.get_where(sessionid=sessionid)
    if not session:
        # TODO: more bad sessionid handling?
        emit('login-result', {'authenticated': False}, broadcast=False)
        logging.info(f"Login -- sessionid: failure")
    else:
        person = Person.get(int(sessionid.split('-')[0]))
        do_login(person, session)
        logging.info(f"Login -- sessionid: success")


stuff = {'persons': {'class': Person, 
                   'tables': [Person],
                   'where': 'persons.id in (%s)',
                   'order_by': 'persons.id'},
         'files': {'class': File, 
                   'tables': [File, Membership],
                   'where': 'files.id in (%s) and ((files.public = 1) or (files.owner  = ?) or (files.room = memberships.room and memberships.person = ?))',
                   'order_by': 'files.id'},
         'cards': {'class': Card, 
                   'tables': [Card, Membership],
                   'where': 'cards.id in (%s) and ((cards.public = 1) or (cards.owner = ?) or (cards.room = memberships.room and memberships.person = ?))',
                   'order_by': 'cards.id'},
         'rooms': {'class': Room, 
                   'tables': [Room, Membership],
                   'where': 'rooms.id in (%s) and ((rooms.public = 1) or (rooms.owner  = ?) or (rooms.id = memberships.room and memberships.person = ?))',
                   'order_by': 'rooms.id'},
         'messages': {'class': Message, 
                      'tables': [Message, Membership],
                      'where': 'messages.id in (%s) and ((messages.person = ?) or (messages.room = memberships.room and memberships.person = ?))',
                      'order_by': 'messages.id'}}

def send_stuff (room, **kwargs):
    kwargs['__protocol__'] = __protocol__
    if 'persons' in kwargs:
        for person in kwargs['persons']:
           person['online'] = scoreboard.person_online(person['id'])
    if type(room) == bool: # broadcast
        emit('stuff-list', kwargs, broadcast=room, namespace='/')
    else:
        # send only to initiating person...
        logging.debug(f'Send Stuff -- kwargs: {kwargs}')
        emit('stuff-list', kwargs, to=room, namespace='/')

@person_logged_in
@socketio.on('get-stuff')
def handle_get_stuff(json):
    person = scoreboard.get_person_from_sid(request.sid)
    output = {}
    logging.debug(f'Get Stuff -- stuff: {json}')
    for key, table in stuff.items():
        if key in json and len(json[key])>0:
            keys = [*json[key].keys()] 
            if key == 'persons':
                where = table['where'] % ','.join(['?' for i in json[key].keys()])
            else:
                keys.append(person)
                keys.append(person)
                where = table['where'] % ','.join(['?' for i in json[key].keys()])
            extra_columns = stuff[key]['extra_columns'] if 'extra_columns' in stuff[key] else []
            print(keys)
            rows = stuff[key]['class'].raw_select(where, 
                                                  keys, 
                                                  order_by = table['order_by'],
                                                  tables   = table['tables'],
                                                  distinct = True)
            output[key] = [ row.public_fields() for row in rows ]
    #logging.debug(f'Get Stuff -- output: {output}')
    send_stuff(request.sid, **output)

@person_logged_in
@socketio.on('get-messages')
@json_has_keys('room_id', 'before_id', 'count')
def handle_get_messages(json):
    person = scoreboard.get_person_from_sid(request.sid)
    room = int(json['room_id'])
    output = {}
    membership = Membership.get_where(room = room,
                                      person = person)
    if membership:
        date   = int(json['before_id'])
        count  = int(json['count'])
        count  = count if count < 100 else count

        messages = Message.raw_select("room = :room and id < :date",
                                      {'room': membership.room, 'date': date, 'count': count},
                                      order_by = "id desc limit :count")
        messages = [ row.public_fields() for row in messages ]
        
        at_end = False
        if len(messages) < count:
            # reached the end of messages, warn the client
            at_end = True 
        #print(messages)
        #time.sleep(5)
        send_stuff(request.sid, 
                   at_end   = at_end, 
                   block    = True, 
                   room_id  = membership.room, 
                   messages = messages)
    
@person_logged_in
@socketio.on('add-folder')
@json_has_keys('parent_folder','name')
def handle_add_folder(json):

    if json['name'] == '':
        logging.info(f'New Folder -- error: folder name empty')
    else:
        person_id = scoreboard.get_person_from_sid(request.sid)
        parent  = Folder.get(json['parent_folder'])

        folder  = Folder(name    = json['name'],
                         owner   = person_id,
                         public  = parent.public if parent else True,
                         parent  = parent.id if parent else None)
        folder.save()
        folder.commit()

        logging.info(f'New Folder -- name: "{folder.name[:20]}" parent: "{parent.name[:20] if parent else "root"}"') 
        # TODO: send to all people in room
        send_stuff(request.sid,
                   folders      = [folder.public_fields()])



@person_logged_in
@socketio.on('get-folder')
@json_has_keys('folder_id')
def handle_get_folder(json):
    person    = Person.get(scoreboard.get_person_from_sid(request.sid))
    files     = person.file_list(json['folder_id'])
    folders   = person.folder_list(json['folder_id'])
    send_stuff(request.sid, 
               files        = files, 
               folders      = folders)

@person_logged_in
@socketio.on('delete-file')
@json_has_keys('file_id')
def handle_delete_file(json):
    file = File.get_where(id=json['file_id'])
    if not file:
        emit('delete-file-result', {'error': "file doesn't exist"}, broadcast=False)
        logging.info(f"Delete File -- file_id does not exist ({json['file_id']})") 

    person_id = scoreboard.get_person_from_sid(request.sid)
    membership = Membership.get_where(room=file.room, person=person_id)

    if (not membership):       
        emit('delete-file-result', {'error': "no rights to delete"}, broadcast=False)
        logging.info(f"Delete File -- no rights to delete ({json['file_id']})") 
   
    file.deleted = 1
    file.save()
    file.commit()

    emit('delete-file-result', 
         {'stuff-list': {'files':[file.public_fields()]},
         'status': 'ok' }, 
         room = 'room-'+str(file.room))
    logging.info(f"Delete File -- deleted {file.name}") 


@person_logged_in
@socketio.on('send-bell-person')
@json_has_keys('person')
def handle_send_bell_person(json):
    personid = json['person']
    for sid in scoreboard.get_sids_from_person(personid):
        emit('bell', {}, room = sid)
    logging.info(f"Bell -- person ({personid})") 

@person_logged_in
@socketio.on('send-bell-room')
@json_has_keys('room')
def handle_send_bell_room(json):
    emit('bell', {}, room = f"room-{json['room']}")
    logging.info(f"Bell -- room ({json['room']})") 

@person_logged_in
@socketio.on('have-read')
@json_has_keys('room', 'last')
def handle_have_read(json):
    person = scoreboard.get_person_from_sid(request.sid)
    membership = Membership.get_where(room = json['room'], person=person)
    if membership:
        #print(f"last seen: id:{membership.id} last:{json['last']}")
        membership.last_seen = json['last']
        membership.save()
        membership.commit()
        for sid in scoreboard.get_sids_from_person(person):
            emit('has-read',
                 {'room': membership.room,
                  'last': json['last']},
                 room=sid)



@person_logged_in
@socketio.on('new-room')
@json_has_keys('name')
def handle_new_room(json):

    person         = scoreboard.get_person_from_sid(request.sid)
    online_persons = scoreboard.online_persons()

    about  = None
    topic  = None
    name   = None
    public = False
    if 'name' in json:
        name = json['name'][:100]
    if 'about' in json:
        about = json['about'][:100]
    if 'topic' in json:
        topic = json['topic'][:100]
    if 'public' in json:
        public = True if str(json['public']) == '1' else False

    folder, room   = Room.get_or_set_room(person,
                                          name  = name,
                                          about = about, 
                                          topic = topic)

    sids = scoreboard.get_sids_from_person(person)

    for sid in sids:
        join_room('room-'+str(room.id),
                  sid=sid)
        emit('add-room',
             {'room': room.public_fields(),
              'folder': folder.public_fields()},
              broadcast=False)

    if public == True:
        #inform everyone
        for member in online_persons:
            sids = scoreboard.get_sids_from_person(member)
            join_room('room-'+str(room.id), 
                      sid=sid)
            emit('add-room', 
                 {'room': room.public_fields(),
                  'folder': [folder]}, 
                 room=sid)

    logging.info(f"New Room -- room: {room.name} owner: {person}") 


@person_logged_in
@socketio.on('start-chat')
@json_has_keys('persons')
def handle_start_chat(json):
    person         = scoreboard.get_person_from_sid(request.sid)
    folder, room   = Room.get_or_set_room(person, json['persons'])
    online_persons = scoreboard.online_persons()
    for member in json['persons']:
        sids = scoreboard.get_sids_from_person(member)
        if person == member:
            for sid in sids:
                join_room('room-'+str(room.id),
                          sid=sid)
            emit('goto-chat', 
                 {'room': room.public_fields(),
                  'folder': folder.public_fields()},
                 broadcast=False)
        elif member in online_persons:
            for sid in sids:
                join_room('room-'+str(room.id), 
                          sid=sid)
                emit('add-room', 
                     {'room': room.public_fields(),
                      'folder': [folder]}, 
                     room=sid)
    logging.info(f"Start Chat -- people {json['persons']}") 

# person has sent a message
@person_logged_in
@socketio.on('message')
@json_has_keys('room', 'message')
def handle_message(json):
    #print("message: sid="+str(request.sid))

    previous = Message.last()
    person   = scoreboard.get_person_from_sid(request.sid)

    room = json['room']
    message = Message(person    = person, 
                      room    = room, 
                      message = json['message'])
    #print(f"{previous} - {previous.person} - {person} - {previous.data}")
    print(previous)
    if not previous:
        message.left = False
    elif previous.person == person:
        message.left = previous.left
    else:
        message.left = not previous.left

    message.save()
    message.commit()
    message = Message.get(message.id)
    emit('stuff-list', {'messages': [ message.public_fields() ]}, 
         room = 'room-'+str(room))
    logging.info(f"Msg -- room: {room}")

@person_logged_in
@socketio.on('card-toggle-lock')
@json_has_keys('card_id')
def handle_card_toggle_lock(json):
    person = Person.get(scoreboard.get_person_from_sid(request.sid))
    card = Card.get(json['card_id'])
    state = json['state']
    if card and person and (card.owner == person.id or person.id == 1):
        if state == 'locked' and card.locked == True:
            card.locked = False
            card.save()
            card.commit()
            logging.info(f"Card Unlocked ({card.id})")
        elif state == 'unlocked' and card.locked == False:
            card.locked = True
            card.save()
            card.commit()
            logging.info(f"Card Locked ({card.id})")
        emit('stuff-list', {'cards': [ card.public_fields() ]})



# person has submitted a card
@person_logged_in
@socketio.on('edit-card')
@json_has_keys('title', 'content', 'locked')
def handle_edit_card(json):
    person = scoreboard.get_person_from_sid(request.sid)
    if 'id' in json:
        card          = Card.get(int(json['id']))
        if card:
            if card.contents != json['content']:
                diff = '\n'.join(differ.compare(json['content'].split('\n'),
                                                card.contents.split('\n')))
                
                edit = Card_Edit(editor=person, diff=diff)
                edit.save()
                edit.commit()
            card.title    = json['title']
            card.contents = json['content']
            card.locked   = json['locked']
    else:
        card = Card(owner     = person, 
                    contents  = json['content'],
                    locked    = json['locked'],
                    title     = json['title'])

    if 'room' in json:
        card.room = int(json['room'])
        card.save()
        card.commit()
        emit('stuff-list', {'cards': [ card.public_fields() ]}, 
             room = 'room-'+str(json['room']))
    else:
        card.room = None
        card.save()
        card.commit()
        emit('stuff-list', {'cards': [ card.public_fields() ]})
    logging.info(f"Card Edit -- ({card.id})")



@person_logged_in
@socketio.on('invite-new-person')
@json_has_keys('password', 'email', 'handle', 'message', 'send_email')
def handle_new_person(json):
    message = json['message'][:10000] # stop silliness
    status     = 1
    status_msg = 'Person Successfully Created'

    person  = Person(email=json['email'], 
                   handle=json['handle'],
                   portrait=config['default_portrait'])

    if json['password'] != '':
        person.set_password(json['password'])
    else:
        person.password = str(int.from_bytes(os.urandom(32),'big'))
    
    try:
        person.save()
        person.join_public()
        token      = Session.make_token(person)
        url        = Session.make_token_url(token, config['site_url'])
        session    = Session(sessionid=token,
                             person = person.id)
        session.save()
        session.commit()
    except Exception as e:
        url        = ""
        status     = 0
        status_msg = str(e)
   
    if config['enable_email'] and json['send_email'] == 'on': 
        print("sending email")
        print(json['send_email'])
        msg = flask_mail.Message(f"Algonquin - Invite for {config['site_name']}", 
                      sender = config['sysop_email'], 
                      recipients = [json['email']])
        msg.body = "This is the email body"
        mail.send(msg)

    response = {'message': message + '\n\n' + url,
                'url': url,
                'status': status,
                'status_msg': status_msg,
                'persons': {person.id:person.public_fields()}}
    emit('invite-result', response, broadcast=False);
    logging.info(f"User Created -- email: {person.email[:30]} handle: {person.handle[:30]}")


search_messages = (DBSearch.ftable_, '=', '"messages"', 'and', 
                   (Message.room_, 'in', ('select', Membership.room_, 'from memberships where', 
                     Membership.person_, '=', ':person'), 'and',
                     DBSearch.contents_, 'match', ':query'))

search_folders  = (DBSearch.ftable_, '=', '"folders"', 'and', 
                   (Folder.parent_, 'is', 'NULL', 'or',
                    Folder.room_, 'in', ('select', Membership.room_, 'from memberships where', 
                     Membership.person_, '=', ':person')), 'and',
                     DBSearch.contents_, 'match', ':query')

search_files    = (DBSearch.ftable_, '=', '"files"', 'and', 
                   (File.folder_, 'is NULL', 'or',
                    File.room_, 'is NULL', 'or',
                    File.room_, 'in', ('select', Membership.room_, 'from memberships where', 
                     Membership.person_, '=', ':person')), 'and',
                     DBSearch.contents_, 'match', ':query')

search_cards    = (DBSearch.ftable_, '=', '"cards"', 'and', 
                   (Card.room_, 'is', 'NULL', 'or',
                    Card.room_, 'in', ('select', Membership.room_, 'from memberships where', 
                     Membership.person_, '=', ':person')), 'and',
                     DBSearch.contents_, 'match', ':query')

search_rooms    = (DBSearch.ftable_, '=', '"rooms"', 'and', 
                   (Room.public_, '=', '1', 'or',
                    Room.id_, 'in', ('select', Membership.room_, 'from memberships where', 
                     Membership.person_, '=', ':person')), 'and',
                     DBSearch.contents_, 'match', ':query')


#TODO: exclude content the user shouldn't see
@person_logged_in
@socketio.on('search-query')
@json_has_keys('query')
def handle_search(json):
    query     = json['query']
    person_id = scoreboard.get_person_from_sid(request.sid)

    #TODO: implement union(...) for this
    msg_results     = DBSearch.raw_select(search_messages,
                                          {'person': person_id, 'query': query},
                                          tables = [left_join(DBSearch, Message, 'row_id', 'id')],
                                          order_by = "rank desc limit 100",
                                          distinct = True)
    folder_results  = DBSearch.raw_select(search_folders,
                                          {'person': person_id, 'query': query},
                                          tables = [left_join(DBSearch, Folder, 'row_id', 'id')],
                                          order_by = "rank desc limit 100",
                                          distinct = True)
    file_results    = DBSearch.raw_select(search_files,
                                          {'person': person_id, 'query': query},
                                          tables = [left_join(DBSearch, File, 'row_id', 'id')],
                                          order_by = "rank desc limit 100",
                                          distinct = True)
    card_results    = DBSearch.raw_select(search_cards,
                                          {'person': person_id, 'query': query},
                                          tables = [left_join(DBSearch, Card, 'row_id', 'id')],
                                          order_by = "rank desc limit 100",
                                          distinct = True)
    room_results    = DBSearch.raw_select(search_rooms,
                                          {'person': person_id, 'query': query},
                                          tables = [left_join(DBSearch, Room, 'row_id', 'id')],
                                          order_by = "rank desc limit 100",
                                          distinct = True)
    person_results  = DBSearch.raw_select((DBSearch.ftable_, '=', '"persons"', 'and', 
                                          DBSearch.contents_, 'match', ':query'),
                                          {'person': person_id, 'query': query},
                                          order_by = "rank desc limit 100",
                                          tables = [left_join(DBSearch, Person, 'row_id', 'id')],
                                          distinct = True)
    print(msg_results)
    print(person_results)
    print(folder_results)
    print(file_results)
    print(card_results)
    results = msg_results + person_results + folder_results + file_results + card_results + room_results
    results = [ result.public_fields() for result in results ]
    print(results)
    emit('search-result', results)
    logging.info(f"Search Query -- query: {query[:30]}")

@person_logged_in
@socketio.on('settings')
def handle_settings(json):
    person_id = scoreboard.get_person_from_sid(request.sid)
    person = Person.get(person_id)
    status_msg = "Settings Updated."
    status_code = 1
    #print('settings: ')
    #print(json)
    for key,val in json.items():
        #print(key)
        #print(val)
        if key == 'email':
            #print("setting email")
            person.email = val
        if key == 'handle':
            #print("setting handle")
            person.handle = val
        if key == 'new-password':
            #print("setting password")
            if person.pwhash:
                if not 'old-password' in json:
                    status_msg = 'Must use have correct old password to change to a new one.'
                    status_code = 0
                elif not person.verify_password(json['old-password']):
                    status_code = 0
                    status_msg = 'Old password was incorrect, new password not set.'
                else:
                    person.set_password(val)
            else:
                person.set_password(val)
        if key == 'about':
            #print("setting handle")
            person.about = val
    if status_code == 1:
        #print("saving settings")
        send_person(person, True)
        person.save()
        person.commit()

    # it's a new person who used a token link.
    if 'no-status' in json:
        session = Session.raw_select(f"sessionid like '{person.id}-token-%' and person = :person_id",
                                     {'person_id': person.id})[0]
        session.sessionid = Session.make_sessionid(person)
        session.save()
        session.commit()
        emit('password-set', 
                { 'status_msg': 'password set', 'sessionid': session.sessionid},
             broadcast=False)
        logging.info(f"Settings -- new user password set: {person.handle[:30]}")

    else:
        emit('settings-result', 
             { 'status_msg':  status_msg, 
               'status_code': status_code },
             broadcast=False)

        logging.info(f"Settings -- settings changed: {person.handle[:30]}")
        

