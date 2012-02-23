from base.formdb import Formdb
from google.appengine.ext import db
from domain import Domain

class Variable(Formdb):
  domain = None
  name = db.StringProperty()
  lowStr = db.StringProperty()
  highStr = db.StringProperty()
  type = db.IntegerProperty()
    

  def setDomain(self, domain):
    self.domain = domain
    self.lowStr = repr(self.domain.low)
    self.highStr = repr(self.domain.high)
    self.type = self.domain.type

  def __init__(self, domain = None, **kwds):
    Formdb.__init__(self, **kwds)
    if not domain:
      self.domain = Domain(self.type, eval(self.lowStr), eval(self.highStr))
    else:
      self.setDomain(domain)
            