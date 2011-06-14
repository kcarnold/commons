import os, sys
#sys.path.insert(0, '/srv')
#sys.path.insert(0, '/csc')

import site
site.addsitedir('/srv/commons/lib/python2.5/site-packages')

os.environ['DJANGO_SETTINGS_MODULE'] = 'commons.settings'

from django.core.handlers.wsgi import WSGIHandler
application = WSGIHandler()