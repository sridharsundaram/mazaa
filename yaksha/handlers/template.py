from base.form_handler import FormHandler
from datamodel.categories import Category
from datamodel.problemtemplate import ProblemTemplate
from datamodel.variable import Variable
from datamodel.domain import ANY_DOMAIN, Domain

class Template(FormHandler):
  html_form = 'html/template_form.html'
  authorize = True
  cls = ProblemTemplate

  def get(self):
    key = self.request.params.get('_key')
    if key:
      template = ProblemTemplate.retrieve(ProblemTemplate, key)
      problemName = template.problemName
      self.variables = []
      for v in Variable.all().ancestor(template):
        varDomains = {'name': v.name, 'type': Domain.internalToExternalType(v.domain.type)}
        self.variables.append(varDomains)
    else:
      problemName = self.request.params['problemName']
      template = ProblemTemplate(problemName)
      problem = Category.allProblems[problemName]
      self.variables = []
      for v in problem.variables:
        varDomains = {'name': v.name, 'type': Domain.internalToExternalType(Domain.ANY)}
        self.variables.append(varDomains)

    self.template_values = {
      'problemName' : problemName,
      'template' : template,
      'variables': self.variables,
      'deleted': False,
      'preview': '',
    }
    FormHandler.get(self)

  def post(self):
    template = self.processPostData()
    template.put()
    key = self.request.params.get('_key')
    problemName = template.problemName
    action = self.request.params.get('action')
    if key:
      if action == 'Delete':
        for variable in Variable.all().ancestor(template):
          variable.delete()
        template.delete()
      else:
        for variable in Variable.all().ancestor(template):
          type = self.request.params.get(variable.name)
          variable.setDomain(Domain.defaultDomain(Domain.externalToInternalType(type)))
          variable.put()
    else:
      problem = Category.allProblems[problemName]
      for v in problem.variables:
        type = self.request.params.get(v.name)
        vdomain = Domain.defaultDomain(Domain.externalToInternalType(type))
        variable = Variable(name = v.name, domain = vdomain, parent = template)
        variable.put()
    self.render(template)
    
    
  # @param Formdb template - created or updated item
  def render(self, template):
    action = self.request.params.get('action')
    if template:
      if action == 'Submit' or action == 'Delete':
        self.html_form = "html/template.html"
      variables = []
      preview = ''
      if action != 'Delete':
        for v in Variable.all().ancestor(template):
          varDomains = {'name': v.name, 'type': Domain.internalToExternalType(v.domain.type)}
          variables.append(varDomains)
        defaultVarDomain = Domain.defaultDomain(Domain.WHOLE_NUMBER)
        preview = template.generateProblemStatement(defaultVarDomain, 'text', False)
      self.template_values = {
        'problemName': template.problemName,                      
        'template': template,               
        'variables': variables,
        'deleted': action == 'Delete',
        'preview': preview,               
      }
    FormHandler.render(self, template)  
