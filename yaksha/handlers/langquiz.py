from base.form_handler import FormHandler
from datamodel.word import Word
from google.appengine.api import users
from datamodel.usr import User

class LangQuiz(FormHandler):
  html_form = 'html/langquiz.html'
  authorize = True
  
  def get(self):
    current_user = users.get_current_user()
    user = User.retrieve(User, current_user.nickname())
#    session = sessions.Session(writer = "cookie")
    self.words = Word.all().fetch(1000)
    self.words = [{word.langA: word.langB} for word in self.words]
    FormHandler.get(self)
  
  def render(self, item):
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(str(self.words))
