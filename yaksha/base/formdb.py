import logging

from google.appengine.ext import db
from google.appengine.ext.db import polymodel

class FormPolydb(polymodel.PolyModel):
  id_field = None
  
  @staticmethod
  def type(instance, field):
    return Formdb.type(instance,field)
  
  @staticmethod
  def retrieve(cls, my_id):
    logging.info("Retrieving: ")
    logging.info(my_id)
    entity = Formdb.retrieve(cls, my_id)
    logging.info('Retrieval done')
    return entity    
  
class Formdb(db.Model):
  id_field = None

  @staticmethod
  def type(instance, field):
    return str(instance._properties[field].__class__)[32:-10]

  @staticmethod
  def retrieve(cls, my_id):
    
    # my_id is the key of the record if id_field is missing
    if not cls.id_field:
      return db.get(my_id)
    
    query = cls.gql("WHERE " + cls.id_field + " = :1", my_id)

    for result in query:
      return result

    logging.info("Retrieval failed for: " + my_id)
    return None

