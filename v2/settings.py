# -*- coding: utf-8 -*-
# Django settings for basic pinax project.
import os.path
# Fix Python egg cache
os.environ["PYTHON_EGG_CACHE"]= __file__.rsplit('/', 1)[0] + "/.egg"

from csc.django_settings import *
from socket import gethostname

import pinax

PINAX_ROOT = os.path.abspath(os.path.dirname(pinax.__file__))
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
TENSOR_ROOT = PROJECT_ROOT+'/tensors'
SVD_LANGUAGES = ['en', 'ja', 'zh-Hant']

# tells Pinax to use the default theme
PINAX_THEME = 'default'

from local_settings import *

DEBUG = DEVEL
TEMPLATE_DEBUG = DEBUG
USE_ROSETTA = True

# tells Pinax to serve media through django.views.static.serve.
SERVE_MEDIA = DEBUG

ADMINS = (
#    ('Catherine Havasi', 'havasi@mit.edu'),
#    ('Rob Speer', 'rspeer@mit.edu'),
    ('Rob Speer', 'rspeer@mit.edu'),
    ('Kenneth Arnold', 'kcarnold@media.mit.edu'),
    ('Jesse Moeller', 'jmoeller@mit.edu')
)

MANAGERS = ADMINS

# Local time zone for this installation. Choices can be found here:
# http://www.postgresql.org/docs/8.1/static/datetime-keywords.html#DATETIME-TIMEZONE-SET-TABLE
# although not all variations may be possible on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'US/Eastern'

# Language code for this installation. All choices can be found here:
# http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
# http://blogs.law.harvard.edu/tech/stories/storyReader$15
LANGUAGE_CODE = 'en'

if DEVEL:
    SITE_ID = 2
else:
    SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"

MEDIA_ROOT = os.path.join(os.path.dirname(__file__), "site_media")

# URL that handles the media served from MEDIA_ROOT.
# Example: "http://media.lawrence.com"
MEDIA_URL = '/site_media/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
    'dbtemplates.loader.load_template_source',
)

MIDDLEWARE_CLASSES = (
    # URL normalization, etc.
    'django.middleware.common.CommonMiddleware',
    # Handle sessions.
    'django.contrib.sessions.middleware.SessionMiddleware',
    # Keep track of users.
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django_openid.consumer.SessionConsumer',
    'account.middleware.LocaleMiddleware',
    'django.middleware.doc.XViewMiddleware',
    'pagination.middleware.PaginationMiddleware',

    # More stuff added by Pinax
    'misc.middleware.SortOrderMiddleware',
    'djangodblog.middleware.DBLogMiddleware',
    #'django.middleware.transaction.TransactionMiddleware',

    # Override language to that specified in the URL.
    'middleware.LanguageOverrideMiddleware',
    # Translate things.
    'django.middleware.locale.LocaleMiddleware',
    # Set the silly test cookie...
    'middleware.SetTestCookieMiddleware',

    # Debug Toolbar
    #'debug_toolbar.middleware.DebugToolbarMiddleware',
)

ROOT_URLCONF = 'urls'

TEMPLATE_DIRS = (
    os.path.join(os.path.dirname(__file__), "templates"),
    os.path.join(PINAX_ROOT, "templates", PINAX_THEME),
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.core.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.request",
    
    "notification.context_processors.notification",
    "announcements.context_processors.site_wide_announcements",
    "account.context_processors.openid",
    "account.context_processors.account",
    "misc.context_processors.contact_email",
    "misc.context_processors.site_name",
    "notification.context_processors.notification",
#    "misc.context_processors.combined_inbox_count",
)

#COMBINED_INBOX_COUNT_SOURCES = (
#    "messages.context_processors.inbox",
#    "notification.context_processors.notification",
#)

INSTALLED_APPS = (
    # included
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.humanize',
    'django.contrib.markup',
    
    # external
    'notification', # must be first
    'django_openid',
    'emailconfirmation',
    'django_extensions',
#    'robots',
    'dbtemplates',
    'mailer',
    'announcements',
#    'oembed',
    'djangodblog',
    'pagination',
#   'gravatar',
#   'threadedcomments',
    'timezones',
#    'app_plugins',
    'voting',
#   'tagging',
#   'bookmarks',
    'ajax_validation',
    'avatar',
    'flag',
    'uni_form',
    
    # internal (for now)
    'analytics',
    'basic_profiles',
    'staticfiles',
    'account',
#    'photologue',
#    'tribes',
    'misc',

#    'debug_toolbar',

    'django.contrib.admin',
    'commonsense',
    'analogyspace',
    #'colorizer',
    #'usertest',
    'csc.conceptnet4',
    'csc.corpus',
    'csc.webapi',
    'south',
)
if USE_ROSETTA:
    INSTALLED_APPS += ('rosetta',)


