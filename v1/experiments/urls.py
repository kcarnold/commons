from django.conf.urls.defaults import *

urlpatterns = patterns(
    'commons.experiments.views',

    url(r'^$', 'main', name='exp-main'),

# API
    url(r'^sentences/matching/(?P<regex>.*)/$', 'sentences_matching_regex'),
)
