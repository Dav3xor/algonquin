from db import DBTable, set_properties, build_tables
import os
import pytest

class Person(DBTable):
    attrs = {'id':      {'type': 'INTEGER PRIMARY KEY'},
             'name':    {'type': 'TEXT'},
             'age':     {'type': 'INTEGER', 'private': True}}
    table_name = 'people'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)

set_properties(Person, Person.attrs)

class Organ(DBTable):
    attrs = {'id':          {'type': 'INTEGER PRIMARY KEY'},
             'type':        {'type': 'TEXT NOT NULL'},
             'sense_organ': {'type': 'BOOLEAN'},
             'owner':       {'type': 'INTEGER NOT NULL',
                             'fkey': ['person', 'id', 'Person', 'organs']},
             'age':         {'relative': 'people'} } 
    table_name = 'organs'
    def __init__(self, **kwargs):
        DBTable.__init__(self, **kwargs)

set_properties(Organ, Organ.attrs)


@pytest.fixture()
def setup():
    DBTable.set_db('blahblahtest.db')
    build_tables([Person, Organ])
    yield 'resource'
    os.remove('blahblahtest.db')

def test_smoke_test(setup):
    p1 = Person(name='Dave', age='5')
    p1.save()
    p1.commit()

    p2 = Person.get_where(name='Dave')

    assert p2.age == 5
    assert p2.name == 'Dave'
    assert p2.id != None

def test_raw_select(setup):
    p1 = Person.raw_select('people.id = ?',
                           [1])

    assert p1 == []

    p1 = Person(name="Bob", age=2)
    p1.save()
    p1.commit()

    people = Person.raw_select('people.id = ?',
                               [1])
    print (people)
    assert people[0].name == "Bob"
    assert people[0].id   == 1
    assert people[0].age  == 2

    p2 = Person(name="Frank", age=5)
    p2.save()
    p2.commit()

    people = Person.raw_select('people.id > ?',
                               [0],
                               'people.id')
    assert len(people) == 2
    people[0].id = 1 
    people[1].id = 2 
    organ = Organ(type='eye', sense_organ=True, owner=1)
    organ.save()
    organ.commit()

    o1 = Organ.raw_select("organs.owner = people.id and people.id = ?",
                          [1],
                          "organs.id",
                          ["age"],
                          tables=[Organ, People])
    assert o1[0].age == 2

def test_child_iteration(setup):
    p1 = Person(name="Bob", age=2)
    p1.save()
    p1.commit()

    p2 = Person(name="Frank", age=2)
    p2.save()
    p2.commit()

    o1 = Organ(type='eye', sense_organ=True, owner=1)
    o1.save()
    o1.commit()
    
    o2 = Organ(type='eye', sense_organ=True, owner=2)
    o2.save()
    o2.commit()
    
    o3 = Organ(type='ear', sense_organ=True, owner=2)
    o3.save()
    o3.commit()
   
    for i in p1.organs:
        assert i.type == 'eye'
        assert i.owner == 1
    
    for i in p2.organs:
        assert i.type in ['eye', 'ear']
        assert i.owner == 2

def test_private_fields(setup):
    p1 = Person(name="Bob", age=2)
    p1.save()
    p1.commit()
    
    assert p1.is_public('name') == True
    assert p1.is_public('age') == False
    assert p1.public_fields() == {'id': 1, 'name': 'Bob'}

def test_get(setup):
    assert Person.get(1) == None

    p1 = Person(name="Bob", age=2)
    p1.save()
    p1.commit()

    assert Person.get(1).name == "Bob"

def test_get_where(setup):
    assert Person.get_where(id=1, name="Frank") == None
    assert Person.get_where(id=2, name="Bob") == None
    assert Person.get_where(id=1, name="Bob") == None

    p1 = Person(name="Bob", age=2)
    p1.save()
    p1.commit()

    assert Person.get_where(id=1, name="Frank") == None
    assert Person.get_where(id=2, name="Bob") == None
    assert Person.get_where(id=1, name="Bob").name == "Bob"

def test_get_public_where(setup):
    assert Person.get_public_where(id=1, name="Frank") == None
    assert Person.get_public_where(id=2, name="Bob") == None
    assert Person.get_public_where(id=1, name="Bob") == None

    p1 = Person(name="Bob", age=2)
    p1.save()
    p1.commit()

    assert Person.get_public_where(id=1, name="Frank") == None
    assert Person.get_public_where(id=2, name="Bob") == None
    assert Person.get_public_where(id=1, name="Bob").name == "Bob"
    assert Person.get_public_where(id=1, name="Bob").age == None

def test_delete_where(setup):
    p1 = Person(name="Bob", age=2)
    p1.save()
    p1.commit()
    p2 = Person(name="Frank", age=3)
    p2.save()
    p2.commit()
    p3 = Person(name="Billy", age=2)
    p3.save()
    p3.commit()
    p4 = Person(name="Buddy", age=2)
    p4.save()
    p4.commit()

    assert Person.get_where(id=1, name="Bob").name == "Bob"
    assert Person.get_where(id=2, name="Frank").name == "Frank"
    assert Person.get_where(id=3, name="Billy").name == "Billy"

    assert Person.count() == 4

    Person.delete_where(age=2)
    Person.commit()

    # default limit is 1
    assert Person.count() == 3

    Person.delete_where(age=2, limit = 1000)
    assert Person.count() == 1
  
    x = Person.get_where(age=2)
    assert Person.get_where(age=2) == None
    assert Person.get_where(age=3).name == "Frank"

def test_insert(setup):
    p1 = Person(age=5, name="Bob")

    assert p1.id == None

    p1.insert()

    assert p1.id == True

    with pytest.raises(Exception):
        p1.insert()
   
def test_update(setup):
    p1 = Person(age=5, name="Bob")

    assert p1.id == None

    with pytest.raises(Exception):
        p1.update()

    p1.insert()

    p1.age=6
    p1.update()

def test_count(setup):
    p1 = Person(name="Bob", age=2)
    p1.save()
    p1.commit()
    p2 = Person(name="Frank", age=3)
    p2.save()
    p2.commit()
    p3 = Person(name="Billy", age=2)
    p3.save()
    p3.commit()
    p4 = Person(name="Buddy", age=2)
    p4.save()
    p4.commit()

    assert Person.count() == 4
    assert Person.count(age=2) == 3
    assert Person.count(age=3) == 1
    assert Person.count(age=1) == 0

def test_save(setup):
    p1 = Person(name="Bob", age=5)
    p1.save()
    p1.save()
    p1.commit()
    

