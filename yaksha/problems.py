from datamodel.domain import Domain, ANY_DOMAIN
from modelproblem import ModelProblem
from sympy.core import Symbol, numbers
from sympy import symbols, ilcm, igcd
import random

# Direct Proportion
class DirectProportionProblem(ModelProblem):
  quantity1 = Symbol('quantity1')
  amount1 = Symbol('amount1')
  quantity2 = Symbol('quantity2')
  amount2 = Symbol('amount2')
  varDomains = {quantity1: ANY_DOMAIN, 
                amount1: ANY_DOMAIN, 
                quantity2: ANY_DOMAIN, 
                amount2: ANY_DOMAIN}
  constraints = [ quantity1 - quantity2, amount1 - amount2 ]
  knowledgeUnits = ["DirectProportion"]

  def __init__(self, varDomains):
    def answer(amount1, quantity1, amount2, quantity2):
      return amount1 * quantity2 - amount2 * quantity1
    answerEquationSets = [answer]
    def distractor(amount1, quantity1, amount2, quantity2):
      return amount1 * quantity1 - amount2 * quantity2
    distractorEquationSets = [distractor]  
    ModelProblem.__init__(self, varDomains, answerEquationSets, distractorEquationSets)  

class DirectProportionAmountProblem(DirectProportionProblem):
  unknown = DirectProportionProblem.amount2
  def __init__(self, varDomains):
    DirectProportionProblem.__init__(self, varDomains)
        
class DirectProportionQuantityProblem(DirectProportionProblem):
  unknown = DirectProportionProblem.quantity2
  def __init__(self, varDomains):
    DirectProportionProblem.__init__(self, varDomains)
        
class DirectProportionRatioProblem(DirectProportionProblem):
  unknown = None
  def __init__(self, varDomains):
    DirectProportionProblem.__init__(self, varDomains)
        
# Inverse Proportion
class InverseProportionProblem(ModelProblem):
  quantity1 = Symbol('quantity1')
  time1 = Symbol('time1')
  quantity2 = Symbol('quantity2')
  time2 = Symbol('time2')
  varDomains = {time1: ANY_DOMAIN, 
                time2: ANY_DOMAIN, 
                quantity1: ANY_DOMAIN, 
                quantity2: ANY_DOMAIN}
  constraints = [ quantity1 - quantity2, time1 - time2 ]
  knowledgeUnits = ["InverseProportion"]

  def __init__(self, varDomains):
    def answer(time1, quantity1, time2, quantity2):
      return time1 * quantity1 - time2 * quantity2
    answerEquationSets = [answer]
    def distractor(time1, quantity1, time2, quantity2):
      return time1 * quantity2 - time2 * quantity1
    distractorEquationSets = [distractor]  
    ModelProblem.__init__(self, varDomains, answerEquationSets, distractorEquationSets)  
    
class InverseProportionTimeProblem(InverseProportionProblem):
  unknown = InverseProportionProblem.time2
  def __init__(self, varDomains):
    InverseProportionProblem.__init__(self, varDomains)
        
class InverseProportionQuantityProblem(InverseProportionProblem):
  unknown = InverseProportionProblem.quantity2
  def __init__(self, varDomains):
    InverseProportionProblem.__init__(self, varDomains)
        
class InverseProportionRatioProblem(InverseProportionProblem):
  unknown = None
  def __init__(self, varDomains):
    InverseProportionProblem.__init__(self, varDomains)
        
