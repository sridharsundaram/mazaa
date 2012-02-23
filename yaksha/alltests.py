import os
 
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
os.environ['AUTH_DOMAIN'] = 'test.com'
os.environ['USER_EMAIL'] = 'test@test.com'
os.environ['APPLICATION_ID'] = 'yaksha'
"""
from datamodel.domaintest import *
from datamodel.variabletest import *
from datamodel.usrtest import *
from datamodel.syllabusunittest import *
from datamodel.problemtemplatetest import *
"""
from datamodel.alltests import runTest
from modelproblemtest import *
from problemstest import *

import unittest

if __name__ == "__main__":
  runTest()
  unittest.main()
