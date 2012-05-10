from base.form_handler import FormHandler
from datamodel.domain import Domain
from datamodel.problemtemplate import GenerateQuestionForModelProblems
from modelproblem import ModelProblem
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
    modelProblems = ModelProblem.findModelProblemsMatchingKnowledgeUnits(knowledgeUnits) 
    problems = []
    tags = self.request.get_all("tag")
    # Allows sub-selection of templates by matching tags.
    # At least one tag must match
    while len(problems) < user.numquestions:
      problem = GenerateQuestionForModelProblems(modelProblems, domain, tags, questionType, highlightAnswer)
      if problem:
        problems.append(problem)

    self.template_values = {
      'problems' : problems,
    }
    FormHandler.get(self)
  
