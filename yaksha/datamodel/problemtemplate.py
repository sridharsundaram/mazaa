import random
from modelproblem import ModelProblem
from domain import Domain
from categories import Category
from google.appengine.ext import db
from base.formdb import FormPolydb
from variable import Variable
from sympy.core import Symbol

class ProblemTemplate(FormPolydb):
  problemName = db.StringProperty()
  body = db.StringProperty()
  author = db.UserProperty(auto_current_user_add=True)
  created = db.DateTimeProperty(auto_now_add = True)
  tags = db.StringListProperty()
  # dictionary mapping from variable name to its domain
  varDomains = {}
  _DISTRACTORS = ModelProblem._DISTRACTORS.name
  _ANSWERS = ModelProblem._ANSWERS.name

  # @param string modelProblemClassName - name of ModelProblemClass for this template
  # @param string body - String corresponding to body
  # @param dict varDomainss - dictionary of domain per variable due to template limitations
  def __init__(self, varDomains = None, **kwds):
    FormPolydb.__init__(self, **kwds)
    self.varDomains = varDomains

  # @param Domain defaultVarDomain - default domain of the problem variables
  # @param string questionType - mc for multiple choice, text for enter text
  # @param bool highlightAnswer - true if answer is to be highlighted
  # @param format - html, text
  def generateProblemStatement(self, defaultVarDomain, questionType, highlightAnswer, format):
    if not self.varDomains:
      variables = Variable.all().ancestor(self)
      self.varDomains = {}
      for v in variables:
        self.varDomains[Symbol(v.name)] = v.domain + defaultVarDomain
    else:
      for v in self.varDomains.keys():
        self.varDomains[v] += defaultVarDomain

    modelProblemClass = Category.allProblems[self.problemName]
    modelProblem = modelProblemClass(self.varDomains)
    modelProblem.generateProblem(questionType)

    name2Value = {}
    for x in modelProblem.variableValues.keys():
      name2Value[x.name] = modelProblem.variableValues[x].value

    name2Value[modelProblem.unknown.name] = '?'
    
    distractors = name2Value[self._DISTRACTORS]
    answers = name2Value[self._ANSWERS]
    body = self.renderBody(name2Value)      
    answerForm = self.renderAnswers(answers, distractors, modelProblem, modelProblem.unknown, questionType, highlightAnswer, format)
    return body + answerForm

  # @param ModelProblem modelProblem - problem being generated
  # @param Symbol unknown - the unknown for which problem is being generated
  # @param answer - value of the unknown variable
  def formatAnswer(self, modelProblem, unknown, answer):
    variableValues = modelProblem.variableValues
    if variableValues[unknown].domain.type == Domain.DECIMAL:
      return "%0.2f" % answer
    else:
      return str(answer)

  # @param list answers - list of answers to problem
  # @param list distractors - list of distractors i.e. wrong answers for problem
  # @param ModelProblem modelProblem - problem being generated
  # @param Symbol unknown - the unknown for which problem is being generated
  # @param str questonType - mc | text
  # @param bool highlightAnswer - whether answer is to be highlighted
  # @param str format text | html
  def renderAnswers(self, answers, distractors,  modelProblem, unknown, questionType, highlightAnswer, format):
    choiceList = []
    if answers != None:
      for answer in answers:
        ans = self.formatAnswer(modelProblem, unknown, answer)
        choiceList.append({'text': ans, 'highlight': highlightAnswer})
    if distractors != None:
      for d in distractors:
        choiceList.append({'text': str(d), 'highlight': False})

    random.shuffle(choiceList)
    
    # choose the template for rendering the choices and answers
    if questionType == 'mc' and format == 'html':
      qaTemplate = "<ol type='a'> {% for choice in choiceList %}\n<li>{% if choice.highlight %}<span style='color:red'>{{choice.text}}</span>{% else %}{{choice.text}}{% endif %}</li>\n {% endfor %} </ol>"
    elif questionType == 'text' and format == 'html':
      qaTemplate = "<br>Ans:  {% for choice in choiceList %}\n{% if choice.highlight %}{{choice.text}} {% endif %}\n {% endfor %}"
    elif questionType =='mc' and format == 'text':
      qaTemplate = "{% for choice in choiceList %}\n{% if choice.highlight %}Ans:{% endif %}{{choice.text}}{% endfor %}"
    elif questionType =='text' and format =='text':
      qaTemplate = "\nAns:  {% for choice in choiceList %}{% if choice.highlight %}{{choice.text}} {% endif %}{% endfor %}"

    from django.template import Context, Template
    t = Template(qaTemplate)
    c = Context({ 'choiceList': choiceList})
    choices = t.render(c)
    return choices

  # @param dict name2Value - dictionary containing parameter values
  # @param Symbol unknown - the unknown for which problem is being gnerated
  # @param bool highlightAnswer - whether answer is to be highlighted
  def renderBody(self, name2Value):
    from django.template import Context, Template
    t = Template(self.body)
    c = Context(name2Value)
    body = t.render(c)
    return body

# @param category - which category to choose problem from
# @param domain - domain to impose on variables in the problem
# @param tags - list of string tags - at least one must match the template if present.
# @param questionType - the type of question - None/mc for multiple choice, text for text entry 
# @param highlightAnswer - true if answer should be displayed
def GenerateQuestionForCategory(category, domain, tags, questionType, highlightAnswer):
  """
    choose model problems for this category and generate question + answers
  """
  return GenerateQuestionForModelProblems(category.modelProblems, domain, questionType, highlightAnswer)

# @param modelProblems - modelProblems which can be used
# @param domain - domain to impose on variables in the problem
# @param tags - list of string tags - at least one must match the template if present.
# @param questionType - the type of question - None/mc for multiple choice, text for text entry 
# @param highlightAnswer - true if answer should be displayed
# @param format - html, text
def GenerateQuestionForModelProblems(modelProblems, domain, tags, questionType, highlightAnswer, format):
  """
    choose a model problem from among the many.
    choose a language template for this model problem.
    choose a variable to fix as answer for model problem.
    generate initializers for remaining variables.
    solve equations of model problem to generate values of all variables and multiple choice answers and correct answers. (Ignore probability of selection for now)
    Use generated values of variables and answers to instantiate language template and generate verbal problem.
  """
  if len(modelProblems) == 0:
    return None;
  
  modelProblem = random.choice(modelProblems)
  templateQuery = ProblemTemplate.all().filter('problemName = ', modelProblem.__name__)
  if len(tags) > 0:
    templateQuery = templateQuery.filter('tags IN ', tags)
  templateList = templateQuery.fetch(100)
  if len(templateList) == 0:
    return None
  template = random.choice(templateList)
  
  return template.generateProblemStatement(domain, questionType, highlightAnswer, format)
