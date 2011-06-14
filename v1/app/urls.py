from django.conf.urls.defaults import *

urlpatterns = patterns('commons.app.views',
    # Users
    url(r'^accounts/', include('registration.urls')),

    url(r'^user/id:(?P<id>\d+)/$', 'userid_contributions', name='userid-contrib'),
    url(r'^user/(?P<name>\w+)/$', 'username_contributions', name='username-contrib'),

    url(r'^feedback/$', 'feedback', name='feedback'),

    # Changing languages
    url(r'^set_lang/', 'set_lang', name='setlang'),
)

# JSON interfaces
urlpatterns += patterns('commons.app.json',
    # Account management
    url(r'json/username_available', 'username_available', name='username-available'),
    # Add knowledge
    url(r'^json/add/$', 'add_from_frame'),
    url(r'^json/rate/$', 'rate'),
)

# Database admin
#urlpatterns += patterns('commons.app.dbadmin',
#    url('dbadmin/', 'recent_activity'),
#)

# Static media
urlpatterns += patterns('django.views.static',
    url(r'^media/(?P<path>.*)$', 'serve', {'document_root': 'media'}),
)

# Javascript catalog
urlpatterns += patterns('django.views.i18n',
    (r'^jsi18n/$', 'javascript_catalog', {'packages': ('django.conf', 'commons.app'),}),
)

# Main page.
urlpatterns += patterns('commons.app.views',
    url(r'^$', 'main', name='main-defaultlang'),
)

# Database data that depends on language:
from django.conf import settings
langs = '|'.join(lang for lang, _ in settings.LANGUAGES)
urlpatterns += [url('^(?P<lang>%s)/' % langs, include('commons.app.urls_lang'))]
