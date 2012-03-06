from base.form_handler import FormHandler
from datamodel.word import Word
from google.appengine.api import users
from datamodel.usr import User
from google.appengine.ext import webapp
import simplejson

class Lesson1Data(webapp.RequestHandler):
  def get(self):
    current_user = users.get_current_user()
    user = User.retrieve(User, current_user.nickname())
#    session = sessions.Session(writer = "cookie")
    self.jsonData = {'allsounds' : [ 
                       {'id': '1', 'question': "ATM.mp3", 'answer': "ATM.jpg"},
                       {'id': '2', 'question': "auto.mp3", 'answer': "auto.jpg"},
                       {'id': '3', 'question': "cooldrink.mp3", 'answer': "cooldrink.jpg"},
                       {'id': '4', 'question': "doctor.mp3", 'answer': "doctor.jpg"},
                       {'id': '5', 'question': "hospital.mp3", 'answer': "hospital.jpg"},
                       {'id': '6', 'question': "large.mp3", 'answer': "large.jpg"},
                       {'id': '7', 'question': "shirt.mp3", 'answer': "shirt.jpg"},
                       {'id': '8', 'question': "small.mp3", 'answer': "small.jpg"},
                       {'id': '9', 'question': "talk.mp3", 'answer': "talk.jpg"},
                       {'id': '10', 'question': "time.mp3", 'answer': "time.jpg"}] }
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps(self.jsonData))
