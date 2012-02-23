from google.appengine.ext import db
from base.formdb import Formdb
from datamodel.syllabusunit import SyllabusUnit

class User(Formdb):
  id_field = 'username'
  username = db.StringProperty()
  user = db.UserProperty()
  answermode = db.StringProperty()
  difficulty = db.StringProperty()
  domainType = db.StringProperty()
  language = db.StringProperty()
  questionType = db.StringProperty()
  numquestions = db.IntegerProperty(default = 9)
  syllabusUnitKeys = db.ListProperty(db.Key)