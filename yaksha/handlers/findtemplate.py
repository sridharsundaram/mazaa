from base.form_handler import FormHandler
from datamodel.categories import Category
from datamodel.problemtemplate import ProblemTemplate

class FindTemplate(FormHandler):
  html_form = 'html/findtemplate.html'
  authorize = True
  cls = ProblemTemplate
  
  def get(self):
    problems = Category.allProblems.keys()
    problemName = self.request.params.get('problemName')
    if problemName:
      problem = Category.allProblems[problemName]
      variableList = [v.name for v in problem.variables]
      templateList = ProblemTemplate.all().filter("problemName = ", problemName)
    else:
      variableList = []
      templateList = []

    self.template_values = {
      'problems' : problems,
      'problemName' : problemName,
      'variables': str(variableList),
      'templates': templateList,
    }
    FormHandler.get(self)
    
  def post(self):
    self.get()
  
