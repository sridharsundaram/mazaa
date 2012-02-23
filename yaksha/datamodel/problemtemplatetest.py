import os
 
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
os.environ['AUTH_DOMAIN'] = 'test.com'
os.environ['USER_EMAIL'] = 'test@test.com'
os.environ['APPLICATION_ID'] = 'yaksha'

import random
from domain import Domain
from problemtemplate import ProblemTemplate
from problems import BodmasProblem, LcmProblem, DirectProportionProblem
import init
import unittest
 
class TestProblemTemplate(unittest.TestCase):
  def setUp(self):
    from django.conf import settings
    settings._target = None
    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
    random.seed(2)
    self.defaultVarDomain = Domain(type=Domain.WHOLE_NUMBER, low=2, high=100)
    varDomains = {LcmProblem.num1: self.defaultVarDomain,
                      LcmProblem.num2: self.defaultVarDomain,
                      LcmProblem.lcm: self.defaultVarDomain}
    self.lcmProblem = LcmProblem(varDomains)
    bodyLcm = "Ram can run a lap in {{num1}} seconds and " + \
              "Shyam can run a lap in {{num2}} seconds. They both start together." + \
              " After how many seconds will they both meet again at the starting point?"
    self.lcmTemplate = ProblemTemplate('LcmProblem', body=bodyLcm, author=None)
    init.initProblems()

  def testGenerateProblemStatement(self):
    body = "{{amount1}}:{{quantity1}} :: {{amount2}}:{{quantity2}}"
    defaultDomain = Domain(type=Domain.FRACTION, low=1, high=99)
    varDomains = {DirectProportionProblem.amount1: self.defaultVarDomain,
                      DirectProportionProblem.amount2: self.defaultVarDomain,
                      DirectProportionProblem.quantity1: self.defaultVarDomain,
                      DirectProportionProblem.quantity2: self.defaultVarDomain}
    # override fractional ratios with integer in the template.
    template = ProblemTemplate(problemName="DirectProportionRatioProblem", 
                               body = "{{amount1}}:{{amount2}} :: {{quantity1}}:{{quantity2}}", 
                               author=None, varDomains=varDomains)
    s = template.generateProblemStatement(defaultDomain, 'text', False)
    expected = '99:72 :: ?:40'
    self.assertEquals(expected, s)
    
  def testRenderBody(self):
    s = self.lcmTemplate.renderBody({'num1': 10, 'num2': 25, 'lcm': 50})
    expected = 'Ram can run a lap in 10 seconds and Shyam can run a lap in 25 seconds. ' + \
              'They both start together. ' + \
              'After how many seconds will they both meet again at the starting point?'
    self.assertEqual(expected, s)
    
  def testRenderMultipleChoice(self):
    s = self.lcmTemplate.renderMultipleChoice([10], [20,30,40,50], self.lcmProblem, LcmProblem.lcm, False)
    expected = "<ol type='a'><li>20</li><li>30</li><li>10</li><li>40</li><li>50</li></ol>"
    self.assertEqual(expected, s)
    
  def testRenderText(self):
    s = self.lcmTemplate.renderText([10], self.lcmProblem, LcmProblem.lcm, True)
    expected = '<br/>Ans: <span style="color:red">10</span> '
    self.assertEqual(expected, s)
    
  def testRenderAnswer(self):
    s = self.lcmTemplate.renderAnswer(self.lcmProblem, LcmProblem.lcm, False, 10)
    expected = "10"
    self.assertEqual(expected, s)
    s = self.lcmTemplate.renderAnswer(self.lcmProblem, LcmProblem.lcm, True, 10)
    expected = '<span style="color:red">10</span>'
    self.assertEqual(expected, s)
    
  def testSaveTemplate(self):
    from google.appengine.api import datastore_file_stub
    from google.appengine.api import mail_stub
    from google.appengine.api import user_service_stub
    from google.appengine.api import apiproxy_stub_map 
    from google.appengine.api import urlfetch_stub 
    
    apiproxy_stub_map.apiproxy = apiproxy_stub_map.APIProxyStubMap() 
    apiproxy_stub_map.apiproxy.RegisterStub('urlfetch', urlfetch_stub.URLFetchServiceStub()) 
    apiproxy_stub_map.apiproxy.RegisterStub('user', user_service_stub.UserServiceStub())
    apiproxy_stub_map.apiproxy.RegisterStub('datastore_v3', datastore_file_stub.DatastoreFileStub('yaksha', None, None))
    apiproxy_stub_map.apiproxy.RegisterStub('mail', mail_stub.MailServiceStub())

    t = ProblemTemplate(modelProblemClassName="dummy", body="body")
    key = t.put()
    t1 = ProblemTemplate.get(key)
    self.assertEquals(t1.key(), t.key())
    self.assertEquals(t1.problemName, t.problemName)
    self.assertEquals(t1.body, t.body)
    self.assertEquals(t1.author, t.author)
    self.assertEquals(t1.created, t.created)
    t.delete()
  
if __name__ == "__main__":
  unittest.main()   
 

