from db import User, Session, Message, File, Room, build_tables

from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit, send, disconnect, join_room
from urllib.parse import urlencode
from werkzeug.utils import secure_filename

import os
import eventlet
import json
import time
import pprint

pprint = pprint.PrettyPrinter()

config = {'site_name':      'Slow Pizza',
          'site_url':       'slow.pizza',
          'sysop_handle':   'sysop',
          'sysop_email':    'sysop@sysop.com',
          'public_rooms':   ['0 Day Warez', 'Poop', 'Dev/Test'],
          'file_root':      '/home/dave/dev/algonquin/',
          'portrait_types': ['png', 'jpg', 'jpeg', 'gif'],
          'default_room':   '0 Day Warez'}

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
            return self.user_to_sid(user)
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
    
    if not valid_portrait(file.filename):
        return  None, None, None, json.dumps({'error': 'image not supported'})

    if 'sessionid' not in req.form:
        return  None, None, None, json.dumps({'error': 'no sessionid'})
    
    session = Session.get_where(sessionid=request.form['sessionid'])
    if not session:
        return json.dumps({'error': 'bad sessionid'})

    user = User.get(session.user)


    return file, session, user, None



@app.route('/upload-file', methods=['POST'])
def upload_file():
    print("------------")
    print(request)
    file, session, user, errors = file_upload_common(request)

    filename = str(time.time()) + '.' + file.filename.split('.')[-1]
    file.save(os.path.join(config['file_root'], 'static', 'portraits', filename))
    
    db_file = File(owner     = user.id,
                   public    = True,
                   name      = file.filename,
                   localname = filename)
    db_file.save()
    db_file.commit()

    
    file = request.files['file']
    print(file.filename)
    return json.dumps({'status': 'ok', 'file_id': db_file.id})

@app.route('/upload-portrait', methods=['POST'])
def upload_portrait():
    file, session, user, errors = file_upload_common(request)
    if errors:
        return errors
    else:
        filename = str(time.time()) + '.' + file.filename.split('.')[-1]

        file.save(os.path.join(config['file_root'], 'static', 'portraits', filename))

        user.portrait = filename
        user.save()
        user.commit()

        send_user('user_change', user, True)
        
        return json.dumps({'status': 'ok', 'user': user.public_fields()})



@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@user_logged_in
@socketio.on('disconnect')
def handle_disconnect():
    #print("client disconnecting: " + request.sid)
    scoreboard.remove(request.sid)

def send_online_users():
    users = scoreboard.online_users()
    #print(users)
    emit('user_list', { user:User.get(user).public_fields() for user in users })

def send_user(label, user, broadcast=False):
    socketio.emit(label, user.public_fields(), broadcast=broadcast)

def send_memberships(user):
    rooms = Room.raw_select("rooms, memberships", 
                                  "rooms.id = memberships.room and memberships.user = %s" % user.id,
                                  "rooms.id")
    emit('memberships', [ room.public_fields() for room in rooms ])

def send_messages(user):
    messages = Message.raw_select("messages, memberships", 
                                  "messages.room = memberships.room and memberships.user = %s" % user.id,
                                  "messages.id desc limit 100")
    messages = [ i.public_fields() for i in messages ]
    emit('messages', {'messages': messages})

def do_login(user, session, send_session_id=False):
    response = {'authenticated': False}
    if (not user) or (not session):
        response['result'] = 'Bad Email/Password'
        return response
    scoreboard.add(request.sid, user.id)

    for membership in user.memberships:
        join_room('room-'+str(membership.room))
        #print(membership.room)


    send_online_users()
    send_memberships(user)
    send_messages(user)
    send_user('user_info', user, True)

    response['userid'] = user.id
    response['authenticated'] = True
    response['result'] = 'Login Ok'
    if send_session_id:
        response['sessionid'] = session.sessionid
    
    return response

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
    emit('login-result', response);

@not_logged_in
@socketio.on('login-session')
def handle_login_session(json):
    #print("session login: " + str(json))
    sessionid = json['sessionid']
    send_sessionid = False
    session   = Session.get_where(sessionid=sessionid)
    if not session:
        # TODO: more bad sessionid handling?
        emit('login-result', {'authenticated': False})
    else:
        user = User.get(int(sessionid.split('-')[0]))
        if '-token-' in sessionid:
            send_sessionid = True
            session.sessionid = make_sessionid(user)
            session.save()
            session.commit()
        
        response = do_login(user, session, send_sessionid)

        if '-token-' in sessionid:
            response['new-user'] = True

        emit('login-result', response)

@user_logged_in
@socketio.on('invite-new-user')
def handle_new_user(json):
    #print(json)
    
    status     = 1
    status_msg = 'User Successfully Created'

    user  = User(email=json['email'], 
                 handle=json['handle'])

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
                'status_msg': status_msg}
    #print(response)
    emit('invite-result', response);


@user_logged_in
@socketio.on('logout')
def handle_logout(json):
    #print("logging out: " + str(json['sessionid']))
    Session.delete_where(sessionid=json['sessionid'])
    Session.commit()
    scoreboard.remove(request.sid)

@user_logged_in
@socketio.on('user-info')
def handle_user_info(json):
    # TODO: this is inefficient...
    emit('user_list', { id:User.get_public_where(id=id) for id in json['users']})

@user_logged_in
@socketio.on('start-chat')
def handle_start_chat(json):
    user = scoreboard.get_user_from_sid(request.sid)
    room = Room.get_or_set_chat(user, json['users'])
    online_users = scoreboard.online_users();
    for member in json['users']:
        if user == member:
            join_room('room-'+str(room.id))
            emit('goto_chat', 
                 {'room': room.public_fields()})
        elif member in online_users:
            join_room('room-'+str(room.id), 
                      sid=scoreboard.get_sid_from_user(member))
            emit('add_room', 
                 {'room': room.public_fields()}, 
                 to=scoreboard.user_to_sid(member))


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
    emit('messages', 
         {'messages':[message.public_fields()]}, 
         room = 'room-'+str(room))

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
        send_user('user_change', user, True)
        user.save()
        user.commit()

    emit('settings-result', { 'status_msg': status_msg, 
                              'status_code': status_code })

        

