from datamodel.domain import Domain
from modelproblem import ModelProblem
import problems
import unittest
import random

class TestProblems(unittest.TestCase):    
  def setUp(self):
    random.seed(2)
        
  def verifyValuesEqual(self, expectedValues, variableValues):
    for v in expectedValues.keys():
      self.assertEqual(expectedValues[v], variableValues[v].value)
      
  def testDirectProportion(self):
    wholeNumberDomain = Domain(type = Domain.WHOLE_NUMBER, low = 0, high = 100)
    varDomains = {
                  problems.DirectProportionProblem.quantity1 : wholeNumberDomain, 
                  problems.DirectProportionProblem.quantity2 : wholeNumberDomain, 
                  problems.DirectProportionProblem.amount1 : wholeNumberDomain, 
                  problems.DirectProportionProblem.amount2 : wholeNumberDomain,
                  } 
    problem = problems.DirectProportionAmountProblem(varDomains)
    problem.generateProblem('mc')

    expectedAnswers = [28]
    expectedDistractors = [112, 72, 48, 22]
    expectedVariableValues = { problem.quantity1:92, 
                             problem.amount1:56, 
                             problem.quantity2:46,
                             problem.amount2: problem.variableValues[problem.amount2].value,
                             ModelProblem._ANSWERS: expectedAnswers,
                             ModelProblem._DISTRACTORS: expectedDistractors
                           }
    self.verifyValuesEqual(expectedVariableValues, problem.variableValues)
    self.assertEqual(problem.amount2, problem.unknown)

  def testDirectProportionDomains(self):
    random.seed(3)
    wholeNumberDomain = Domain(type = Domain.WHOLE_NUMBER, low = 2, high = 5)
    varDomains = {
                  problems.DirectProportionProblem.quantity1 : wholeNumberDomain, 
                  problems.DirectProportionProblem.quantity2 : wholeNumberDomain, 
                  problems.DirectProportionProblem.amount1 : wholeNumberDomain, 
                  problems.DirectProportionProblem.amount2 : wholeNumberDomain,
                  } 
    problem = problems.DirectProportionAmountProblem(varDomains)
    problem.generateProblem('mc')
    self.assertNotEqual(problem.variableValues[problem.quantity1].value, 
                        problem.variableValues[problem.quantity2].value)
      
  def testLCM(self):
    random.seed(5)
    varDomain = Domain(type = Domain.WHOLE_NUMBER, low = 0, high = 20)
    wholeNumberDomain = Domain(type = Domain.WHOLE_NUMBER, low = 0, high = 20)
    varDomains = {
                  problems.LcmProblem.num1 : wholeNumberDomain, 
                  problems.LcmProblem.num2 : wholeNumberDomain, 
                  problems.LcmProblem.lcm : wholeNumberDomain, 
                  } 
    problem = problems.LcmProblem(varDomains)
    problem.generateProblem('mc')

    expectedAnswers = [3120]
    expectedDistractors = [15, 46800, 18, 15]
    expectedVariableValues = { problem.num1:195, 
                             problem.num2:240,
                             problem.lcm: problem.variableValues[problem.lcm].value,
                             ModelProblem._ANSWERS: expectedAnswers,
                             ModelProblem._DISTRACTORS: expectedDistractors
                           }
    self.verifyValuesEqual(expectedVariableValues, problem.variableValues)
    self.assertEqual(problem.lcm, problem.unknown)
  
  def testGCD(self):
    random.seed(5)
    wholeNumberDomain = Domain(type = Domain.WHOLE_NUMBER, low = 0, high = 20)
    varDomains = {
                  problems.GcdProblem.num1 : wholeNumberDomain, 
                  problems.GcdProblem.num2 : wholeNumberDomain, 
                  problems.GcdProblem.gcd : wholeNumberDomain, 
                  } 
    problem = problems.GcdProblem(varDomains)
    problem.generateProblem('mc')

    expectedAnswers = [15]
    expectedDistractors = [3120, 46800, 18, 15]
    expectedVariableValues = { problem.num1:195, 
                             problem.num2:240,
                             problem.gcd: problem.variableValues[problem.gcd].value,
                             ModelProblem._ANSWERS: expectedAnswers,
                             ModelProblem._DISTRACTORS: expectedDistractors
                           }
    self.verifyValuesEqual(expectedVariableValues, problem.variableValues)
    self.assertEqual(problem.gcd, problem.unknown)
  
  def testBodmas(self):
    wholeNumberDomain = Domain(type = Domain.WHOLE_NUMBER, low = 0, high = 20)
    varDomains = {
                  problems.BodmasProblem.expr : wholeNumberDomain, 
                  problems.BodmasProblem.eval : wholeNumberDomain, 
                  } 
    problem = problems.BodmasProblem(varDomains)
    problem.generateProblem('mc')

    expectedAnswers = [7]
    expectedDistractors = [19, 18, 10, 8]
    expectedVariableValues = { problem.expr: '49 / (12 - 15 / (3))',
                             problem.eval: problem.variableValues[problem.eval].value,
                             ModelProblem._ANSWERS: expectedAnswers,
                             ModelProblem._DISTRACTORS: expectedDistractors
                           }
    self.verifyValuesEqual(expectedVariableValues, problem.variableValues)
    self.assertEqual(problem.eval, problem.unknown)

  def testComposedProblem(self):
    wholeNumberDomain = Domain(type = Domain.WHOLE_NUMBER, low = 0, high = 20)
    varDomains = {
                  problems.LcmGcdProblem.num1 : wholeNumberDomain, 
                  problems.LcmGcdProblem.num2 : wholeNumberDomain, 
                  problems.LcmGcdProblem.num3 : wholeNumberDomain, 
                  problems.LcmGcdProblem.lcmgcd : wholeNumberDomain, 
                  } 
    problem = problems.LcmGcdProblem(varDomains)
    problem.generateProblem('mc')

    expectedAnswers = [1]
    expectedDistractors = [12, 4, 9, 9, 15]
    expectedVariableValues = { 
                             problem.num1: 361,
                             problem.num2: 57,
                             problem.num3: 98,
                             problem.lcmgcd: 1,
                             ModelProblem._ANSWERS: expectedAnswers,
                             ModelProblem._DISTRACTORS: expectedDistractors
                           }
    self.verifyValuesEqual(expectedVariableValues, problem.variableValues)
    self.assertEqual(problem.lcmgcd, problem.unknown)

    expectedLcmSolution = { 
                             problem.lcmProblem.num1: 361,
                             problem.lcmProblem.num2: 57,
                             problem.lcmProblem.lcm: 1083,
                             ModelProblem._ANSWERS: [1083],
                             ModelProblem._DISTRACTORS: [19,20577,3,17],
                             }
    self.verifyValuesEqual(expectedLcmSolution, problem.lcmProblem.variableValues)
    self.assertEqual(problem.lcmProblem.lcm, problem.lcmProblem.unknown)
    
    expectedGcdSolution = { 
                             problem.gcdProblem.num1: 1083, 
                             problem.gcdProblem.num2: 98,
                             problem.gcdProblem.gcd: 1,
                             ModelProblem._ANSWERS: [1],
                             ModelProblem._DISTRACTORS: [106134, 106134, 12, 12],
                             }
    self.verifyValuesEqual(expectedGcdSolution, problem.gcdProblem.variableValues)
    self.assertEqual(problem.gcdProblem.gcd, problem.gcdProblem.unknown)

if __name__ == "__main__":
    unittest.main()   
 

