from google.appengine.api import urlfetch
from google.appengine.api import users
from google.appengine.ext import webapp
import simplejson
from datamodel.word import Word

""" Handler for importing words from spreadsheet."""
class ImportWords(webapp.RequestHandler):

  def get(self):
    user = users.get_current_user()
    # Need admin access to import
    #if not user.is_current_user_admin():
    #  self.error(403)
    # Fetch JSON of published spreadsheet
    url = "http://spreadsheets.google.com/feeds/list/0AgsXfkShVJOsdHZ4bDlabGJRZVhEU0c0MTlLUzdiZ3c/od6/public/values?alt=json"
    result = urlfetch.fetch(url)
    count = 0
    if result.status_code == 200:
      feed_obj = simplejson.loads(result.content)
      if "feed" in feed_obj:
        entries = feed_obj["feed"]["entry"]
        # Make an Application entity for each entry in feed
        for entry in entries:
          hindi = entry['gsx$hindi']['$t']
          english = entry['gsx$english']['$t']
          word = Word(hindi, english)
          word.put()
          count = count + 1
    
    self.response.out.write("Words imported = " + count)
  