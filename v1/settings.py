###
### External libraries path
###
import os.path; _path = os.path.dirname(__file__)
joinpath = os.path.join
import commons.lib

# Fix Python egg cache
import os
os.environ["PYTHON_EGG_CACHE"]= __file__.rsplit('/', 1)[0] + "/.egg"

try:
    import local
except:
    import sys
    print >>sys.stderr, """\x1b[31;1m
Error importing the module 'local'.
You might need to create a 'local.py' based on 'local.py.tmpl' (found in the 'commons' directory).
\x1b[0m
"""
    sys.exit(1)

###
### Request and Response
###
ROOT_URLCONF = 'commons.urls'
MIDDLEWARE_CLASSES = (
    # Handle sessions.
    'django.contrib.sessions.middleware.SessionMiddleware',
    # URL normalization, etc.
    'django.middleware.common.CommonMiddleware',
    # Override language to that specified in the URL.
    'commons.middleware.LanguageOverrideMiddleware',
    # Translate things.
    'django.middleware.locale.LocaleMiddleware',
    # Keep track of users.
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # Set the silly test cookie...
    'commons.middleware.SetTestCookieMiddleware',
)

ADMIN_MEDIA_PREFIX = '/admin_media/'

from local import SECRET_KEY



###
### Debug Flag
###
from socket import gethostname
from local import DEVEL
TEMPLATE_DEBUG = DEBUG = DEVEL

if DEVEL: SITE_ID = 2
else:     SITE_ID = 1





###
### Error Reporting
###
MANAGERS = ADMINS = (
#    ('Catherine Havasi', 'havasi@mit.edu'),
#    ('Rob Speer', 'rspeer@mit.edu'),
#    ('Jason Alonso', 'jalonso@media.mit.edu'),
#    ('Kenneth Arnold', 'kcarnold@media.mit.edu'),
#    ('Jesse Moeller', 'jmoeller@mit.edu'),
    ('Rob Speer', 'rspeer@mit.edu'),
)


###
### Email settings
###
EMAIL_HOST = 'outgoing.media.mit.edu'
SERVER_EMAIL = 'conceptnet@media.mit.edu'
DEFAULT_FROM_EMAIL = SERVER_EMAIL

###
### Authentication
###
AUTHENTICATION_BACKENDS = (
        'csc.pseudo_auth.backends.LegacyBackend',
        'django.contrib.auth.backends.ModelBackend',
)


###
### Databases etc.
###
INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'django.contrib.humanize',
    'csc.pseudo_auth',
    'csc.corpus',
    'csc.conceptnet4',
    'commons.app',
    'commons.twenty_questions',
    'registration',
    'django_extensions',
)

try:
    import debug_toolbar
    MIDDLEWARE_CLASSES += ('debug_toolbar.middleware.DebugToolbarMiddleware',)
    INSTALLED_APPS += ('debug_toolbar',)
except ImportError:
    pass

from local import DATABASE_ENGINE, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT


#if DEVEL:
#    INSTALLED_APPS += ('commons.experiments',)

USE_ROSETTA = True
if USE_ROSETTA:
    INSTALLED_APPS += ('rosetta',)

###
### Internationalization
###
LANGUAGE_CODE = 'en'
USE_I18N = True
_ = lambda s: s # dummy gettext to avoid importing translation module
LANGUAGES = (
#    ('ar', _('Arabic')),
    ('en', _('English')),
#    ('es', _('Spanish')),
#    ('fr', _('French')),
#    ('hr', _('Croatian')),
#    ('it', _('Italian')),
#    ('mk', _('Macedonian')),
#    ('nl', _('Dutch')),
#    ('pt', _('Portuguese')),
#    ('ru', _('Russian')),
#    ('sr', _('Serbian')),
#    ('tr', _('Turkish')),
)

## Make session cookies be per browser session.
# SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Add the Commons template context processor
TEMPLATE_CONTEXT_PROCESSORS = (
    "django.core.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
#    "django.core.context_processors.media",
    "django.core.context_processors.request",
    'commons.app.context.commons_context',
)

CACHE_BACKEND="memcached://127.0.0.1:11211"


from fnmatch import fnmatch
class glob_list(list):
    def __contains__(self, key):
        for elt in self:
            if fnmatch(key, elt): return True
        return False
    
INTERNAL_IPS = glob_list([
    '127.0.0.1',
    '18.85.*.*'
    ])

# Settings for the Django login framework
LOGIN_REDIRECT_URL = '/'
# (eventually the Django default of /accounts/profile/ will be a good idea.)

# Define SVD cache settings
SVD_CACHE_KEYS = ['svd_dir', 'svd_dir_old']
SVD_CACHE_TIMEOUT = 60 * 60 * 36 # 36 hours, in seconds
SVD_LANGUAGES = ['en']#, 'nl']
TENSOR_ROOT = joinpath(_path, 'tensors')

# Registration settings
ACCOUNT_ACTIVATION_DAYS = 2


ENABLE_ADD=True
ENABLE_RATE=True


from local import ENABLE_TWENTYQ
