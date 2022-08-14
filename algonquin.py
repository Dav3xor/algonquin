from db import DBTable, DBSearch, build_tables
from tables import User, Session, Message, File, Folder, Room, Membership, Card, Card_Edit
from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit, send, disconnect, join_room
from urllib.parse import urlencode
from werkzeug.utils import secure_filename

import os
import eventlet
import json
import time
import pprint
import difflib

__version__    = "v0.80"
__protocol__   = 1


pprint = pprint.PrettyPrinter()

config = {'database':         'algonquin.db',
          'protocol':         __protocol__,
          'version':          __version__,
          'site_name':        'Orgone Accumulator',
          'site_url':         'orgone.institute',
          'sysop_handle':     'sysop',
          'sysop_email':      'sysop@sysop.com',
          'public_rooms':     ['0 Day Warez', 'Poop', 'Dev/Test'],
          'file_root':        '/home/dave/dev/algonquin/',
          'portrait_types':   ['png', 'jpg', 'jpeg', 'gif'],
          'default_portrait': 'default.png',
          'default_room':     '0 Day Warez'}

DBTable.set_db(config['database'])

build_tables([User, Session, Message, Room, File, Folder, Membership, Card, Card_Edit])

app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'a very very sekrit sekrit key'

socketio = SocketIO(app)

differ = difflib.Differ()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
pp = Flask(__name__)

class Scoreboard:
    def __init__(self):
        self.sid_to_user   = {}
        self.user_to_sid   = {}
    def add(self, sid, user):
        self.sid_to_user[sid] = user
        if user not in self.user_to_sid:
            self.user_to_sid[user] = set()
        self.user_to_sid[user].add(sid)
    def remove(self, sid):
        if sid in self.sid_to_user:
            user = self.sid_to_user[sid]
            if user in self.user_to_sid and sid in self.user_to_sid[user]:
                self.user_to_sid[user].discard(sid)
            del self.sid_to_user[sid]
    def get_user_from_sid(self,sid):
        if sid not in self.sid_to_user:
            return False
        else:
            return self.sid_to_user[sid]
    def get_sids_from_user(self,user):
        if user not in self.user_to_sid:
            return set()
        else:
            return self.user_to_sid[user]
    def online_users(self):
        return set(self.sid_to_user.values())

scoreboard=Scoreboard()


