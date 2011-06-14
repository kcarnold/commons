#!/usr/bin/env python
from django.conf.urls.defaults import *

urlpatterns = patterns('commons.twenty_questions.views',
    # Main page
    url(r'^reset', 'reset', name='reset'),
    url(r'^tellme', 'tellme', name='tellme'),
    url(r'^frame/(?P<frame>\d+)/(?P<slot>\d)', 'frame', name='manual_frame'),
    url(r'^cache', 'cache', name='cache'),
    url(r'^$', 'question', name='question', kwargs={"model_components" : 5, "model_iterations" : 100 }),
)
