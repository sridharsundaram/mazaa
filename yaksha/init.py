from datamodel.categories import Category
from datamodel.problemtemplate import ProblemTemplate
from problems import *
from base.formdb import FormPolydb
from datamodel.variable import Variable
from datamodel.domain import ANY_DOMAIN
from datamodel.syllabusunit import SyllabusUnit
from datamodel.word import Word

directProportionCategory = Category(id = 1, name = "Direct Proportion")

def initProblems():
  global directProportionCategory
  ModelProblem.modelProblems.append(DirectProportionProblem)
  ModelProblem.modelProblems.append(DirectProportionAmountProblem)
  ModelProblem.modelProblems.append(DirectProportionQuantityProblem)
  ModelProblem.modelProblems.append(DirectProportionRatioProblem)
  directProportionCategory.registerProblem(DirectProportionProblem)
  directProportionCategory.registerProblem(DirectProportionAmountProblem)
  directProportionCategory.registerProblem(DirectProportionQuantityProblem)
  directProportionCategory.registerProblem(DirectProportionRatioProblem)
  
  lcmCategory = Category(id = 2, name = "Least Common Multiple")
  ModelProblem.modelProblems.append(LcmProblem)
  lcmCategory.registerProblem(LcmProblem)
  
  gcdCategory = Category(id = 3, name = "Greatest Common Divisor")
  ModelProblem.modelProblems.append(GcdProblem)
  gcdCategory.registerProblem(GcdProblem)
  
  bodmasCategory = Category(id = 4, name = "BODMAS")
  ModelProblem.modelProblems.append(BodmasProblem)
  bodmasCategory.registerProblem(BodmasProblem)
  
  inverseProportionCategory = Category(id = 5, name = "Inverse Proportion")
  ModelProblem.modelProblems.append(InverseProportionProblem)
  ModelProblem.modelProblems.append(InverseProportionTimeProblem)
  ModelProblem.modelProblems.append(InverseProportionQuantityProblem)
  ModelProblem.modelProblems.append(InverseProportionRatioProblem)
  inverseProportionCategory.registerProblem(InverseProportionProblem)
  inverseProportionCategory.registerProblem(InverseProportionTimeProblem)
  inverseProportionCategory.registerProblem(InverseProportionQuantityProblem)
  inverseProportionCategory.registerProblem(InverseProportionRatioProblem)
  
  compositionCategory = Category(id = 6, name = "Composition of Two Problems")
  ModelProblem.modelProblems.append(LcmGcdProblem)
  compositionCategory.registerProblem(LcmGcdProblem)
 
