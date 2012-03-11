from google.appengine.ext import db

class Word(db.Model):
  langA = db.StringProperty()
  langB = db.StringProperty()
