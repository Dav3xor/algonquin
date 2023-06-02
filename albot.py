import socketio
import json
import loudbot

from os.path import exists

settings_file = 'albot_sekrit'

settings = { 'sessionid': '3-token-5782322795120947802',
             'password': 'ASFG#$TYsdfasg@#$BR#$!!&^1461',
             'domain': 'Orgone Institute',
             'url': 'http://localhost:8080'}

louds = loudbot.LoudHailer()

if exists(settings_file):
    with open(settings_file,'r') as f:
        settings = json.loads(f.read())

sio = socketio.Client()

persons = {}
rooms = {}


def handle_persons(p):
    print("----")
    print(p)
    for person in p:
        print(person)
        persons[person['id']] = person

def handle_messages(m):
    for msg in m:
        print(msg)
        #print(personss)
        print(rooms)
        personname = persons[msg['person']]['handle'] if msg['person'] in persons else "(unknown)"
        person_id  = msg['person'] if 'person' in msg else  None
        room     = rooms[msg['room']]['name'] if msg['room'] in rooms else "(unknown)"
        room_id  = msg['room'] if 'room' in msg else None
        domain   = settings['domain'] if 'domain' in settings else "(unknown)"
        message  = msg['message']
        print(f"{type(settings['bot_id'])}:{settings['bot_id']} -- {type(person_id)}:{person_id}")
        if settings['bot_id'] != person_id:
            response = louds.add(message, personname, domain, room)
            if response:
                response = response.decode()
                #print(response)
                sio.emit('message', {'message': response, 'room': int(room_id)})
            
            command_response = louds.do_commands(message,personname,domain,room)
            if command_response:
                sio.emit('message', {'message': command_response, 'room': int(room_id)})
                
def handle_rooms(r):
    for room in r:
        rooms[room['id']] = room

@sio.event
def connect():
    print("connected")
    sio.emit('login-session', {'sessionid': settings['sessionid']})

def handle_stuff(data):
    if 'persons' in data:
        handle_persons(data['persons'])
    if 'rooms' in data:
        handle_rooms(data['rooms'])
    if 'messages' in data:
        handle_messages(data['messages'])

@sio.on('*')
def catch_all(event, data):
    print(f"handling: {event}")
    handle_stuff(data)

@sio.on('stuff-list')
def stuff_list(data):
    print('x')
    handle_stuff(data)

@sio.on('login-result')
def login_result(data):
    if data['authenticated'] == True:
        print(data)
        settings['bot_id'] = data['personid']
        #print(f"personid:{data['personid']} bot_id:{sbot_id}")
        print("logged in")
    else:
        print("login failed")

    if 'token' in settings['sessionid']:
        sio.emit('settings', {'new-password': settings['password'], 'no-status':True})
    #handle_stuff(data)
    if 'persons' in data:
        handle_persons(data['persons'])
    if 'rooms' in data:
        handle_rooms(data['rooms'])

@sio.on('password-set')
def password_set(data):
    settings['sessionid'] = data['sessionid']
    print(f"sessionid: {settings['sessionid']}")
    with open(settings_file, 'w') as f:
        f.write(json.dumps(settings))

sio.connect(settings['url'])
