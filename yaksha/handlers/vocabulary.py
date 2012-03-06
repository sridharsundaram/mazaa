from datamodel.word import Word
from google.appengine.ext import webapp
import simplejson

class Vocabulary(webapp.RequestHandler):
  authorize = False
  
  def get(self):
    self.jsonData = Word.all().fetch(1000)
    self.jsonData = { "words":  [ {'id': word.key().id(), 'question': word.langA, 
                                'answer': word.langB } for word in self.jsonData]};
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps(self.jsonData))
