from base.form_handler import FormHandler
from datamodel.word import Word
from google.appengine.api import users
from datamodel.usr import User
from google.appengine.ext import webapp
import simplejson

class Vocabulary(webapp.RequestHandler):
  def get(self):
    current_user = users.get_current_user()
    user = User.retrieve(User, current_user.nickname())
#    session = sessions.Session(writer = "cookie")
    self.jsonData = Word.all().fetch(1000)
    self.jsonData = { "words":  [ {'id': word.key().id(), 'question': word.langA, 
                                'answer': word.langB } for word in self.words]};
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps(self.jsonData))
