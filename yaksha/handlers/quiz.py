from base.form_handler import FormHandler
from datamodel.categories import Category
import random
from datamodel.domain import Domain
from datamodel.problemtemplate import GenerateQuestion
from appengine_utilities import sessions
from google.appengine.api import users
from datamodel.usr import User
from google.appengine.ext import db

class Quiz(FormHandler):
  html_form = 'html/quiz.html'
  authorize = True
  
  def get(self):
    current_user = users.get_current_user()
    user = User.retrieve(User, current_user.nickname())
#    session = sessions.Session(writer = "cookie")
    domainType = user.domainType
    questionType = user.questionType
    highlightAnswer = user.answermode
    domain = Domain.defaultDomain(Domain.externalToInternalType(domainType))
    syllabusUnits = db.get(user.syllabusUnitKeys)
    knowledgeUnits = [s.knowledgeUnit for s in syllabusUnits]

    problems = []
    while len(problems) < user.numquestions:
      category = random.choice(Category.allCategories)
      problem = GenerateQuestion(category, domain, questionType, highlightAnswer)
      if problem:
        problems.append(problem)

    self.template_values = {
      'problems' : problems,
    }
    FormHandler.get(self)
  
