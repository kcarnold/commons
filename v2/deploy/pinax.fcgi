# social_project.fcgi is configured to live in projects/social_project/deploy.

import os
import sys

from os.path import abspath, dirname, join
from site import addsitedir

sys.path.insert(0, abspath(join(dirname(__file__), "../../")))
sys.path.insert(0, abspath(join(dirname(__file__), "../divisi/")))
sys.path.insert(0, abspath(join(dirname(__file__), "../divisi/csc/")))

from django.conf import settings
os.environ["DJANGO_SETTINGS_MODULE"] = "commons2.settings"

sys.path.insert(0, join(settings.PINAX_ROOT, "apps"))
sys.path.insert(0, join(settings.PROJECT_ROOT, "apps"))

from django.core.servers.fastcgi import runfastcgi
runfastcgi(method="threaded", daemonize="false")
