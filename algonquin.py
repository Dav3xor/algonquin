from db import User, Session, Message, File, Room, build_tables

from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit, send

import os

config = {'site_name': 'Bath Salts Nation'}

app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'a very very sekrit sekrit key'

socketio = SocketIO(app)

if __name__ == '__main__':
    socketio.run(app)
pp = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', config=config)

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@socketio.on('my event')
def handle_event(json):
    print("received json: " + str(json))


@socketio.on('login-session')
def handle_login_session(json):
    print("session login: " + str(json))
    sessionid = json['sessionid']
    session   = Session.get_where(sessionid=sessionid)
    response  = {}

    if session:
        response['authenticated'] = True
    else:
        response['authenticated'] = False

    emit('login-result', response)

@socketio.on('login-email')
def handle_login_email(json):
    print("email login: " + str(json))
    email    = json['email']
    password = json['password']
    user     = User.get_where(email=email)
    response = {}
    if user and user.verify_password(password):
        response['authenticated'] = True
        response['sessionid']     = str(user.id) + '-' + str(int.from_bytes(os.urandom(32),'big'))
        session = Session(sessionid=response['sessionid'],
                          user = user.id)
        session.save()
        session.commit()
    else:
        response['authenticated']    = False

    emit('login-result', response);
    

#u = User('dave@dave.org', 'x', 'password')
#print(u.data)
#u.save()

#u.rooms.add(1,'Greetings Friend')

#print("----")
#for i in u.rooms:
#    print(i)
#print("----")

#u2 = User('bob@bob.org', 'y', 'password')
#u2.save()

#print(u.id)
#print(u2.id)

#u.commit()

#a = User.get(1)
#print(a.email)
#for room in a.rooms:
    #print(room)

