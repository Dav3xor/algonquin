import db

u = db.User(email='Dav3xor@gmail.com', handle="Dav3xor")
u.set_password('235quanto')
u.save()

r = db.Room(owner=1, name="0-day-warez")
r.save()

m = db.Membership(user=1, room=1)
m.save()

m.commit()
