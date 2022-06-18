import socketio
import json
import loudbot

from os.path import exists

settings_file = 'albot_sekrit'

settings = { 'sessionid': '2-token-10747145167090777022',
             'password': 'ASFG#$TYsdfasg@#$BR#$!!&^1461',
             'domain': 'Orgone Institute'}

louds = loudbot.LoudHailer()

if exists(settings_file):
    with open(settings_file,'r') as f:
        settings = json.loads(f.read())

sio = socketio.Client()

users = {}
rooms = {}


def handle_users(u):
    for user in u:
        #print(user)
        users[int(user)] = u[user]

def handle_messages(m):
    for id,msg in m.items():
        #print(msg)
        #print(users)
        print(rooms)
        username = users[msg['user']]['handle'] if msg['user'] in users else "(unknown)"
        user_id  = msg['user'] if 'user' in msg else  None
        room     = rooms[msg['room']]['name'] if msg['room'] in rooms else "(unknown)"
        room_id  = msg['room'] if 'room' in msg else None
        domain   = settings['domain'] if 'domain' in settings else "(unknown)"
        message  = msg['message']
        print(f"{type(settings['bot_id'])}:{settings['bot_id']} -- {type(user_id)}:{user_id}")
        if settings['bot_id'] != user_id:
            response = louds.add(message, username, domain, room)
            if response:
                response = response.decode()
                #print(response)
                sio.emit('message', {'message': response, 'room': int(room_id)})
            
            command_response = louds.do_commands(message,username,domain,room)
            if command_response:
                sio.emit('message', {'message': command_response, 'room': int(room_id)})
                
def handle_rooms(r):
    for room in r:
        rooms[int(room)] = r[room]

@sio.event
def connect():
    print("connected")
    sio.emit('login-session', {'sessionid': settings['sessionid']})

def handle_stuff(data):
    if 'users' in data:
        handle_users(data['users'])
    if 'rooms' in data:
        handle_rooms(data['rooms'])
    if 'messages' in data:
        handle_messages(data['messages'])

@sio.on('*')
def catch_all(event, data):
    print(f"handling: {event}")
    handle_stuff(data)

@sio.on('stuff_list')
def stuff_list(data):
    handle_stuff(data)

@sio.on('login-result')
def login_result(data):
    if data['authenticated'] == True:
        settings['bot_id'] = data['userid']
        #print(f"userid:{data['userid']} bot_id:{sbot_id}")
        print("logged in")
    else:
        print("login failed")

    if 'token' in settings['sessionid']:
        sio.emit('settings', {'new-password': settings['password'], 'no-status':True})
    #handle_stuff(data)
    if 'users' in data:
        handle_users(data['users'])
    if 'rooms' in data:
        handle_rooms(data['rooms'])

@sio.on('password-set')
def password_set(data):
    settings['sessionid'] = data['sessionid']
    print(f"sessionid: {settings['sessionid']}")
    with open(settings_file, 'w') as f:
        f.write(json.dumps(settings))

sio.connect('http://orgone.institute:8080')
