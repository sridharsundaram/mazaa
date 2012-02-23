from base.formdb import Formdb
from google.appengine.ext import db

# Each syllabus unit is pointed to by its children. The Root points to None.
class SyllabusUnit(Formdb):
  name = db.StringProperty()
  domainType = db.IntegerProperty()
  knowledgeUnit = db.StringProperty()
  degreeOfDifficulty = db.IntegerProperty()
  # parent will be another syllabusunit or None for root
  parentUnit = db.SelfReferenceProperty(collection_name='children')
 
  # @param parentUnit - parent of this sylabus unit, None for root
  # @param dictSyllabusUnit - containing required name - name of syllabus unit
  #                                      optional knowledgeUnit - name of associated knowledgeUnit - NOT inherited
  #                                      optional domainType - domain type of associated knowledgeUnit - inherited from parent
  #                                      optional degreeOfDifficulty - degree of difficulty of associated knowledge Unit - inherited from parent
  #                         - in simple cases, can be a string instead of dict i.e. only required name is present
  # @param children - list of children syllabus units
  # @return the saved syllabus unit
  @staticmethod
  def saveSyllabusUnit(parentUnit, dictSyllabusUnit, children):
    if isinstance(dictSyllabusUnit, dict):
      syllabusUnit = SyllabusUnit(parentUnit = parentUnit, **dictSyllabusUnit)
      if not dictSyllabusUnit.has_key('domainType'):
        syllabusUnit.domainType = parentUnit.domainType
      if not dictSyllabusUnit.has_key('degreeOfDifficulty'):
        syllabusUnit.degreeOfDifficulty = parentUnit.degreeOfDifficulty
    else:
      syllabusUnit = SyllabusUnit(name = dictSyllabusUnit, 
                                  parentUnit = parentUnit, 
                                  domainType = parentUnit.domainType if parentUnit else None, 
                                  degreeOfDifficulty = parentUnit.degreeOfDifficulty if parentUnit else None)
    syllabusUnit.put()
    i = 0
    while i < len(children):
      childUnit = children[i]
      i += 1
      if i < len(children) and isinstance(children[i], list):
        childChildren = children[i] 
        i += 1
      else:
        childChildren = []
      SyllabusUnit.saveSyllabusUnit(syllabusUnit, childUnit, childChildren)
      
    return syllabusUnit
