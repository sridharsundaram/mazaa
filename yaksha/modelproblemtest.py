import os
 
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
os.environ['AUTH_DOMAIN'] = 'test.com'
os.environ['USER_EMAIL'] = 'test@test.com'
os.environ['APPLICATION_ID'] = 'yaksha'

import init
from datamodel.domain import Domain
import datamodel.problemtemplate as pt
import unittest
from sympy.core.numbers import Integer
import random
from sympy.core import symbols
from datamodel.domain import ANY_DOMAIN
from datamodel.variable import Variable

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


class TestModelProblem(unittest.TestCase):    

  def setUp(self):
    random.seed(2)
    # Django settings
    from django.conf import settings
    settings._target = None
    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
        
    body = 'This is a {{quantity1}} and a {{amount1}} and a {{quantity2}} and {{amount2}}'
    self.varDomains = {}
    for sym in symbols('quantity1 amount1 quantity2 amount2'):
      self.varDomains[sym] = ANY_DOMAIN
                
    self.dpTemplate = pt.ProblemTemplate(problemName="DirectProportionAmountProblem", body=body, author=None, varDomains=self.varDomains)
    init.initProblems()
    
  def testGenerateProblemStatement_withoutUnknown(self):
    varDomain = Domain(type=Domain.WHOLE_NUMBER, low=Integer(0), high=Integer(100))      
    problem = self.dpTemplate.generateProblemStatement(varDomain, 'mc', False)
    expected = ["This is a 5 and a 94 and a 95 and ?<ol type='a'><li>1786</li><li>73</li><li>66</li><li>83</li><li>8</li></ol>"]
    self.assertEqual(expected, [problem])
  
  def testGenerateProblemStatement_withUnknown(self):
    body = 'Ram buys {{quantity1}} apples for Rupees {{amount1}}. {{quantity2}} apples will cost Rupees {{amount2}}.'

    template = pt.ProblemTemplate(problemName="DirectProportionRatioProblem", body=body, author=None, varDomains=self.varDomains)
    varDomain = Domain(type=Domain.WHOLE_NUMBER, low=Integer(0), high=Integer(100))
    problem = template.generateProblemStatement(varDomain, 'mc', False)
    expected = ["Ram buys ? apples for Rupees 32. 23 apples will cost Rupees 2.<ol type='a'><li>67</li><li>13</li><li>51</li><li>99</li><li>368</li></ol>"]
    self.assertEqual(expected, [problem])
  
  def testGenerateQuestion(self):
    varDomain = Domain(type=Domain.WHOLE_NUMBER, low=Integer(0), high=Integer(100)) 
    template = pt.ProblemTemplate(problemName = "DirectProportionRatioProblem", 
                               body = "This is a {{amount1}} and a {{quantity1}} and a {{amount2}} and {{quantity2}}",
                               author = None, varDomains = self.varDomains)
    template.put()
    for var in self.varDomains.keys():
      v = Variable(name=var.name, domain=self.varDomains[var], parent=template)
      v.put()
      
    p = pt.GenerateQuestion(init.directProportionCategory, varDomain, 'mc', False)
    variables = Variable.all().ancestor(template)
    for v in variables:
      v.delete()
    template.delete()
    self.assertEqual(p, "This is a 30 and a 60 and a 66 and ?<ol type='a'><li>132</li><li>43</li><li>15</li><li>58</li><li>60</li></ol>")
  
if __name__ == "__main__":
    unittest.main()   
 