def initTemplatesInDb(force = False):
  t = ProblemTemplate.all().fetch(1)
  if t and not force:
    return
  # Delete all templates
  for template in FormPolydb.all():
    variables = Variable.all().filter("ancestor", template)
    for v in variables:
      v.delete()
    template.delete()
    
  wholeNumberDomain = Domain(type=Domain.WHOLE_NUMBER, low=2, high=30)

  # Direct Proportion
  vsooMen = ('can build','man','metre wall in','day') #amount, quantity
  bodyMenAmount = '{{quantity1}} men can build {{amount1}} metres of road in 1 day. How many metres of road can {{quantity2}} men build in 1 day?'
  key = ProblemTemplate(problemName="DirectProportionAmountProblem", body=bodyMenAmount, variables=[]).put()
  Variable(name='quantity1', domain=wholeNumberDomain, parent = key).put()
  Variable(name='quantity2', domain=wholeNumberDomain, parent = key).put()
  Variable(name='amount1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount2', domain=ANY_DOMAIN, parent = key).put()
  
  bodyMenQuantity = '{{quantity1}} men can build {{amount1}} metres of road in 1 day. How many men are needed to build {{amount2}} metres of road in 1 day?'
  key = ProblemTemplate(problemName="DirectProportionQuantityProblem", body=bodyMenQuantity, variables=[]).put()
  Variable(name='quantity1', domain=wholeNumberDomain, parent = key).put()
  Variable(name='quantity2', domain=wholeNumberDomain, parent = key).put()
  Variable(name='amount1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount2', domain=ANY_DOMAIN, parent = key).put()
  
  vsooApples = ('buys','Ram','apple for','Rupee') #quantity, amount
  bodyApplesAmount = 'Ram bought {{quantity1}} apples for Rs. {{amount1}}. How much money does he need for {{quantity2}} apples?'  
  key = ProblemTemplate(problemName="DirectProportionAmountProblem", body=bodyApplesAmount, variables=[]).put()
  Variable(name='quantity1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='quantity2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount2', domain=ANY_DOMAIN, parent = key).put()

  bodyApplesQuantity = 'Ram bought {{quantity1}} apples for Rs. {{amount1}}. How many apples can he buy for Rs. {{amount2}}?' 
  key = ProblemTemplate(problemName="DirectProportionQuantityProblem", body=bodyApplesQuantity, variables=[]).put()
  Variable(name='quantity1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='quantity2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount2', domain=ANY_DOMAIN, parent = key).put()
  
  vsooFrogs = ('can jump', 'frog','feet in','hops') #amount, q
  bodyFrogAmount = 'A frog can jump {{amount1}} feet in {{quantity1}} hops. How many feet can it jump in {{quantity2}} hops?'  
  key = ProblemTemplate(problemName="DirectProportionAmountProblem", body=bodyFrogAmount, variables=[]).put()
  Variable(name='quantity1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='quantity2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount2', domain=ANY_DOMAIN, parent = key).put()

  bodyFrogQuantity = 'A frog can jump {{amount1}} feet in {{quantity1}} hops. How many hops does it need to jump {{amount2}} feet?'  
  key = ProblemTemplate(problemName="DirectProportionQuantityProblem", body=bodyFrogQuantity, variables=[]).put()
  Variable(name='quantity1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='quantity2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount2', domain=ANY_DOMAIN, parent = key).put()
  
  bodyDirectRatio = 'If {{amount1}}:{{quantity1}}::{{amount2}}:{{quantity2}}, what is the value of ?'
  directProportionRatioTemplate = ProblemTemplate(problemName="DirectProportionRatioProblem", body=bodyDirectRatio, variables=[])
  key = directProportionRatioTemplate.put()
  Variable(name='quantity1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='quantity2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='amount2', domain=ANY_DOMAIN, parent = key).put()
  
  # Inverse Proportion
  bodyMenTime = 'If {{quantity1}} men can do a piece of work in {{time1}} hours, in how many hours will {{quantity2}} men do it?'
  key = ProblemTemplate(problemName="InverseProportionTimeProblem", body=bodyMenTime, variables=[]).put()
  Variable(name='quantity1', domain=wholeNumberDomain, parent = key).put()
  Variable(name='quantity2', domain=wholeNumberDomain, parent = key).put()
  Variable(name='time1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='time2', domain=ANY_DOMAIN, parent = key).put()

  bodyMenQuantity = 'If {{quantity1}} men can do a piece of work in {{time1}} hours, how many men can do the same piece of work in {{time2}} hours?'
  key = ProblemTemplate(problemName="InverseProportionQuantityProblem", body=bodyMenQuantity, variables=[]).put()
  Variable(name='quantity1', domain=wholeNumberDomain, parent = key).put()
  Variable(name='quantity2', domain=wholeNumberDomain, parent = key).put()
  Variable(name='time1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='time2', domain=ANY_DOMAIN, parent = key).put()
  
  bodyInverseRatio = 'If {{time1}}*{{quantity1}}={{time2}}*{{quantity2}}, what is the value of ?'
  key = ProblemTemplate(problemName="InverseProportionRatioProblem", body=bodyInverseRatio, variables=[]).put()
  Variable(name='quantity1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='quantity2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='time1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='time2', domain=ANY_DOMAIN, parent = key).put()
  
  
  bodyFrogsLcm = 'Two frogs can cover {{num1}} and {{num2}} feet respectively in each hop. They both start from the same place. After how many feet will they both reach the same place?'
  key = ProblemTemplate(problemName="LcmProblem", body=bodyFrogsLcm, variables=[]).put()
  Variable(name='num1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='num2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='lcm', domain=ANY_DOMAIN, parent = key).put()

  bodyBellsLcm = 'In a town, Church A rings the bell after every {{num1}} minutes. Church B rings the bell after every {{num2}} minutes. They ring together at 1 PM. After how many minutes will they ring together again?'
  key = ProblemTemplate(problemName="LcmProblem", body=bodyBellsLcm, variables=[]).put()
  Variable(name='num1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='num2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='lcm', domain=ANY_DOMAIN, parent = key).put()

  bodySimpleLcm = 'Find the LCM of {{num1}} and {{num2}}'
  key = ProblemTemplate(problemName="LcmProblem", body=bodySimpleLcm, variables=[]).put()
  Variable(name='num1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='num2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='lcm', domain=ANY_DOMAIN, parent = key).put()

  bodyLapsLcm = 'Ram can run a lap in {{num1}} seconds and Shyam can run a lap in {{num2}} seconds. They both start together. After how many seconds will they both meet again at the starting point?'
  lcmTemplate = ProblemTemplate(problemName="LcmProblem", body=bodyLapsLcm, variables=[])
  key = lcmTemplate.put()
  Variable(name='num1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='num2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='lcm', domain=ANY_DOMAIN, parent = key).put()
  
  bodySimpleGcd = 'Find the GCD of {{num1}} and {{num2}}'
  gcdTemplate = ProblemTemplate(problemName="GcdProblem", body=bodySimpleGcd, variables=[])
  key = gcdTemplate.put()
  Variable(name='num1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='num2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='gcd', domain=ANY_DOMAIN, parent = key).put()
  
  bodmasTemplate = ProblemTemplate(problemName="BodmasProblem", body="Simplify: {{expr}}", variables=[])
  key = bodmasTemplate.put()
  Variable(name='eval', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='expr', domain=ANY_DOMAIN, parent = key).put()
  
  bodyLcmGcd = 'Find the GCD of {{num3}} and the LCM of {{num1}} and {{num2}}'
  lcmGcdTemplate = ProblemTemplate(problemName="LcmGcdProblem", body=bodyLcmGcd, variables=[])
  key = lcmGcdTemplate.put()
  Variable(name='num1', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='num2', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='num3', domain=ANY_DOMAIN, parent = key).put()
  Variable(name='lcmgcd', domain=ANY_DOMAIN, parent = key).put()


  
def initSyllabusInDb(force = False):
  t = SyllabusUnit.all().fetch(1)
  if t and not force:
    return
  # Delete all templates
  for unit in SyllabusUnit.all():
    unit.delete()
    
  math6 = [ {'name': "Natural Numbers and Whole Numbers", 'domainType' : Domain.WHOLE_NUMBER, 'degreeOfDifficulty': 1}, 
                               [ "Face Value and Place Value", 
                                 "Place Value Chart", 
                                    [ {'name': "Indian System", 'knowledgeUnit': 'PlaceValueIndian'},
                                      {'name': "International System", 'knowledgeUnit': 'PlaceValueInternational'},
                                    ],
                                 {'name': "Whole Numbers on the Number Ray", 'knowledgeUnit': 'WholeNumbers'},
                                    [ "Smallest and Largest number",
                                      "Successor",
                                      "Predecessor",
                                      "Order Property",
                                      "Betweenness",
                                    ],
                               ],
            {'name': "Playing with Numbers", 'domainType': Domain.WHOLE_NUMBER },
                               [ {'name': "BODMAS rule", 'knowledgeUnit': "Bodmas"},
                                 {'name': "Factors and Multiples", 'knowledgeUnit': "Factors"},
                                 {'name': "Prime and Composite Numbers", 'knowledgeUnit': "PrimeNumbers"},
                                 {'name': "Tests of Divisibility", 'knowledgeUnit': "DivisibilityTests"},
                                 {'name': "Prime Factorisation", 'knowledgeUnit': "PrimeFactors"},
                                 {'name': "Highest Common Factor", 'knowledgeUnit': "Gcd"},
                                 {'name': "Lowest Common Multiple", 'knowledgeUnit': "Lcm"},                                   
                               ],
            {'name': "Operations on Whole Numbers", 'domainType': Domain.WHOLE_NUMBER },
                               [ "Properties of Addition",
                                 "Properties of Subtraction",
                                 "Properties of Multiplication",
                                 "Properties of Division",
                               ],                                   
            { 'name': "Negative Numbers and Integers", 'domainType': Domain.INTEGER },
                               [ "Ordering",
                                 "Properties of Addition",
                                 "Properties of Subtraction",
                               ],                                   
            { 'name': "Fractions", 'domainType': Domain.FRACTION },
                               [ "Proper, Improper and Mixed",
                                 "Comparison",
                                 "Addition and Subtraction",
                               ],
            { 'name': "Decimal Fractions", 'domainType': Domain.DECIMAL },
                               [ "Place Value",
                                 "Like and Unlike decimal fractions",
                                 "Conversion fraction to decimal, decimal to fraction",
                                 "Addition and Subtraction",
                               ],
            "Algebraic Expressions",
                               [ "Constants and Variables",
                                 "Algebraic operations",
                               ],
            {'name': "Ratio, Proportion and the Unitary Method", 'domainType': Domain.WHOLE_NUMBER, 'degreeOfDifficulty': 1 },
                               [ {'name': "Ratios and fractions", 'knowledgeUnit': "DirectProportion"}, 
                                 {'name': "Proportions", 'knowledgeUnit': "DirectProportion"},
                                 "Continued Proportion",
                                 {'name': "Direct variation and unitary method", 'knowledgeUnit': "DirectProportion"},
                               ],
            "Basic Geometrical Ideas",
                               [ "Point",
                                 "Line",
                                 "Plane",
                                 "Open and Closed Figures",
                                 "Angles",
                                 "Triangles",
                                 "Quadrilaterals",
                                 "Circles, chords and Arcs",
                               ],
            "Two dimensional shapes",
                               [ "Measurement of line segments",
                                 "Measurement of angles",
                                 "Types of angles",
                                 "Properties of points, lines and planes",
                                 "Types of triangles",
                                 "Types of quadrilaterals",
                               ],                                   
            "Three dimensional shapes",
                               [ "Cubes and cuboids",
                                 "Shapes with curved sides",
                                 "Prisms",
                                 "Pyramids",
                                 "Nets of solids",
                               ],
            "Symmetry", 
                               [ "Reflection" ],
            "Constructions",
                               [ "Line segments",
                                 "Angles using a protractor",
                                 "Ruler and Set squares",
                                 "Parallel and Perpendicular lines",
                                 "Circle",
                                 "Ruler and Compass",
                               ],
            {'name': "Perimeter and Area", 'domainType': Domain.DECIMAL },
                               [ "Perimeter",
                                 "Area",
                               ],
            "Data Handling",
                               [ "Tally Marks",
                                 "Pictographs",
                                 "Bar Graph",
                               ],
  ]
  SyllabusUnit.saveSyllabusUnit(None, "CBSE Mathematics 6th", math6)
