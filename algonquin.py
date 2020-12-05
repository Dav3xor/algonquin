from db import User, Session, Message, File, Room, build_tables

from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit, send, disconnect, join_room

import os

config = {'site_name': 'Bath Salts Nation'}

app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'a very very sekrit sekrit key'

socketio = SocketIO(app)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
pp = Flask(__name__)

scoreboard = { 'users': {},
               'sid-user': {} }

@app.route('/')
def index():
    return render_template('index.html', config=config)

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


@socketio.on('disconnect')
def handle_disconnect():
    print("client disconnecting: " + request.sid)
    if request.sid in scoreboard['sid-user']:
        del scoreboard['sid-user'][request.sid]

def send_users():
    emit('user_list', { user.id:user.public_fields() for user in scoreboard['users'].values() })

def send_user(user_id, broadcast=False):
    emit('user_info', scoreboard['users'][user_id].public_fields(), broadcast=broadcast)

def send_messages(user_id):
    messages = Message.raw_select("messages, memberships", 
                                  "messages.room = memberships.room and memberships.user = %s" % user_id,
                                  "messages.id desc limit 5")
    messages = [ i.public_fields() for i in messages ]
    emit('messages', {'messages': messages})

def do_login(user, session, send_session_id=False):
    response = {}
    if (not user) or (not session):
        return {'authenticated': False}
    if user.id not in scoreboard['users']:
        scoreboard['users'][user.id] = user
    scoreboard['sid-user'][request.sid] = user.id

    for membership in user.memberships:
        join_room('room-'+str(membership.room))
        print(membership.room)

    send_user(user.id, True)
    send_users()
    send_messages(user.id)

    response['authenticated'] = True
    if send_session_id:
        response['sessionid'] = session.sessionid
    
    return response

@socketio.on('login-session')
def handle_login_session(json):
    print("session login: " + str(json))
    sessionid = json['sessionid']
    session   = Session.get_where(sessionid=sessionid)
    if not session:
        # TODO: more bad sessionid handling?
        emit('login-result', {'authenticated': False})
    else:
        user = User.get(int(sessionid.split('-')[0]))
        response = do_login(user, session)

        emit('login-result', response)

@socketio.on('login-email')
def handle_login_email(json):
    print("email login: " + str(json))
    email    = json['email']
    password = json['password']
    user     = User.get_where(email=email)
    if not user:
        # TODO: handle weird login attempts here
        #       3 strikes you're out, etc?
        #       
        #       just disconnect for now
        disconnect()
        return None
    session = None
    print("1")
    if user and user.verify_password(password):
        print("2")
        session = Session(sessionid=str(user.id) + '-' + str(int.from_bytes(os.urandom(32),'big')),
                          user = user.id)
        session.save()
        session.commit()
    response = do_login(user, session, True)
    emit('login-result', response);

@socketio.on('logout')
def handle_logout(json):
    print("logging out: " + str(json['sessionid']))
    Session.delete_where(sessionid=json['sessionid'])
    Session.commit()

@socketio.on('message')
def handle_message(json):
    print("message: sid="+str(request.sid))
    user = scoreboard['sid-user'][request.sid]
    room = json['room']
    message = Message(user    = user, 
                      room    = room, 
                      message = json['message'])
    message.save()
    message.commit()
    emit('messages', 
         {'messages':[message.public_fields()]}, 
         room = 'room-'+str(room))


