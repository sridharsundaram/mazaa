from domain import Domain
import unittest
import math
from sympy.core.numbers import Real
from sympy.core.numbers import Integer
from sympy.core.numbers import Rational
from sympy import S

class TestDomain(unittest.TestCase):
  
  def testWholeNumber(self):
    self.assertTrue(Domain.isValueInDomain(Domain.WHOLE_NUMBER, S.Zero))
    self.assertFalse(Domain.isValueInDomain(Domain.WHOLE_NUMBER, -S.One))

  def testInteger(self):
    self.assertTrue(Domain.isValueInDomain(Domain.INTEGER, S.Zero))
    self.assertFalse(Domain.isValueInDomain(Domain.INTEGER, Rational(3,5)))

  def testFraction(self):
    self.assertTrue(Domain.isValueInDomain(Domain.FRACTION, S.Zero))
    self.assertTrue(Domain.isValueInDomain(Domain.FRACTION, Rational(3,5)))
    self.assertFalse(Domain.isValueInDomain(Domain.FRACTION, S.Pi))

  def testReal(self):
    self.assertTrue(Domain.isValueInDomain(Domain.REAL, S.Zero))
    self.assertTrue(Domain.isValueInDomain(Domain.REAL, Rational(3,5)))
    self.assertTrue(Domain.isValueInDomain(Domain.REAL, S.Pi))
    self.assertFalse(Domain.isValueInDomain(Domain.REAL, S.ImaginaryUnit))    
    
  def testChooseInitializer_Integer(self):
    domain = Domain(type=Domain.WHOLE_NUMBER, low=Integer(20), high=Integer(40))
    initializer = domain.chooseInitializer()
    self.assertTrue(initializer.is_integer)
    self.assertTrue(initializer >= domain.low)
    self.assertTrue(initializer <= domain.high)
    
  def testChooseInitializer_Real(self):
    domain = Domain(type=Domain.REAL, low=Real(20), high=Real(40))
    initializer = domain.chooseInitializer()
    self.assertTrue(initializer.is_real)
    self.assertTrue(initializer >= domain.low)
    self.assertTrue(initializer <= domain.high)
  """    
  def testChooseInitializer_Rational(self):
    domain = Domain(Domain.RATIONAL, Rational(1,2), Rational(23,25))
    initializer = domain.chooseInitializer()
    self.assertTrue(initializer.is_rational)
    self.assertTrue(initializer >= domain.low)
    self.assertTrue(initializer <= domain.high)
  """    
  def testChooseInitializer_Fraction(self):
    domain = Domain(type=Domain.FRACTION, low=-23, high=435)
    initializer = domain.chooseInitializer()
    self.assertTrue(initializer.is_rational)
    self.assertTrue(initializer >= Rational(domain.low, domain.high))
    self.assertTrue(initializer <= abs(Rational(domain.high, domain.low)))
    
  def testEqual(self):
    domain1 = Domain(type=Domain.INTEGER, low=1, high=300)
    self.assertEqual(domain1, domain1)
    self.assertNotEqual(domain1, "string")
    self.assertNotEqual(2, domain1)
    domain2 = Domain(type=Domain.INTEGER, low=1, high=300)
    self.assertEqual(domain1, domain2)
    domain3 = Domain(type=Domain.INTEGER, low=2, high=300)
    self.assertNotEqual(domain1, domain3)
    domain3 = Domain(type=Domain.INTEGER, low=1, high=301)
    self.assertNotEqual(domain1, domain3)
    domain3 = Domain(type=Domain.WHOLE_NUMBER, low=1, high=300)
    self.assertNotEqual(domain1, domain3)

  def testAdd(self):
    domain1 = Domain(type=Domain.FRACTION, low=-23, high=435)
    domain2 = Domain(type=Domain.INTEGER, low=1, high=500)
    self.assertEqual(domain2, domain1 + domain2)
    self.assertEqual(domain2, domain2 + domain1)
    self.assertEqual(domain1, domain1 + domain1)
    domain3 = Domain(type=Domain.INTEGER, low=2, high=600)
    self.assertEqual(Domain(type=Domain.INTEGER, low=2, high=500), domain2 + domain3)
    domain3 = Domain(type=Domain.INTEGER, low=0, high=500)
    self.assertEqual(Domain(type=Domain.INTEGER, low=1, high=500), domain2 + domain3)
    domain3 = Domain(type=Domain.INTEGER, low=2, high=400)
    self.assertEqual(Domain(type=Domain.INTEGER, low=2, high=400), domain2 + domain3)                                                                    