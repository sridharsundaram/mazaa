import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
os.environ['AUTH_DOMAIN'] = 'test.com'
os.environ['USER_EMAIL'] = 'test@test.com'
os.environ['APPLICATION_ID'] = 'yaksha'

from datamodel.usr import User
from datamodel.syllabusunit import SyllabusUnit
import unittest

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


class TestUser(unittest.TestCase):
  
  def testInitWithList(self):
    syllabusKey1 = SyllabusUnit(name="syllabus1").put()
    syllabusKey2 = SyllabusUnit(name="syllabus2").put()
    user = User(syllabusUnitKeys=[syllabusKey1,syllabusKey2], username=None)
    self.assertEqual(user.syllabusUnitKeys, [syllabusKey1,syllabusKey2])
