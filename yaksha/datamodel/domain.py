from decimal import Decimal
from base.formdb import Formdb
from sympy.core.numbers import Real
from sympy.core.numbers import Integer
from sympy.core.numbers import Rational
from sympy.core.basic import S
from google.appengine.ext import db
import random

# Should we use PICTURE to specify range of a Domain e.g. S99.99 or S9999/99999 ?
class Domain:  
  WHOLE_NUMBER = 0
  INTEGER = 1
  RATIONAL = 2
  FRACTION = RATIONAL
  DECIMAL = 3
  SURD = 4
  REAL = 5
  COMPLEX = 6
  ANY = 100
  type = db.IntegerProperty()
  lowStr = db.StringProperty()
  highStr = db.StringProperty()
  
  def __init__(self, type = None, low = None, high = None):
    self.low = low
    self.high = high
    self.type = type

  # @param external type - type of the domain
  # @return domain type corresponding to external type
  @staticmethod
  def externalToInternalType(type):
    if type == u'whole':
      return Domain.WHOLE_NUMBER
    elif type == u'int':
      return Domain.INTEGER
    elif type == u'dec':
      return Domain.DECIMAL
    elif type == u'real':
      return Domain.REAL
    elif type == u'frac':
      return Domain.FRACTION
    elif type == u'any':
      return Domain.ANY
    else:
      return Domain.WHOLE_NUMBER
    
  # @param domainType - type of the domain
  # @return external type corresponding to domain type
  @staticmethod
  def internalToExternalType(domainType):
    if domainType == Domain.WHOLE_NUMBER:
      return u'whole'
    elif domainType == Domain.DECIMAL:
      return u'dec'
    elif domainType == Domain.INTEGER:
      return u'int'
    elif domainType == Domain.REAL:
      return u'real'
    elif domainType == Domain.FRACTION:
      return u'frac'
    elif domainType == Domain.ANY:
      return u'any'
    else:
      return 'whole'
    
  # @param domainType - type of the domain
  # @return a default domain for this domain type.
  # Later we should take degree of difficulty in to consideration
  @staticmethod
  def defaultDomain(domainType):
    defaultDomains = {
                      Domain.WHOLE_NUMBER: Domain(type = Domain.WHOLE_NUMBER, low = 3, high = 10),
                      Domain.INTEGER: Domain(type = Domain.INTEGER, low = 3, high = 50),
                      Domain.DECIMAL: Domain(type = Domain.DECIMAL, low = 0, high = 200),  
                      Domain.REAL: Domain(type = Domain.REAL, low = 0, high = 10000),
                      Domain.FRACTION: Domain(type = Domain.FRACTION, low = 1, high = 99),
                      Domain.ANY: ANY_DOMAIN
                    }
    return defaultDomains[domainType] if defaultDomains.has_key(domainType) else None
    
  def chooseInitializer(self):
    if self.type == Domain.WHOLE_NUMBER:
      return Integer(random.randrange(self.low, self.high))
    elif self.type == Domain.INTEGER:
      return Integer(random.randrange(self.low, self.high))
    elif self.type == Domain.REAL:
      return Real(random.uniform(self.low, self.high))
#    elif self.type == Domain.RATIONAL:
#      return Rational(repr(random.uniform(self.low, self.high)))
    elif self.type == Domain.FRACTION:
      # low, high interpreted as range of integers used
      return Rational(random.randrange(self.low, self.high), random.randrange(self.low, self.high))
    elif self.type == Domain.DECIMAL: #TODO(ss): allow more than 2 decimals
      return random.randrange(self.low, self.high) + Decimal(str(random.randrange(0,10**2)))/100

  def __add__(self, other):
    if self.type < other.type:
      return self
    elif self.type > other.type:
      return other
    else:
      return Domain(type=self.type, low=max(self.low, other.low), high=min(self.high,other.high))
    
  def __eq__(self, other):
    if not isinstance(self, Domain) or not isinstance(other, Domain):
      return False
    return self.type == other.type and self.low == other.low and self.high == other.high
  
  @staticmethod
  # @param int domain - specifies domain
  # @param Symbol value - 
  # @return true if value is consistent with domain
  def isValueInDomain(type, value):
    if type == Domain.WHOLE_NUMBER and (not value.is_integer or value < 0):
      return False
    elif type == Domain.INTEGER and not value.is_integer:
      return False
    elif type == Domain.RATIONAL and not value.is_rational:
      return False
    elif type == Domain.FRACTION and not value.is_rational:
      return False
    elif type == Domain.REAL and not value.is_real:
      return False
    return True
  
ANY_DOMAIN = Domain(type=Domain.ANY, low=0, high=0)
