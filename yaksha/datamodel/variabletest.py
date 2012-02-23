from domain import Domain
from variable import Variable
import unittest
from sympy.core.numbers import Integer

class TestVariable(unittest.TestCase):
  
  def testInitWithDomain(self):
    domain = Domain(type=Domain.WHOLE_NUMBER, low=Integer(20), high=Integer(40))
    variable = Variable(name='x', domain=domain)
    self.assertEqual(domain, variable.domain)
    self.assertEqual('x', variable.name)
    
  def testInitWithDb(self):
    domain = Domain(type=Domain.WHOLE_NUMBER, low=Integer(20), high=Integer(40))
    variable = Variable(name='x', type=domain.type, lowStr=repr(domain.low), highStr=repr(domain.high))
    self.assertEqual(domain, variable.domain)
    self.assertEqual('x', variable.name)
