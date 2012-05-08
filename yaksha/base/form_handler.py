import cgi
from datetime import date, datetime
import os
import logging

from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext import webapp
from formdb import Formdb

class FormHandler(webapp.RequestHandler):
  html_form = None
  cls = None
  authorize = False
  template_values = {}

  def get_value(self, form, field, type):
    if not form.has_key(field):
      return [] if type == 'List' else None

    logging.info("Converting field: <" + field + "> of type " + type)

    if type == 'Blob': # does not work now
      item = form[field]
      if item.file:
        logging.info("Attachment")
        return item.file.read()
      return None

    value = cgi.escape(form[field])
    if value == "":
      return None

    if type == 'String':
      return value
    elif type == 'Date':
      d = date(int(value[6:10]), int(value[3:5]), int(value[0:2]))
      return d
    elif type == 'Boolean':
      return value == 'on'
    elif type == 'Integer':
      return int(value)

  # @param Formdb item - created or saved item
  def render(self, item):
    self.response.headers['Content-Type'] = 'text/html'
    path = os.path.join(os.path.dirname(__file__), "../", self.html_form)
    self.response.out.write(template.render(path, self.template_values))
    
  def get(self):
    user = users.get_current_user()
    logging.info("Authorize = " + str(self.authorize))
    if user or (not self.authorize):
      self.template_values['username'] = user.nickname() if user else ""
      logging.info(self.__class__)
      self.render(None)
    else:
      logging.info("Showing login screen")
      self.redirect(users.create_login_url(self.request.uri))

  def create_item(self, form):
    item = self.cls()

    for field in item.properties():
      if field[0] != '_':
        item.__setattr__(field, self.get_value(form, field, Formdb.type(item, field)))

    return item

  def update_item(self, form, item):
    for field in item._properties.keys():
      value = self.get_value(form, field, Formdb.type(item, field))
      if value:
        item.__setattr__(field, value)


  def processPostData(self):
    form = self.request.params
  # no id_field => _key should be used
    key_name = '_key' if not self.cls.id_field else self.cls.id_field
    my_id = cgi.escape(form[key_name]) if form.has_key(key_name) else None
    item = self.cls.retrieve(self.cls, my_id) if my_id else None
    if not item:
      item = self.create_item(form)
    else:
      self.update_item(form, item)

    logging.info("Processed entity with Key = " + my_id)
    for field in item._properties.keys():
      logging.info(field + " = " + str(getattr(item, field)))
    
    for field in item._properties.keys():
      if Formdb.type(item, field) == 'Date' and getattr(item, field):
        item.__setattr__(field + "_str", getattr(item, field).strftime("%d/%m/%Y"))
    
    return item

  def post(self):
    user = users.get_current_user()

    if user or (not self.authorize):
      #form = cgi.FieldStorage()
      item = self.processPostData()
      item.put()

      self.render(item)
    else:
      self.redirect(users.create_login_url(self.request.uri))

  def get_attachment(self):
    user = users.get_current_user()
    if not user and self.authorize:
      self.redirect(users.create_login_url(self.request.uri))
      return

    if self.cls.id_field == None:
      return
    
    id = cgi.escape(self.request.get(self.cls.id_field))
    item = self.cls.retrieve(id)
    if item:
      logging.info("Retrieving attachment for: " + id)
      self.response.headers['Content-type'] = 'application/zip'
      self.response.out.write(self.cls.attachment)

