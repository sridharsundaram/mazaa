from google.appengine.ext import blobstore
from google.appengine.ext import webapp
import simplejson

class Lesson2Data(webapp.RequestHandler):
  authorize = False
  
  def get(self):
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
    self.response.headers['Content-Disposition'] = "attachment; filename=l.json"
    self.response.headers['Cache-Control'] = 'max-age=3600'
    self.response.out.write(simplejson.dumps(self.jsonData))
