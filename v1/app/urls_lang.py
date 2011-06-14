from django.conf.urls.defaults import *

urlpatterns = []

urlpatterns += patterns(
    'commons.app.json',

    (r'^concepts/near/(?P<category>.*)/$', 'similar_concepts'),
    (r'^features/near/(?P<category>.*)/$', 'similar_features'),

    (r'^concept/(?P<concept>.*)/fwd_relations/$', 'concept_fwd'),
    (r'^concept/(?P<concept>.*)/rev_relations/$', 'concept_rev'),
    (r'^concept/(?P<concept>.*)/relations/$', 'concept_all_relations'),
    (r'^eval/(?P<concept1>[^/]+)/(?P<reltype>\w+)/(?P<concept2>[^/]+)/$', 'eval_assertion'),
    (r'^similarity-between/(?P<cat1>.*)/-/(?P<cat2>.*)/$', 'category_similarity'),

    (r'^predicted/(?P<category>.*)/$', 'predicted'),

    (r'^tensor.gz$', 'tensor_download'),
)

urlpatterns += patterns('commons.app.views',
    # Main page
    url(r'^$', 'main', name='main'),

    # Stats
    url(r'^stats/$', 'stats', name='stats'),

    # Search
    url(r'^search/$', 'search', name='search'),

    # Concepts
    url(r'^concepts/$', 'concepts', name='concepts'),
    url(r'^concept/(?P<concept_name>.*)/$', 'concept', name='concept'),

    # Assertions
    url(r'^assertion/(?P<id>[0-9]+)/$', 'assertion', name='assertion'),
    url(r'^assertion/best/$', 'best', name='best'),
    url(r'^assertion/all/$', 'all_sentences'),

    # Adding
    url(r'^add/$', 'add_predtypes', name='add-predtypes'),
    url(r'^add/(?P<predtype>\d+)/$', 'add_predtype', name='add-predtype'),
    url(r'^add/from_frame/(?P<frame>\d+)/$', 'add_from_frame', name='add-from-frame'),

    # Frames
    url(r'^frames/$', 'view_frames', name='view-frames'),
    url(r'^frames/add/$', 'add_frame', name='add-frame'),
)

# AnalogySpace stuff that really FIXME doesn't belong here.
urlpatterns += patterns('commons.util',
    url(r'^adhoc/$', 'direct_to_template', {'template': 'commons/adhoc_categories.html'}, name='adhoc'),
)