ABSOLUTE_URL_OVERRIDES = {
    "auth.user": lambda o: "/profiles/%s/" % o.username,
}

AUTH_PROFILE_MODULE = 'basic_profiles.Profile'
NOTIFICATION_LANGUAGE_MODULE = 'account.Account'

EMAIL_CONFIRMATION_DAYS = 2
EMAIL_DEBUG = DEBUG
CONTACT_EMAIL = "rspeer@mit.edu"
SITE_NAME = "Open Mind Common Sense"
LOGIN_URL = "/account/login"
LOGIN_REDIRECT_URLNAME = "what_next"

from fnmatch import fnmatch
class glob_list(list):
    def __contains__(self, key):
        if not isinstance(key, basestring): return False
        for elt in self:
            if fnmatch(key, elt): return True
        return False

INTERNAL_IPS = glob_list([
    '127.0.0.1',
    '18.85.*.*'
])

# Why does ugettext break things?!
ugettext = lambda s: s


LANGUAGES = (
    ('ar', u'العربية'),
    ('de', u'Deutsch'),
    ('en', u'English'),
    ('es', u'Español'),
    ('fr', u'Français'),
#    ('hr', 'Croatian'),
    ('hu', u'Magyar'),
    ('it', u'Italiano'),
    ('ja', u'日本語'),
    ('ko', u'한국어'),
#    ('mk', 'Macedonian'),
    ('nl', u'Nederlands'),
    ('pt', u'Português'),
    ('zh-Hant', u'正體中文'),
    ('zh-Hans', u'简体中文'),
#    ('zh', u'Chinese'),
#    ('ru', 'Russian'),
#    ('sr', 'Serbian'),
#    ('tr', 'Turkish'),
)

CACHE_BACKEND="memcached://127.0.0.1:11211"
FEEDUTIL_SUMMARY_LEN = 60*7 # 7 hours

class NullStream(object):
    def write(*args, **kw):
        pass
    writeline = write
    writelines = write

RESTRUCTUREDTEXT_FILTER_SETTINGS = { 'cloak_email_addresses': True,
                                     'file_insertion_enabled': False,
                                     'raw_enabled': False,
                                     'warning_stream': NullStream(),
                                     'strip_comments': True,}

# Avatar controls
AVATAR_DEFAULT_URL =  MEDIA_URL + 'openmind/OpenMind-square.png'
AVATAR_GRAVATAR_BACKUP = False

# if Django is running behind a proxy, we need to do things like use
# HTTP_X_FORWARDED_FOR instead of REMOTE_ADDR. This setting is used
# to inform apps of this fact
BEHIND_PROXY = False

# Pinax settings
FORCE_LOWERCASE_TAGS = True
WIKI_REQUIRES_LOGIN = True

# Commons settings
ENABLE_RATE = True
ENABLE_ADD = True

# Uncomment this line after signing up for a Yahoo Maps API key at the
# following URL: https://developer.yahoo.com/wsregapp/
# YAHOO_MAPS_API_KEY = ''

### Debug toolbar config
DEBUG_TOOLBAR_PANELS = (
#     'debug_toolbar.panels.version.VersionDebugPanel',
#     'debug_toolbar.panels.timer.TimerDebugPanel',
#     'debug_toolbar.panels.settings_vars.SettingsVarsDebugPanel',
#     'debug_toolbar.panels.headers.HeaderDebugPanel',
#     'debug_toolbar.panels.request_vars.RequestVarsDebugPanel',
#     'debug_toolbar.panels.template.TemplateDebugPanel',
#     'debug_toolbar.panels.sql.SQLDebugPanel',
#     'debug_toolbar.panels.logger.LoggingPanel',
)


DEBUG_TOOLBAR_CONFIG = {
    'INTERCEPT_REDIRECTS': False,
}

