from base.formdb import Formdb
from google.appengine.ext import db

class Word(Formdb):
  langA = db.StringProperty()
  langB = db.StringProperty()

  def __init__(self, langA, langB):
    Formdb.__init__(self)
    self.langA = langA
    self.langB = langB
