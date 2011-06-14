import urllib
import simplejson

###
### The server to use.
###
server_url = 'http://commons.media.mit.edu/'


###
### Internal utility functions
###
def cache_getter(name):
    def wrap(self):
        return self._cache.get(name, None)
    return property(_need_cache(wrap))

def _need_cache(fn):
    def wrap(self, *a, **kw):
        if self._cache is None: self.update_cache()
        return fn(self, *a, **kw)
    wrap.__name__ = fn.__name__
    wrap.__doc__ = fn.__doc__
    wrap.__dict__.update(fn.__dict__)
    return wrap

###
### Concepts and assertions
###

class Concept(object):
    def __init__(self, language, text):
        self.language = language
        self._text = text
        self._cache = None

    def __repr__(self):
        return "Concept(%r, %r)" % (self.language, self._text)

    def all_relations(self, types='All', limit=10):
        return [Assertion._from_cache(a) for a in
                all_relations(self.language, self._text, types, limit)]

    def fwd_relations(self, types='All', limit=10):
        return [Assertion._from_cache(a) for a in
                fwd_relations(self.language, self._text, types, limit)]

    def rev_relations(self, types='All', limit=10):
        return [Assertion._from_cache(a) for a in
                rev_relations(self.language, self._text, types, limit)]

    id = cache_getter('id')
    normalized = cache_getter('normalized')
    num_assertions = cache_getter('num_assertions')
    canonical_name = cache_getter('canonical_name')

    def update_cache(self):
        self._cache = get_json([self.language, 'concept', self._text])

    @classmethod
    def _from_cache(cls, cache):
        concept = cls(cache['language'], cache['canonical_name'])
        concept._cache = cache
        return concept


class Assertion(object):
#    '''Relationships are 5-tuples:
#    (left concept, relation type, right concept, assertion id, score)
#    However, not all of these are necessarily specified.'''
#    def __init__(self):
#        self.left = self.reltype = self.right = self.assertion_id = self.score None

    def __repr__(self):
        return '<Assertion: %r (id=%d)>' % (self.sentence, self.id)

    @classmethod
    def from_id(cls, language, id):
        return cls._from_cache(get_json([language, 'assertion', id]))


    @classmethod
    def _from_cache(cls, cache):
        rel = cls()
        rel.id = int(cache['id'])
        rel.left = Concept._from_cache(cache['left'])
        rel.type = cache['type']
        rel.right = Concept._from_cache(cache['right'])
        rel.score = float(cache['score'])
        rel.sentence = cache['sentence']
        rel._cache = cache
        return rel


###
### General utility functions
###
def get_json(url_parts, query=None):
    url = make_url([urllib.quote(part) for part in url_parts], query)
    print url
    data = urllib.urlopen(url).read()
    return simplejson.loads(data)

def make_url(parts, query=None):
    url = server_url + '/'.join(parts)
    if url[-1] != '/': url += '/'
    if query is None:
        query = dict()
    if 'format' not in query:
        query['format'] = 'json'
    return url + '?' + urllib.urlencode(query)

###
### Backend API functions
###

def _relations(lang, concept, types, limit, method):
    if types == 'All':
        types = ['All']
    assert isinstance(types, (list, tuple)), "types must be a list or tuple."
    return get_json([lang, 'concept', concept, method],
                    {'types': ','.join(types),
                     'limit': str(limit)})['assertions']


def all_relations(lang, concept, types='All', limit=10):
    return _relations(lang, concept, types, limit, 'relations')
def fwd_relations(lang, concept, types='All', limit=10):
    return _relations(lang, concept, types, limit, 'fwd_relations')
def rev_relations(lang, concept, types='All', limit=10):
    return _relations(lang, concept, types, limit, 'rev_relations')

def eval_assertion(lang, concept1, reltype, concept2):
    result = get_json([lang, 'eval', concept1, reltype, concept2])
    return result['lprop_val'], result['rprop_val']

def add_assertion(username, password, text1, frame_id, text2, activity,
rating='Good'):
    url = server_url+'json/add/'
    print url
    result = urllib.urlopen(
        url,
        urllib.urlencode(dict(username=username, password=password,
                              text1=text1, text2=text2, frame_id=str(frame_id),
                              activity=activity, rating=rating)))
    return result.read()


###
### Example / test
###
if __name__=='__main__':
    # Here is the 'lamp' concept.
    lamp = Concept(language='en', text='a lamp')
    # Since we know something about it, it has an id in the database.
    print 'concept id: %i' % lamp.id


    # Here is a concept that we don't know anything about.
    florb = Concept('en', 'florbnefter')
    # ... so it won't have an id (or anything else).
    print 'stem id: %s' % florb.id
    # it will be 'None'.


    # anyway, back to lamps. We can list the things we know about it:
    # First, a quick note on relations. A relation has two blanks:
    #   A dog is a pet.
    #      ^        ^
    #   slot 1    slot 2
    # A forward relation from a concept has that concept in slot 1:
    #  A lamp is: on the table, in an office, etc.
    # A reverse relation from a concept has that concept in slot 2:
    #  Something you can find on a table is a lamp.
    #  A dark room would make you want a lamp.
    fwd_rels = lamp.fwd_relations(limit=5)
    print 'Top 5 forward relations:'
    for rel in fwd_rels:
        # rel is an Assertion. We'll take advantage of its pretty-printer:
        print rel

    rev_rels = lamp.rev_relations(limit=5)
    print 'Top 5 reverse relations:'
    for rel in rev_rels:
        print rel


    print 'Top 5 overall relations:'
    for rel in lamp.all_relations(limit=5):
        print rel

    # This stuff hasn't been hooked in yet.
        # #     all_forms = s.stem.allforms(stem_id)
# #     print 'all forms of stem %i:' % stem_id
# #     print all_forms

# #print "Context of %s:" % concept
# #context = s.spreading_activation([stem_id])
# #for stem_id, weight in context[:10]:
# #    print s.stem.readable(stem_id)

# print "Similar to %s:" % concept
# similar = s.stem.similar(stem_id)
# print similar

# print "Evaluate an assertion:"
# print s.evalAssertion('knife', 'HasProperty', 'sharp')
# print s.evalAssertion('knife', 'HasProperty', 'dull')
# #print s.evalAssertion('machete', 'HasProperty', 'sharp')

# print "Concept similarity for HasProperty/sharp"
# print s.property.similar('HasProperty/sharp')

# print "Proximity of ['fun'] and ['happy', 'joyful']"
# print s.category_proximity(['fun'], [], ['happy', 'joyful'], [])

# print "Proximity of ['boring'] and ['happy', 'joyful']"
# print s.category_proximity(['boring'], [], ['happy', 'joyful'], [])
