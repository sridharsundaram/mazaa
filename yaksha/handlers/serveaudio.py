# A simple server to collect audio using python.  To be more secure,
# you might want to check the file names and place size restrictions
# on the incoming data.

import urllib

from google.appengine.ext import webapp
from google.appengine.api import files
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext import blobstore

class ServeAudio(blobstore_handlers.BlobstoreDownloadHandler):
  def get(self, resource):
    resource = str(urllib.unquote(resource))
    blob_info = blobstore.BlobInfo.get(resource)
    self.send_blob(blob_info)
    