def valid_portrait(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config['portrait_types']


def not_logged_in(f):
    def wrapper(*args, **kwargs):
        if request.sid not in scoreboard.sid_to_user:
            return f(*args, **kwargs)
        else:
            pass

def user_logged_in(f):
    def wrapper(*args, **kwargs):
        if request.sid in scoreboard.sid_to_user:
            return f(*args, **kwargs)
        else:
            pass

# decorator for making sure the json argument for socketio handler functions
# contains certain arguments
def json_has_keys(*keys):
    def Inner(func):
        def wrapper(*args, **kwargs):
            success = True
            for key in keys:
                if key not in args[0]:
                    print ("missing json key: " + key)
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
        if request.sid in scoreboard.sid_to_user and scoreboard.sid_to_user == 1:
            # TODO: don't assume user id 1 is admin
            return f(*args, **kwargs)
        else:
            pass


@app.route('/')
def index():
    return render_template('index.html', config=config)


def file_upload_common(req):
    if 'file' not in req.files:
        return None, json.dumps({'error': 'no file'})
    file = req.files['file']
    #print(file)
    if file.filename == '':
        return  None, None, None, json.dumps({'error': 'no filename'})
    
    if 'sessionid' not in req.form:
        return  None, None, None, json.dumps({'error': 'no sessionid'})
    
    session = Session.get_where(sessionid=request.form['sessionid'])
    if not session:
        return None, None, None, json.dumps({'error': 'bad sessionid'})

    user = User.get(session.user)


    return file, session, user, None



@app.route('/upload-file', methods=['POST'])
def upload_file():
    file, session, user, errors = file_upload_common(request)

    if not errors:
        hash, size   = File.hash_file(file)
        type, extension = File.file_type(file.filename)

        print ("hash = " + hash)
        print ("size = " + str(size))

        # check for duplicates
        
        original_file = File.hash_exists(hash=hash, size=size)
        if original_file:
            print("duplicate file upload -- " + 
                  original_file.name + " - " + 
                  file.filename + " - " + 
                  original_file.localname)
            filename = original_file.localname
        else:
            filename     = str(time.time()) + '.' + extension
            file.save(os.path.join(config['file_root'], 'files', filename))
       
        db_file = File(owner     = user.id,
                       public    = True,
                       name      = file.filename,
                       hash      = hash,
                       size      = size,
                       type      = type,
                       localname = filename)

        if 'room' in request.form:
            db_file.room = request.form['room']


        db_file.save()
        db_file.commit()

        if db_file.room: 
            emit('stuff_list', 
                 {'files':{db_file.id:db_file.public_fields()}},
                 room = 'room-'+str(db_file.room),
                 namespace = None)

        return json.dumps({'status': 'ok', 'files': [db_file.public_fields()]})
    else:
        return errors

@app.route('/upload-portrait', methods=['POST'])
def upload_portrait():
    file, session, user, errors = file_upload_common(request)
    if errors:
        return errors
    else:
        if not valid_portrait(file.filename):
            return  json.dumps({'error': 'filetype not supported for portrait'})

        filename = str(time.time()) + '.' + file.filename.split('.')[-1]

        file.save(os.path.join(config['file_root'], 'portraits', filename))

        user.portrait = filename
        user.save()
        user.commit()

        send_user(user, True, namespace=None)
        
        return json.dumps({'status': 'ok', 'user': user.public_fields()})


# TODO: handle these with a real web server?
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/files/<path:path>')
def send_files(path):
    return send_from_directory('files', path)

@app.route('/portraits/<path:path>')
def send_portraits(path):
    return send_from_directory('portraits', path)

@user_logged_in
@socketio.on('disconnect')
def handle_disconnect():
    #print("client disconnecting: " + request.sid)
    scoreboard.remove(request.sid)

def online_users():
    users = scoreboard.online_users()
    return {user:User.get(user).public_fields() for user in users }


def send_user(user, broadcast=False, **kwargs):

    if 'namespace' in kwargs:
        namespace = kwargs['namespace']
    send_stuff(broadcast, users={user.id:user.public_fields()} )


def do_login(user, session, send_session_id=False):
    response = {'authenticated': False}
    if (not user) or (not session):
        response['result'] = 'Bad Email/Password'
        return response
    scoreboard.add(request.sid, user.id)

    for membership in user.memberships:
        join_room('room-'+str(membership.room))
        #print(membership.room)

    response['users']         = user.related_users()
    response['rooms']         = user.membership_list()
    response['messages']      = user.message_list(response['rooms'].keys())
    response['files']         = user.file_list()
    response['cards']         = user.card_list()
    response['userid']        = user.id
    response['authenticated'] = True
    response['result']        = 'Login Ok'
    response['__protocol']    = __protocol__
    send_user(user, True)

    if send_session_id:
        response['sessionid'] = session.sessionid
    
    return response

@user_logged_in
@socketio.on('logout')
def handle_logout(json):
    #print("logging out: " + str(json['sessionid']))
    Session.delete_where(sessionid=json['sessionid'])
    Session.commit()
    scoreboard.remove(request.sid)

@not_logged_in
@socketio.on('login-email')
def handle_login_email(json):
    #print("email login: " + str(json))
    email    = json['email']
    password = json['password']
    user     = User.get_where(email=email)
    session = None
    if user and user.verify_password(password):
        session = Session(sessionid=Session.make_sessionid(user),
                          user = user.id)
        session.save()
        session.commit()
    response = do_login(user, session, True)
    emit('login-result', response, broadcast=False);

@not_logged_in
@socketio.on('login-session')
def handle_login_session(json):
    #print("session login: " + str(json))
    sessionid = json['sessionid']
    session   = Session.get_where(sessionid=sessionid)
    if not session:
        # TODO: more bad sessionid handling?
        emit('login-result', {'authenticated': False}, broadcast=False)
    else:
        user = User.get(int(sessionid.split('-')[0]))
        
        response = do_login(user, session)

        if '-token-' in sessionid:
            response['new-user'] = True

        emit('login-result', response, broadcast=False)

stuff = {'users': {'class': User, 
                   'tables': 'users',
                   'where': 'users.id in (%s)',
                   'order_by': 'users.id'},
         'files': {'class': File, 
                   'tables': 'files, memberships',
                   'where': 'files.id = memberships.room and memberships.user = ? and files.id in (%s)',
                   'order_by': 'files.id'},
         'cards': {'class': Card, 
                   'tables': 'cards, memberships',
                   'where': 'cards.id = memberships.room and memberships.user = ? and cards.id in (%s)',
                   'order_by': 'cards.id'},
         'rooms': {'class': Room, 
                   'tables': 'rooms, memberships',
                   'where': 'rooms.id = memberships.room and memberships.user = ? and rooms.id in (%s)',
                   'order_by': 'rooms.id'},
         'messages': {'class': Message, 
                      'tables': 'messages, memberships',
                      'where': 'messages.room = memberships.room and memberships.user = ? and messages.id in (%s)',
                      'order_by': 'rooms.id'}}

def send_stuff (room, **kwargs):
    kwargs['__protocol__'] = __protocol__
    if type(room) == bool: # broadcast
        emit('stuff_list', kwargs, broadcast=room, namespace='/')
    else:
        # send only to initiating user...
        emit('stuff_list', kwargs, to=room, namespace='/')

@user_logged_in
@socketio.on('get-stuff')
def handle_get_stuff(json):
    user = scoreboard.get_user_from_sid(request.sid)
    output = {}
    print (json)
    for key, table in stuff.items():
        if key in json and len(json[key])>0:
            keys = []
            if key == 'users':
                where = table['where'] % ','.join(['?' for i in json[key].keys()])
            else:
                keys.append(user)
                where = table['where'] % ','.join(['?' for i in json[key].keys()])
            extra_columns = stuff[key]['extra_columns'] if 'extra_columns' in stuff[key] else []
            keys += [*json[key].keys()] 
            rows = stuff[key]['class'].raw_select(table['tables'], 
                                                  where, 
                                                  keys, 
                                                  table['order_by'])
            output[key] = { row.id:row.public_fields() for row in rows }
    send_stuff(request.sid, **output)

@user_logged_in
@socketio.on('get-messages')
@json_has_keys('room_id', 'before_id', 'count')
def handle_get_messages(json):
    print("1")
    user = scoreboard.get_user_from_sid(request.sid)
    room = int(json['room_id'])
    output = {}
    membership = Membership.get_where(room = room,
                                      user = user)
    print("2")
    if membership:
        print("3")
        date   = int(json['before_id'])
        count  = int(json['count'])
        count  = count if count < 100 else count

        messages = Message.raw_select("messages",
                                      "room = :room and id < :date",
                                      {'room': membership.room, 'date': date, 'count': count},
                                      "id desc limit :count")
        messages = [ row.public_fields() for row in messages ]
        
        at_end = False
        if len(messages) < count:
            # reached the end of messages, warn the client
            at_end = True 
        #print(messages)
        #time.sleep(5)
        send_stuff(request.sid, 
                   at_end=at_end, 
                   room_id=room, 
                   messages=messages)
        

@user_logged_in
@socketio.on('delete-file')
@json_has_keys('file_id')
def handle_delete_file(json):
    if 'file_id' not in json:
        emit('delete-file-result', {'error': 'invalid request'}, broadcast=False)

    file = File.get_where(id=json['file_id'])
    if not file:
        emit('delete-file-result', {'error': "file doesn't exist"}, broadcast=False)

    user_id = scoreboard.get_user_from_sid(request.sid)
    membership = Membership.get_where(room=file.room, user=user_id)

    if (not membership):       
        emit('delete-file-result', {'error': "no rights to delete"}, broadcast=False)
   
    File.delete_where(id=file.id)
    emit('delete-file-result', {'status': 'ok', 'file_id': file.id}, room = 'room-'+str(file.room))


@user_logged_in
@socketio.on('send-bell-user')
@json_has_keys('user')
def handle_send_bell_user(json):
    userid = json['user']
    for sid in scoreboard.get_sids_from_user(userid):
        emit('bell', {}, room = sid)

@user_logged_in
@socketio.on('send-bell-room')
@json_has_keys('room')
def handle_send_bell_room(json):
    emit('bell', {}, room = 'room-' +json['room'])

@user_logged_in
@socketio.on('have-read')
@json_has_keys('room', 'last')
def handle_have_read(json):
    user = scoreboard.get_user_from_sid(request.sid)
    membership = Membership.get_where(room = json['room'], user=user)
    if membership:
        print(f"last seen: id:{membership.id} last:{json['last']}")
        membership.last_seen = json['last']
        membership.save()
        membership.commit()
        for sid in scoreboard.get_sids_from_user(user):
            emit('has-read',
                 {'room': membership.room,
                  'last': json['last']},
                 room=sid)





@user_logged_in
@socketio.on('start-chat')
@json_has_keys('users')
def handle_start_chat(json):
    user         = scoreboard.get_user_from_sid(request.sid)
    room         = Room.get_or_set_chat(user, json['users'])
    online_users = scoreboard.online_users();
    print("start chat")
    for member in json['users']:
        sids = scoreboard.get_sids_from_user(member)
        if user == member:
            for sid in sids:
                join_room('room-'+str(room.id),
                          sid=sid)
            emit('goto_chat', 
                 {'room': room.public_fields()},
                 broadcast=False)
        elif member in online_users:
            for sid in sids:
                join_room('room-'+str(room.id), 
                          sid=sid)
                emit('add_room', 
                     {'room': room.public_fields()}, 
                     room=sid)
    print("end chat")

# user has uploaded a message
@user_logged_in
@socketio.on('message')
@json_has_keys('room', 'message')
def handle_message(json):
    #print("message: sid="+str(request.sid))
    user = scoreboard.get_user_from_sid(request.sid)
    room = json['room']
    message = Message(user    = user, 
                      room    = room, 
                      message = json['message'])
    message.save()
    message.commit()
    message = Message.get(message.id)
    print(message.public_fields())
    emit('stuff_list', {'messages': [ message.public_fields() ]}, 
         room = 'room-'+str(room))

@user_logged_in
@socketio.on('card-toggle-lock')
@json_has_keys('card_id')
def handle_card_toggle_lock(json):
    print(json) 
    user = User.get(scoreboard.get_user_from_sid(request.sid))
    card = Card.get(json['card_id'])
    state = json['state']
    if card and user and (card.owner == user.id or user.id == 1):
        print('card locking:')
        if state == 'locked' and card.locked == True:
            card.locked = False
            card.save()
            card.commit()
            print('card unlocked')
        elif state == 'unlocked' and card.locked == False:
            card.locked = True
            card.save()
            card.commit()
            print('card locked')
        emit('stuff_list', {'cards': { card.id:card.public_fields() }})



# user has submitted a card
@user_logged_in
@socketio.on('edit-card')
@json_has_keys('title', 'content', 'locked')
def handle_edit_card(json):
    user = scoreboard.get_user_from_sid(request.sid)
    print(json)
    if 'id' in json:
        card          = Card.get(int(json['id']))
        if card:
            if card.contents != json['content']:
                diff = '\n'.join(differ.compare(json['content'].split('\n'),
                                                card.contents.split('\n')))
                
                edit = Card_Edit(editor=user, diff=diff)
                edit.save()
                edit.commit()
            card.title    = json['title']
            card.contents = json['content']
            card.locked   = json['locked']
    else:
        card = Card(owner     = user, 
                    contents  = json['content'],
                    locked    = json['locked'],
                    title     = json['title'])

    if 'room' in json:
        print("setting room to: " + str(json['room']))
        card.room = int(json['room'])
        card.save()
        card.commit()
        emit('stuff_list', {'cards': { card.id:card.public_fields() }}, 
             room = 'room-'+str(json['room']))
    else:
        print("room set to None")
        card.room = None
        card.save()
        card.commit()
        emit('stuff_list', {'cards': { card.id:card.public_fields() }})




@user_logged_in
@socketio.on('invite-new-user')
@json_has_keys('password', 'email', 'handle', 'message')
def handle_new_user(json):
    #print(json)
    
    status     = 1
    status_msg = 'User Successfully Created'

    user  = User(email=json['email'], 
                 handle=json['handle'],
                 portrait=config['default_portrait'])

    if json['password'] != '':
        user.set_password(json['password'])
    else:
        user.password = str(int.from_bytes(os.urandom(32),'big'))
    
    try:
        user.save()
        user.join_public()
        token      = Session.make_token(user)
        url        = Session.make_token_url(token, config['site_url'])
        session    = Session(sessionid=token,
                             user = user.id)
        session.save()
        session.commit()
    except Exception as e:
        status = 0
        status_msg = str(e)
        print(type(e))
        print(status_msg)
    response = {'message': json['message'] + '\n\n' + url,
                'url': url,
                'status': status,
                'status_msg': status_msg,
                'users': {user.id:user.public_fields()}}
    #print(response)
    emit('invite-result', response, broadcast=False);

@user_logged_in
@socketio.on('search-query')
@json_has_keys('query')
def handle_search(json):
    query = json['query']
    print(f"search... ({query})")
    results = [ result.public_fields() for result in DBSearch.search(query) ]
    print(results)
    emit('search-result', results)

@user_logged_in
@socketio.on('settings')
def handle_settings(json):
    user_id = scoreboard.get_user_from_sid(request.sid)
    user = User.get(user_id)
    status_msg = "Settings Updated."
    status_code = 1
    #print('settings: ')
    #print(json)
    for key,val in json.items():
        #print(key)
        #print(val)
        if key == 'email':
            #print("setting email")
            user.email = val
        if key == 'handle':
            #print("setting handle")
            user.handle = val
        if key == 'new-password':
            #print("setting password")
            if user.pwhash:
                if not 'old-password' in json:
                    status_msg = 'Must use have correct old password to change to a new one.'
                    status_code = 0
                elif not user.verify_password(json['old-password']):
                    status_code = 0
                    status_msg = 'Old password was incorrect, new password not set.'
                else:
                    user.set_password(val)
            else:
                user.set_password(val)
        if key == 'about':
            #print("setting handle")
            user.about = val
    if status_code == 1:
        #print("saving settings")
        send_user(user, True)
        user.save()
        user.commit()

    # it's a new user who used a token link.
    if 'no-status' in json:
        session = Session.raw_select("sessions",
                                     "sessionid like ':user_id-token-%%' and user = :user_id",
                                     {'user_id': user.id})[0]
        session.sessionid = Session.make_sessionid(user)
        session.save()
        session.commit()
        emit('password-set', 
                { 'status_msg': 'password set', 'sessionid': session.sessionid},
             broadcast=False)
    else:
        emit('settings-result', 
             { 'status_msg':  status_msg, 
               'status_code': status_code },
             broadcast=False)

        

