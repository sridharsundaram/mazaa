import os
 
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
os.environ['AUTH_DOMAIN'] = 'test.com'
os.environ['USER_EMAIL'] = 'test@test.com'
os.environ['APPLICATION_ID'] = 'yaksha'

from domain import Domain
from syllabusunit import SyllabusUnit
import unittest
from google.appengine.ext import db

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

class TestSyllabusUnit(unittest.TestCase):
  
  def testInit(self):
    syllabusUnit = SyllabusUnit(name='syllabus unit', domainType=Domain.WHOLE_NUMBER)
    self.assertEqual(Domain.WHOLE_NUMBER, syllabusUnit.domainType)
    self.assertEqual('syllabus unit', syllabusUnit.name)
    
  def assertEquivalent(self, syllabusUnit1, syllabusUnit2):
    self.assertEquals(syllabusUnit1.name, syllabusUnit2.name)
    self.assertEquals(syllabusUnit1.knowledgeUnit, syllabusUnit2.knowledgeUnit)
    self.assertEquals(syllabusUnit1.degreeOfDifficulty, syllabusUnit2.degreeOfDifficulty)
    self.assertEquals(syllabusUnit1.domainType, syllabusUnit2.domainType)
    
  def testSaveSyllabusUnit(self):
    
    # Basic test - no parent, no dict, no children
    unit1 = SyllabusUnit.saveSyllabusUnit(None, "syllabus", [])
    unit1s = db.get(unit1.key())
    self.assertEquals(unit1s.parentUnit, None)
    self.assertEquals(unit1s.name, "syllabus")
    self.assertEquals(unit1s.domainType, None)
    self.assertEquals(unit1s.knowledgeUnit, None)
    self.assertEquals(unit1s.degreeOfDifficulty, None)
    
    # no parent, dict, no children
    syllabusUnitDict = {'name':"syllabus", 
      'knowledgeUnit':"KnowledgeUnit", 
      'degreeOfDifficulty':1, 
      'domainType':Domain.WHOLE_NUMBER}
    unit2 = SyllabusUnit.saveSyllabusUnit(None, syllabusUnitDict, [])
    unit2s = db.get(unit2.key())
    self.assertEquals(unit2s.parentUnit, None)
    self.assertEquals(unit2s.name, "syllabus")
    self.assertEquals(unit2s.domainType, Domain.WHOLE_NUMBER)
    self.assertEquals(unit2s.knowledgeUnit, "KnowledgeUnit")
    self.assertEquals(unit2s.degreeOfDifficulty, 1)
    
    # parent, no dict, no children
    unit3 = SyllabusUnit.saveSyllabusUnit(unit2, "syllabus", [])
    unit3s = db.get(unit3.key())
    self.assertEquivalent(unit3s.parentUnit, unit2)
    self.assertEquals(unit3s.name, "syllabus")
    self.assertEquals(unit3s.domainType, unit2.domainType)
    self.assertEquals(unit3s.knowledgeUnit, None)
    self.assertEquals(unit3s.degreeOfDifficulty, unit2.degreeOfDifficulty)
    
    # parent, dict, no children
    unit5 = SyllabusUnit.saveSyllabusUnit(unit2, {'name': "syllabus"}, [])
    unit5s = db.get(unit5.key())
    self.assertEquivalent(unit5s.parentUnit, unit2)
    self.assertEquals(unit5s.name, "syllabus")
    self.assertEquals(unit5s.domainType, unit2.domainType)
    self.assertEquals(unit5s.knowledgeUnit, None)
    self.assertEquals(unit5s.degreeOfDifficulty, unit2.degreeOfDifficulty)
    
    # no parent, dict, children which inherit parent domain, difficulty but not knowledge unit
    syllabusUnitDict['name'] = 'syllabus4'
    unit4 = SyllabusUnit.saveSyllabusUnit(None, syllabusUnitDict, ["child0", "child1"])
    unit4s = db.get(unit4.key())
    self.assertEquals(unit4s.parentUnit, None)
    self.assertEquals(unit4s.name, "syllabus4")
    self.assertEquals(unit4s.domainType, Domain.WHOLE_NUMBER)
    self.assertEquals(unit4s.knowledgeUnit, "KnowledgeUnit")
    self.assertEquals(unit4s.degreeOfDifficulty, 1)
    
    childUnits = unit4.children.fetch(10)
    self.assertEquals(2, len(childUnits))

    for child in childUnits:
      self.assertEquivalent(child.parentUnit, unit4)
      self.assertEquals(child.domainType, Domain.WHOLE_NUMBER)
      self.assertEquals(child.knowledgeUnit, None) # not inherited
      self.assertEquals(child.degreeOfDifficulty, 1)

    self.assertEquals(childUnits[0].name, "child0")
    self.assertEquals(childUnits[1].name, "child1")
