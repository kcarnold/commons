from django.conf.urls.defaults import *
from django.conf import settings
from django.views.generic.simple import direct_to_template
from django.contrib import admin

from account.openid_consumer import PinaxConsumer
import os.path
import commonsense.views

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', 'commonsense.views.main_page', name='home'),
    #url(r'^$', 'commonsense.views.main_page', name='main_page'),

    (r'^about/', include('about.urls')),
    (r'^account/', include('account.urls')),
    (r'^openid/(.*)', PinaxConsumer()),
    (r'^bbauth/', include('bbauth.urls')),
    (r'^authsub/', include('authsub.urls')),
    (r'^profiles/', include('basic_profiles.urls')),
    (r'^notices/', include('notification.urls')),
    (r'^announcements/', include('announcements.urls')),
    (r'^comments/', include('threadedcomments.urls')),
    (r'^robots.txt$', include('robots.urls')),
    (r'^i18n/', include('django.conf.urls.i18n')),
    (r'^admin/(.*)', admin.site.root),
    (r'^avatar/', include('avatar.urls')),
    (r'^flag/', include('flag.urls')),
    (r'^vote/', include('urls_vote')),
    (r'^admin/(.*)', admin.site.root),
    (r'^api/', include('csc.webapi.urls')),
#    (r'^lattice/', include('lattice.urls')),
#    (r'^usertest/', include('usertest.urls')),
)

# Language-dependent URLs
langs = '|'.join(lang for lang, _ in settings.LANGUAGES)
urlpatterns += [url('^(?P<lang>%s)/' % langs, include('urls_lang'))]

if settings.SERVE_MEDIA:
    urlpatterns += patterns('',
        (r'^site_media/(?P<path>.*)$', 'staticfiles.views.serve'),
    )

# Rosetta
if settings.USE_ROSETTA:
    urlpatterns += patterns('', url(r'^rosetta-i18n/', include('rosetta.urls')))