# LCM Problem
class LcmProblem(ModelProblem):
  num1, num2, lcm = symbols('num1 num2 lcm')
  domain = Domain(type=Domain.WHOLE_NUMBER, low=2, high=10)
  varDomains = {num1: domain, num2: domain, lcm: domain}
  unknown = lcm
  constraints = [ num1 - num2 ]
  knowledgeUnits = ["Lcm"]

  def __init__(self, varDomains):
    def answer(num1, num2, lcm):
      return lcm - ilcm(num1, num2)
    answerEquationSets = [answer]
    def distractor1(num1, num2, lcm):
      return lcm - igcd(num1, num2)
    def distractor2(num1, num2, lcm):
      return lcm - num1 * num2
    distractorEquationSets = [distractor1, distractor2]
    ModelProblem.__init__(self, varDomains, answerEquationSets, distractorEquationSets)      

  def proposeInitializers(self, variableValues):
    m1 = self.domain.chooseInitializer()
    m2 = self.domain.chooseInitializer()
    m3 = self.domain.chooseInitializer()
    initializers = {}
    if variableValues[self.num1].value == None and variableValues[self.num1].binding == None:
      initializers[self.num1] = m1 * m2
    else:
      initializers[self.num1] = variableValues[self.num1].value
    if variableValues[self.num2].value == None and variableValues[self.num2].binding == None:
      initializers[self.num2] = m2 * m3
    else:
      initializers[self.num2] = variableValues[self.num2].value
    return initializers

# GCD Problem
class GcdProblem(ModelProblem):
  num1, num2, gcd = symbols('num1 num2 gcd')
  unknown = gcd
  domain = Domain(type=Domain.WHOLE_NUMBER, low=2, high=10)
  varDomains = {num1: domain, num2: domain, gcd: domain}
  constraints = [ num1 - num2 ]
  knowledgeUnits = ["Gcd"]

  def __init__(self, varDomains):
    def answer(num1, num2, gcd):
      return gcd - igcd(num1, num2)
    answerEquationSets = [answer]
    def distractor1(num1, num2, gcd):
      return gcd - ilcm(num1, num2)
    def distractor2(num1, num2, gcd):
      return gcd - num1 * num2
    distractorEquationSets = [distractor1, distractor2]
    ModelProblem.__init__(self, varDomains, answerEquationSets, distractorEquationSets)

  def proposeInitializers(self, variableValues):
    m1 = self.domain.chooseInitializer()
    m2 = self.domain.chooseInitializer()
    m3 = self.domain.chooseInitializer()
    initializers = {}
    if variableValues[self.num1].value == None and variableValues[self.num1].binding == None:
      initializers[self.num1] = m1 * m2
    else:
      initializers[self.num1] = variableValues[self.num1].value
    if variableValues[self.num2].value == None and variableValues[self.num2].binding == None:
      initializers[self.num2] = m2 * m3
    else:
      initializers[self.num2] = variableValues[self.num2].value
    return initializers

