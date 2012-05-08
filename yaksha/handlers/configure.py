from base.form_handler import FormHandler
from appengine_utilities import sessions
from datamodel.usr import User
from google.appengine.api import users
from google.appengine.ext.db import Key
from google.appengine.ext import db

class Configure(FormHandler):
  html_form = 'html/configured.html'
  cls = User
  authorize = True
  
  def __init__(self):
    FormHandler.__init__(self)
    self.user = users.get_current_user()
    self.template_values = {'username': self.user.nickname()}
  
  def render(self, item):
#    session = sessions.Session(writer="cookie")
#    session["domain"] = self.request.params['domain'] if self.request.params.has_key('domain') else "int"
#    session["type"] = self.request.params['type'] if self.request.params.has_key('type') else 'mc'
#    session["answer"] = self.request.params.has_key('answer')
    user = item if item else User.retrieve(User, self.user.nickname())
    domains = { 'whole': 'Whole Numbers', 'dec': 'Decimals', 'int': 'Integers', 'frac': 'Fractions'}
    syllabusUnits = db.get(user.syllabusUnitKeys)
    syllabusItems = [s.name for s in syllabusUnits]
    self.template_values = {
      'username' : self.user.nickname(),                            
      'domainType' : domains[user.domainType],
      'questionType': "Multiple Choice" if user.questionType == "mc" else "Text",
      'numquestions': user.numquestions,
      'answermode': "Show Answers" if "on" == user.answermode else "Do not show answers",
      'syllabusUnits': syllabusItems,
    }
    FormHandler.render(self, item)

  def post(self):
    user = self.processPostData()
    syllabusUnitIds = self.request.get_all('keys')
    syllabusUnitKeys = [Key.from_path('SyllabusUnit', int(iid)) for iid in syllabusUnitIds]
    user.syllabusUnitKeys = syllabusUnitKeys
    user.put()
    self.render(user)  