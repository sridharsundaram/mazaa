from base.form_handler import FormHandler
from datamodel.word import Word
import simplejson

class Vocabulary(FormHandler):
  authorize = False
  
  def get(self):
    self.jsonData = Word.all().fetch(1000)
    lang = self.request.params.get('lang')
    if lang == 'a2b':
      words = [ {'id': word.key().id(), 
                 'question': word.langA, 
                 'answer': word.langB } for word in self.jsonData]
    else:
      words = [ {'id': word.key().id(), 
                 'question': word.langB, 
                 'answer': word.langA } for word in self.jsonData]      
    self.jsonData = { "words":  words};
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps(self.jsonData))
