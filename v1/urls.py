from django.conf.urls.defaults import *
from django.conf import settings
import os
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
     # Django admin
     (r'^admin/(.*)$', admin.site.root),

     (r'^admin_media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': os.path.join(os.path.split(admin.__file__)[0], 'media')}),
     (r'^favicon.ico$', 'django.views.static.serve', {'document_root': 'public', 'path': 'favicon.ico'}),
     (r'^cnet_client.py$', 'django.views.static.serve', {'document_root': 'public', 'path': 'cnet_client.py'}),
)

if settings.ENABLE_TWENTYQ:
    urlpatterns += patterns(
        '',
        (r'^20q/', include('commons.twenty_questions.urls'), {'lang': 'en'}))

if settings.DEVEL:
    urlpatterns += patterns('',
        (r'^experiments/', include('commons.experiments.urls'), {'lang': 'en'}))

# Rosetta
if 'rosetta' in settings.INSTALLED_APPS:
    urlpatterns += patterns('',
        url(r'^rosetta/', include('rosetta.urls')),
    )

# Google webmaster tools (sorta hacky here)
emptyfile_urls = ['google5040642bf5cca7b0.html']
def empty_response(request, *a):
    from django.http import HttpResponse
    return HttpResponse('')
urlpatterns += [url('^(%s)' % '|'.join(emptyfile_urls), empty_response)]
    
urlpatterns += patterns('',
     # Default to Commons
     (r'^', include('commons.app.urls')),
)

handler404 = 'commons.exception.page_not_found'
handler500 = 'commons.exception.server_error'
