from base.formdb import Formdb
from google.appengine.ext import db

class Word(Formdb):
  langA = db.StringProperty()
  langB = db.StringProperty()