# Bodmas - construct an expression tree
class BodmasProblem(ModelProblem):
  OPERATORS = ['+', '-', '*', '/', '(']
  expr, eval = symbols('expr eval')
  varDomains = { expr: ANY_DOMAIN, eval: ANY_DOMAIN}
  unknown = eval
  constraints = []
  knowledgeUnits = ["Bodmas"]
  
  def generateExpr(self, domain, level):
    if random.choice(range(0, level)) == 0:
      return domain.chooseInitializer()
    op = random.choice(self.OPERATORS)
    if op == '(':
      return (op, self.generateExpr(domain, level - 1))
    # Ensure we only create operations allowed in the variables domain and which are simple
    if domain.type <= Domain.DECIMAL and op == '/': 
      e2 = self.generateExpr(domain, level - 1)
      v2 = self.evalExpr(e2)
      return (op, random.randrange(2,10) * v2, ('(', e2))
    if domain.type <= Domain.DECIMAL and op == '*': 
      e2 = self.generateExpr(domain, level - 1)
      v2 = self.evalExpr(e2)
      return (op, random.randrange(2,10), e2)
    if domain.type <= Domain.WHOLE_NUMBER and op == '-': 
      e2 = self.generateExpr(domain, level - 1)
      v2 = self.evalExpr(e2)
      return (op, domain.chooseInitializer() + v2, e2)
    return (op, self.generateExpr(domain, level - 1), self.generateExpr(domain, level - 1))
  
  def evalExpr(self, expr):
    if not isinstance(expr, tuple):
      return expr
    
    if len(expr) == 2: # corresponds to op being (
      _, e1 = expr
      return self.evalExpr(e1)

    op, e1, e2 = expr
    val1 = self.evalExpr(e1)
    val2 = self.evalExpr(e2)
    if op == '+':
      return val1 + val2
    elif op == '-':
      return val1 - val2
    elif op == '*' or op == 'of':
      return val1 * val2
    elif op == '/':
      return val1 / val2       
    
  def __init__(self, varDomains):
    def answer(expr, eval):
      return self.evalExpr(expr) - eval
    distractorEquationSets = []
    answerEquationSets = [answer]
    ModelProblem.__init__(self, varDomains, answerEquationSets, distractorEquationSets)
  
  def proposeInitializers(self, variableValues):
    bodmas = 1
    degreeOfDifficulty = 4
    while not isinstance(bodmas, tuple) or len(bodmas) <= 2: # Ensure at least one operator 
      bodmas = self.generateExpr(variableValues[self.eval].domain, degreeOfDifficulty)
    initializers = { self.expr: bodmas }
    return initializers

  def displayExpr(self, expr):
    if not isinstance(expr,tuple):
      return str(expr)
    if len(expr) == 2: # brackets
      return '(' + self.displayExpr(expr[1]) + ')'
    op, e1, e2 = expr
    return self.displayExpr(e1) + ' ' + op + ' ' + self.displayExpr(e2)

  def generateProblem(self, type = 'mc'):
    ModelProblem.generateProblem(self, type)
    self.variableValues[self.expr].value = self.displayExpr(self.variableValues[self.expr].value)
  
class LcmGcdProblem(ModelProblem):
  num1, num2, num3, lcmgcd = symbols('num1 num2 num3 lcmgcd')
  wholeNumberDomain = Domain(type=Domain.WHOLE_NUMBER, low=2, high=20)
  varDomains = {num1: wholeNumberDomain,
                num2: wholeNumberDomain,
                num3: wholeNumberDomain,
                lcmgcd: wholeNumberDomain}
  unknown = lcmgcd
  constraints = [ num1 - num2, num2 - num3, num1 - num3 ]
  knowledgeUnits = ["Lcm", "Gcd"]
  
  def generateProblem(self, type = 'mc'):
    self.variableValues[self.num1].binding = (self.lcmProblem, self.lcmProblem.num1)
    self.variableValues[self.num2].binding = (self.lcmProblem, self.lcmProblem.num2)
    self.variableValues[self.num3].binding = (self.gcdProblem, self.gcdProblem.num2)
    self.gcdProblem.variableValues[self.gcdProblem.num1].binding = (self.lcmProblem, self.lcmProblem.lcm)                                    
    self.variableValues[self.lcmgcd].binding = (self.gcdProblem, self.gcdProblem.gcd)
    return ModelProblem.generateProblem(self, type)
  
  def __init__(self, varDomains):
    lcmVarDomains = {
                     LcmProblem.num1 : varDomains[self.num1] + self.varDomains[self.num1],
                     LcmProblem.num2 : varDomains[self.num2] + self.varDomains[self.num2],
                     LcmProblem.lcm : LcmProblem.varDomains[LcmProblem.lcm],
                     }
    self.lcmProblem = LcmProblem(lcmVarDomains)
    
    gcdVarDomains = { 
                     GcdProblem.num1 : LcmProblem.varDomains[LcmProblem.lcm], 
                     GcdProblem.num2 : varDomains[self.num3] + self.varDomains[self.num3] ,
                     GcdProblem.gcd : self.varDomains[self.lcmgcd],
                     }
    self.gcdProblem = GcdProblem(gcdVarDomains)
    answerEquationSets = []
    ModelProblem.__init__(self, varDomains, answerEquationSets, [])      
    
#answerEquationSets = [lambda primeFactors, num: primeFactors - numbers.factor_trial_division(num)]
