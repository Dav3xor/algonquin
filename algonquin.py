from db import User, Session, Message, File, Room, Membership, build_tables
from formats import formats
from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit, send, disconnect, join_room
from urllib.parse import urlencode
from werkzeug.utils import secure_filename

import os
import eventlet
import json
import time
import hashlib
import pprint

pprint = pprint.PrettyPrinter()

config = {'site_name':        'Orgone Accumulator',
          'site_url':         'orgone.institute',
          'sysop_handle':     'sysop',
          'sysop_email':      'sysop@sysop.com',
          'public_rooms':     ['0 Day Warez', 'Poop', 'Dev/Test'],
          'file_root':        '/home/dave/dev/algonquin/',
          'portrait_types':   ['png', 'jpg', 'jpeg', 'gif'],
          'default_portrait': 'default.png',
          'default_room':     '0 Day Warez'}

app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'a very very sekrit sekrit key'

socketio = SocketIO(app)

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

def hash_file(file):
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

def admin_logged_in(f):
    def wrapper(*args, **kwargs):
        if request.sid in scoreboard.sid_to_user and scoreboard.sid_to_user == 1:
            # TODO: don't assume user id 1 is admin
            return f(*args, **kwargs)
        else:
            pass

def make_sessionid(user):
    return str(user.id) + '-' + str(int.from_bytes(os.urandom(32),'big'))

def make_token(user):
    return '%s-token-%s' % (str(user.id), str(int.from_bytes(os.urandom(8),'big')))
    #return str(user.id) + "-token-" + str(int.from_bytes(os.urandom(8),'big'))

def make_token_url(token):
    return 'https://%s/?%s' % (config['site_url'], urlencode({'token': token}))
    #return 'https://' + config['site_url'] + '/?' + urlencode({'token': token})

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
        extension    = file.filename.split('.')[-1]
        type         = "unknown"
        hash, size   = hash_file(file)

        if extension.lower() in formats:
            type = formats[extension.lower()]

        print ("hash = " + hash)
        print ("size = " + str(size))

        # check for duplicates
        original_file = File.get_where(hash=hash, size=size)
        if original_file:
            print("duplicate file upload -- " + 
                  original_file.name + " - " + 
                  file.filename + " - " + 
                  original_file.localname)
            # if the filename is different
            # make a new file row, but point it at the
            # already existing one
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
    send_stuff(broadcast, **{'users':{user.id:user.public_fields()} })
    #socketio.emit(label, user.public_fields(), broadcast=broadcast)

def memberships(user):
    rooms = Room.raw_select("rooms, memberships", 
                                  "rooms.id = memberships.room and memberships.user = %s" % user.id,
                                  "rooms.id")
    return { room.id:room.public_fields() for room in rooms }

def messages(user):
    messages = Message.raw_select("messages, memberships", 
                                  "messages.room = memberships.room and memberships.user = %s" % user.id,
                                  "messages.id desc limit 100")
    return { message.id:message.public_fields() for message in messages }

def files(user):
    files = File.raw_select("files, memberships", 
                                  "files.room = memberships.room and memberships.user = %s" % user.id,
                                  "files.id desc limit 100")
    return { file.id:file.public_fields() for file in files }

def do_login(user, session, send_session_id=False):
    response = {'authenticated': False}
    if (not user) or (not session):
        response['result'] = 'Bad Email/Password'
        return response
    scoreboard.add(request.sid, user.id)

    for membership in user.memberships:
        join_room('room-'+str(membership.room))
        #print(membership.room)

    response['users']    = online_users()
    response['rooms']    = memberships(user)
    response['messages'] = messages(user)
    response['files']    = files(user)
    response['userid']   = user.id
    response['authenticated'] = True
    response['result'] = 'Login Ok'

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
        session = Session(sessionid=make_sessionid(user),
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
                   'where': 'files.id = memberships.room and memberships.user = %s and files.id in (%s)',
                   'order_by': 'files.id'},
         'rooms': {'class': Room, 
                   'tables': 'rooms, memberships',
                   'where': 'rooms.id = memberships.room and memberships.user = %s and rooms.id in (%s)',
                   'order_by': 'rooms.id'},
         'messages': {'class': Message, 
                      'tables': 'messages, memberships',
                      'where': 'messages.room = memberships.room and memberships.user = %s and messages.id in (%s)',
                      'order_by': 'rooms.id'}}

def send_stuff (room, **kwargs):
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
    for key, table in stuff.items():
        if key in json and len(json[key])>0:
            if key == 'users':
                where = table['where'] % ','.join(str(i) for i in json[key].keys())
            else:
                where = table['where'] % (user, ','.join(str(i) for i in json[key].keys()))
            rows = stuff[key]['class'].raw_select(table['tables'], 
                                                  where, 
                                                  table['order_by'])
            output[key] = { row.id:row.public_fields() for row in rows }
    send_stuff(request.sid, **output)


@user_logged_in
@socketio.on('delete-file')
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
def handle_send_bell_user(json):
    userid = json['user']
    for sid in scoreboard.get_sids_from_user(userid):
        emit('bell', {}, room = sid)

@user_logged_in
@socketio.on('send-bell-room')
def handle_send_bell_user(json):
    emit('bell', {}, room = 'room-' +json['room'])

@user_logged_in
@socketio.on('start-chat')
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
def handle_message(json):
    #print("message: sid="+str(request.sid))
    user = scoreboard.get_user_from_sid(request.sid)
    room = json['room']
    message = Message(user    = user, 
                      room    = room, 
                      message = json['message'])
    message.save()
    message.commit()
    emit('stuff_list', {'messages': { message.id:message.public_fields() }}, 
         room = 'room-'+str(room))

@user_logged_in
@socketio.on('invite-new-user')
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
        token      = make_token(user)
        url        = make_token_url(token)
        session    = Session(sessionid=token,
                             user = user.id)
        session.save()
        session.commit()
    except Exception as e:
        status = 0
        status_msg = str(e)
        #print(type(e))

    response = {'message': json['message'] + '\n\n' + url,
                'url': url,
                'status': status,
                'status_msg': status_msg,
                'users': {user.id:user.public_fields()}}
    #print(response)
    emit('invite-result', response, broadcast=False);

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
                                     "sessionid like '%d-token-%%' and user = %d" % (user.id, user.id))[0]
        session.sessionid = make_sessionid(user)
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

        

