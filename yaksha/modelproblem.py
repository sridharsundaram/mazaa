from __future__ import division
import random
from sympy.solvers import solve
from sympy.core import Symbol
from datamodel.domain import Domain
from datamodel.value import Value

class ModelProblem:
  _DISTRACTORS = Symbol('distractors_')
  _ANSWERS = Symbol('answers_')
  
  # List of all model problem classes
  modelProblems = []
  
  # The list of variables for this model problem along with their domains.
  # Each model problem is like a lambda expression over these variables.
  varDomains = {}
  # Constraints for the problem - at the class level
  constraints = []
  # Knowledge units associated with this problem
  knowledgeUnits = []
  
  # @param varDomains dict - dict mapping from variables to their domains
  # @param list answerEquationSets - list of sets of equations corresponding to solutions to problem
  # @param list distractorEquationSets - list of sets of equations corresponding to false solutions to problem
  # @param Symbol unknown - the unknown to be solved in this problem 
  def __init__(self, varDomains, answerEquationSets, distractorEquationSets):
    self.variableValues = {}
    for var in varDomains.keys():
      self.variableValues[var] = Value(varDomains[var] + self.varDomains[var])

    # Each answer equation set is a lambda function producing a set of equations which can be 
    # used to find an answer candidate.
    # The number of equations in the set must be 1 + number of internal variables in the set
    self.answerEquationSets = answerEquationSets
    self.distractorEquationSets = distractorEquationSets
    
    # solution mapping variables to consistent values
    self.solution = {}
    # Unknown variable to be solved for. May be None to indicate that it may be randomly chosen.
    self.unknown = self.unknown if self.unknown != None else random.choice(self.varDomains.keys())
  
  # Find and return list of model problems matching the knowledge unit
  # @param str knowledgeUnits - knowledge units for which model problems to be found
  @staticmethod
  def findModelProblemsMatchingKnowledgeUnits(knowledgeUnits):
    matchingModelProblems = []
    for modelProblem in ModelProblem.modelProblems:
      match = True
      for knowledgeUnit in modelProblem.knowledgeUnits:
        match = match and knowledgeUnit in knowledgeUnits
      if match:
        matchingModelProblems.append(modelProblem)

    return matchingModelProblems
      
  # @param list ansVariables - list of variables corresponding to answers
  # @param list equationVariables - list of variables for which equations have been solved
  # @param Domain domain - domain of the answer value
  # @param list or dict solutions - solutions to the equations 
  def extractAnswers(self, ansVariables, equationVariables, domain, solutions):
    answers = []
    for ansVariable in ansVariables:
      if isinstance(solutions, list):
        idx = equationVariables.index(ansVariable)
        answer = solutions[0][idx] # TODO(ssundaram): handle multiple solutions
      else:
        answer = solutions[ansVariable]
      if not Domain.isValueInDomain(domain, answer):
        return None
      answers.append(answer)
    return answers
    
  # @param list allEquations - all equations which need to be solved together
  # @param list answerVariables - list of variables corresponding to correct answer
  # @param list distractorVaribales - list of variables corresponding to distractors
  # @return (list answers, list distractors) if solvable else None 
  def solve(self, allEquations, answerVariables, distractorVariables):
    # Collect all the variables in all the equations. Collects internal variables as well.  
    equationVariables = [x.atoms(Symbol) for x in allEquations]
    v = set()
    for s in equationVariables:
      v = v.union(s)
    equationVariables = list(v)

    solutions = solve(allEquations, equationVariables)
    if solutions == None:
      return None
    
    domain = self.variableValues[self.unknown].domain.type

    answers = self.extractAnswers(answerVariables, equationVariables, domain, solutions)
    if answers == None:
      return None
    
    distractors = self.extractAnswers(distractorVariables, equationVariables, domain, solutions)
    if distractors == None:
      return None
      
    return (answers, distractors)
    
  # @param dict variableValues - dictionary of all variables needed for this problem with Values 
  # @return dict initializers - mapping variables to their values     
  def chooseInitializers(self, variableValues):
    done = False
    while not done:
      done = True
      initializers = self.proposeInitializers(variableValues)
      values = {} # dictionary with only variables in it
      for v in initializers.keys():
        values[v] = initializers[v]
      
      # check that initializers satisfy all constraints
      for c in self.constraints:
        if not c.subs(values):
          done = False
    
    return initializers

  # @param dict variableValues - dictionary of all variables needed for this problem with Values 
  # @return dict initializers - mapping variables to their proposed values     
  def proposeInitializers(self, variableValues):
    initializers = {}
    for v in variableValues.keys():
      if v == self.unknown:
        continue
      if variableValues[v].value == None:
        initializers[v] = variableValues[v].domain.chooseInitializer()
      else:
        initializers[v] = variableValues[v].value
      
    return initializers

  # @param lambda fn equationSet - lambda function returning current equation set to extract equations from
  # @param dict initializers - dictionary of variables and their values
  # @return (unknown, equations) extracted from equationSet after substituting initializers
  def extractEquations(self, equationSet, initializers):    
    varDict = {}
    for v in initializers.keys():
      varDict[v.name] = initializers[v]
    varDict[self.unknown.name] = unknown = Symbol(self.unknown.name, dummy=True)
    ansEquationSet = apply(equationSet, (), varDict)
    
    if isinstance(ansEquationSet, tuple):
      return (unknown, list(ansEquationSet))
    else:
      return (unknown, [ansEquationSet])

  # @param dict variableValues - map from variables to values
  # @return ModelProblem subProblem if exists else None 
  def getSubProblem(self, variableValues):
    for v in variableValues.keys():
      if variableValues[v].value == None and variableValues[v].binding != None:
        (subProblem, _) = variableValues[v].binding
        if not subProblem.variableValues.has_key(subProblem.unknown) or subProblem.variableValues[subProblem.unknown].value == None:
          return subProblem
    return None
    
  # @param questionType - mc for multiple choice, text for text entry
  # variableValues - dict of variableValues mapping variables to values
  def generateProblem(self, questionType = 'mc'):
    if self.variableValues.has_key(self.unknown) and self.variableValues[self.unknown].value != None:
      return
    
    variableValues = self.variableValues.copy()
    subProblem = self.getSubProblem(variableValues)
    while subProblem != None:
      if not subProblem.variableValues.has_key(subProblem.unknown) or subProblem.variableValues[subProblem.unknown].value == None:
        subProblem.generateProblem(questionType)
        subProblem = self.getSubProblem(variableValues)
    
    # Try different initializations and solve, with domain constraints.
    choices = None
    while choices == None:
      for x in variableValues.keys():
        if variableValues[x].value == None and variableValues[x].binding != None:
          (subProblem, var) = variableValues[x].binding
          variableValues[x].value = subProblem.variableValues[var].value

      # initializers is a map from variable to initial value
      initializers = self.chooseInitializers(variableValues)
        
      # Collect all the choice equations into a big equation set, 
      # renaming answer variable
      answerVariables = []
      allEquations = []
      for equationSet in self.answerEquationSets:
        (ansVariable, equations) = self.extractEquations(equationSet, initializers)
        answerVariables.append(ansVariable)
        allEquations += equations

      distractorVariables = []
      if questionType == 'mc':
        for equationSet in self.distractorEquationSets:
          (distractorVariable, equations) = self.extractEquations(equationSet, initializers)
          distractorVariables.append(distractorVariable)
          allEquations += equations
      
      choices = self.solve(allEquations, answerVariables, distractorVariables)

    answers, distractors = choices
    numChoices = len(distractors) + len(answers)
    while numChoices < 5:
      choice = self.variableValues[self.unknown].domain.chooseInitializer()
      if choice not in answers and choice not in distractors:
        numChoices += 1
        distractors.append(choice)
    
    for v in initializers:  
      variableValues[v].value = initializers[v]

    if len(answers) > 0: # at least one answer is available
      variableValues[self.unknown].value = answers[0] # cannot handle multiple answers yet
    else:
      answers.append(variableValues[self.unknown].value)
    variableValues[self._ANSWERS] = Value(variableValues[self.unknown].domain)
    variableValues[self._ANSWERS].value = answers
    variableValues[self._DISTRACTORS] = Value(variableValues[self.unknown].domain)
    variableValues[self._DISTRACTORS].value = distractors
    self.variableValues = variableValues
