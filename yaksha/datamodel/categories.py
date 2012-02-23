# Defining categories
class Category:  
  # list of all categories
  allCategories = []
  allProblems = {}
  
  def __init__(self, id, name):
    self.categoryId = id
    self.categoryName = name
    self.modelProblemList = []
    self. parentCategory = ""
    self.childCategories = []
    self.allCategories.append(self)
  
  def registerProblem(self, modelProblemClass):
    self.modelProblemList.append(modelProblemClass)
    self.allProblems[modelProblemClass.__name__] = modelProblemClass
