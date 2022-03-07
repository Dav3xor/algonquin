from db import DBTable, build_tables
from tables import User, Session, Message, Card, File, Room, Membership
import pytest, os

@pytest.fixture()
def setup():
    DBTable.set_db('blahblahtest.db')
    build_tables([User, Session, Message, Card, File, Room, Membership])
    yield 'resource'
    os.remove('blahblahtest.db')

def test_user(setup):
    u = User(email="dave@dave.com", handle="dave")
    u.save()
    u.commit()

    r1 = Room(owner=1, public=True, name="room")
    r1.save()
    r1.commit()
    
    r2 = Room(owner=1, public=False, name="room 2")
    r2.save()
    r2.commit()
    
    r3 = Room(owner=1, public=True, name="room 3")
    r3.save()
    r3.commit()

    assert u.verify_password("12345") == None

    u.set_password("12345")

    assert u.verify_password("12345") == True
    assert u.verify_password("xxxxx") == False

    u.join_public()

    assert Membership.count() == 2
    for i in u.memberships:
        assert i.user == 1
        assert i.room in [1,3]
   
    assert Membership.count(id=1) == 1

    msg = Message(user=1, room=1, message="message")
    msg.save()
    msg.commit()

    file = File(owner=1, room=1, name="file.txt", localname="123.txt",
                public = True, type="text", size=5)
    file.save()
    file.commit()

    mlist = u.membership_list()
    print(mlist)
    assert mlist == {1: {'id': 1, 'name': 'room', 'owner': 1, 'public': 1, 'last_seen': 0},
                     3: {'id': 3, 'name': 'room 3', 'owner': 1, 'public': 1, 'last_seen': 0}}

    mlist2 = u.message_list()
    del mlist2[1]['written']
    print({msg.id: msg.public_fields()})

    assert mlist2 == {msg.id: msg.public_fields()}

    flist = u.file_list()
    del flist[1]['uploaded']
    assert flist == {file.id: file.public_fields()}

def test_room(setup):

    r = Room(owner=1, public=False, name="afsdfasdf")
    assert r.public == False

    assert Room.chat_name([1,2]) == "$%^&-1-2"

    u1 = User(email="dave@dave.com", handle="dave")
    u1.save()
    u1.commit()
    
    u2 = User(email="bob@dave.com", handle="bob")
    u2.save()
    u2.commit()
   
    room = Room.get_or_set_chat(1, [1,2])
    
    assert room.id     == 1
    assert room.owner  == u1.id
    assert room.name   == "$%^&-1-2"
    assert room.public == False

    assert Membership.count() == 2
    assert Room.count()       == 1

def test_card(setup):
    u1 = User(email="dave@dave.com", handle="dave")
    u1.save()
    u1.commit()
    
    r = Room(owner=1, public=True, name="room")
    r.save()
    r.commit()

    c1 = Card(owner=1, contents="card 1")
    c1.save()
    c1.commit()
    
    c2 = Card(owner=1, contents="card 2")
    c2.save()
    c2.commit()

def test_file(setup):
    with open('test_stuff/test.file.1', 'rb') as f:
        assert File.hash_file(f) ==('d41d8cd98f00b204e9800998ecf8427e',0)
    with open('test_stuff/test.file.2', 'rb') as f:
        assert File.hash_file(f) == ('372e25f23b5a8ae33c7ba203412ace30', 2) 
    with open('test_stuff/test.file.3', 'rb') as f:
        assert File.hash_file(f) == ('3aad2f9a35e581f88308c356ecbed56f', 111670)

    assert File.file_type('blah.gif')         == ('image', 'gif')
    assert File.file_type('blah.txt')         == ('text', 'txt')
    assert File.file_type('blorgle')          == ('unknown', '')
    assert File.file_type('blorgle.blorgle')  == ('unknown', 'blorgle')

    f = File(owner=1, hash="xxx", size=5)
    f.save()
    f.commit()

    assert File.hash_exists("xxx", 5).id == 1
    assert File.hash_exists("xx", 5)  == None
    assert File.hash_exists("xxx", 4) == None
    assert File.hash_exists("xx", 4)  == None
   
def test_membership(setup):
    u = User(email="dave@dave.com", handle="dave")
    u.save()
    u.commit()

    r1 = Room(owner=1, public=True, name="room")
    r1.save()
    r1.commit()

    Membership.join(1,1)
    m = Membership.get(1)
    assert m.id        == 1
    assert m.user      == 1
    assert m.last_seen == 0
    assert m.room      == 1
    assert Membership.count(user=1, room=1) == 1

    Membership.join(1,1)    # this one should quietly fail, 1,1 already exists
    assert Membership.count(user=1, room=1) == 1
