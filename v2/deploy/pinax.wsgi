# commons2.wsgi is configured to live in projects/commons2/deploy.

import os
import sys

# redirect sys.stdout to sys.stderr for bad libraries like geopy that uses
# print statements for optional import exceptions.
sys.stdout = sys.stderr

from os.path import abspath, dirname, join
from site import addsitedir

addsitedir('/srv/commons2/lib/python2.5/site-packages')
addsitedir('/csc/pinax-env/lib/python2.5/site-packages')
sys.path.insert(0, abspath(join(dirname(__file__), "../../")))

from django.conf import settings
os.environ["DJANGO_SETTINGS_MODULE"] = "commons2.settings"

sys.path.insert(0, join(settings.PINAX_ROOT, "apps"))
sys.path.insert(0, settings.PROJECT_ROOT)
sys.path.insert(0, join(settings.PROJECT_ROOT, "apps"))

from django.conf import settings

from django.core.handlers.wsgi import WSGIHandler
application = WSGIHandler()

