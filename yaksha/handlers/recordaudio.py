# A simple server to collect audio using python.  To be more secure,
# you might want to check the file names and place size restrictions
# on the incoming data.

from google.appengine.ext import webapp
from google.appengine.api import files

class RecordAudio(webapp.RequestHandler):
    uploaded_data = {}
    
    def get(self):
      sound_id = self.request.params.get('id')
      self.response.headers['Content-Type'] = 'audio/x-wav'
      self.response.out.write(self.uploaded_data[sound_id])

    def post(self):
      sound_id = self.request.params.get('id')
      self.uploaded_data[sound_id] = self.request.body
