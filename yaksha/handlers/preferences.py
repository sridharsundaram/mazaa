from datamodel.usr import User
from google.appengine.api import users
from base.form_handler import FormHandler
from datamodel.syllabusunit import SyllabusUnit

class Preferences(FormHandler):
  html_form = 'html/preferences.html'
  authorize = True
  

  def fetchChildren(self, parentUnit):
    childList = []
    for child in SyllabusUnit.all().filter('parentUnit', parentUnit).fetch(1000):
      name = child.name + ':' + str(child.key().id()) if child.knowledgeUnit else child.name
      childList.append(name.encode('utf-8'))
      children = self.fetchChildren(child)
      if children:
        childList.append(children)
    return childList

  def get(self):
    user = users.get_current_user()
    username = ""
    syllabus = ""
    if user:
      username = user.nickname()
      user = User.retrieve(User, username)
      root = SyllabusUnit.all().filter('name', "CBSE Mathematics 6th").fetch(1)[0]
      syllabus = self.fetchChildren(root)

    self.template_values = {
      'username' : username,                            
      'domainType' : user.domainType if hasattr(user, 'domainType') else "dec",
      'questionType': user.questionType if hasattr(user, 'questionType') else "mc",
      'answermode': user.answermode if hasattr(user, 'answermode') else "No",
      'syllabus': str(syllabus),
    }
    FormHandler.get(self)
