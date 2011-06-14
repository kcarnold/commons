from django.conf.urls.defaults import *
from voting.views import vote_on_object
from commonsense.views import vote_on_statement, vote_on_assertion
from csc.conceptnet4.models import RawAssertion, Assertion
urlpatterns = []
urlpatterns += patterns(
    '',
    (r'statement/(?P<object_id>\d+)/(?P<direction>up|down|clear)vote/?$',
        vote_on_statement),
    (r'assertion/(?P<object_id>\d+)/(?P<direction>up|down|clear)vote/?$',
        vote_on_assertion)
)
