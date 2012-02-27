import wsgiref.handlers
from django.conf import settings
import os
import init

#settings._target = None
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
os.environ['AUTH_DOMAIN'] = 'test.com'

from google.appengine.ext import db
from google.appengine.ext import webapp
from datamodel.usr import User
from google.appengine.api import users
from base.form_handler import Formdb
from base.form_handler import FormHandler
from handlers.quiz import Quiz
from handlers.configure import Configure
from handlers.template import Template
from handlers.findtemplate import FindTemplate
from handlers.import_spreadsheet import ImportWords
from handlers.preferences import Preferences

class Yaksha(Formdb):
  id_field = 'app_num'
  author = db.UserProperty()

class YakshaAttachment(FormHandler):
  cls = Yaksha

  def get(self):
    self.get_attachment()

def initialize():
  init.initProblems()
  init.initTemplatesInDb()
  init.initSyllabusInDb()
  
def main():
  initialize()
  application = webapp.WSGIApplication(
                                       [
                                         ('/', Preferences),
                                         ('/quiz', Quiz),
                                         ('/configure', Configure),
                                         ('/template', Template),
                                         ('/findtemplate', FindTemplate),
                                         ('/importwords', ImportWords),
                                        ],
                                       debug=True)
  wsgiref.handlers.CGIHandler().run(application)

if __name__ == "__main__":
  main()
