from csc.conceptnet4.models import Assertion, Concept, User, Batch, RawAssertion
from commons.util import cached, needs_setting, InputError
from commons.analysis import get_svd_results
from django.db import transaction

# FIXME: hardcoded.
POSITIVE_RATING_LABEL = 'Good'
THE_BATCH = Batch.objects.get(id=192) # change this if you do something significant


def top_torate_key(lang, num):
    return 'top_torate_%s_%d' % (lang, num)
@cached(top_torate_key, cached.minute)
def get_top_torate(lang, num):
    #    return list(Assertion.objects.filter(language=lang, score=1, polarity=1)[:num])
    assertions = list(Assertion.useful.filter(language=lang, score__gt=3,
    score__lt=10, frequency__value__gt=0)[:5*num])
    import random
    random.shuffle(assertions)
    return assertions[:num]

def top_concepts_key(lang, num):
    return 'top_concepts_%s_%d' % (lang, num)
@cached(top_concepts_key, cached.day)
def get_top_concepts(lang, num):
    #return get_tops_of_axes(lang, num)
    return concepts_with_most_assertions(lang, num)

def get_random_concepts(lang, num):
    '''Gets a random collection of decent concepts.'''
    min_assertions = 10
    return list(Concept.objects.filter(language=lang,num_assertions__gt=min_assertions).order_by('?')[:num])

## Other possibilities for top_concepts:
def get_tops_of_axes(lang, num):
    svd = get_svd_results(lang)
    tops_of_axes = [svd.u[:,n].top_items(1)[0][0] for n in xrange(num)]
    return [Concept.objects.get(text=text, language=lang) for text in tops_of_axes]
def concepts_with_most_assertions(lang, num):
    return list(Concept.objects.filter(language=lang).order_by('-num_assertions')[:num])


def _user_exists(username):
    '''Test if a user exists.'''
    return User.objects.filter(username=username).count() > 0


@transaction.commit_on_success
@needs_setting('ENABLE_ADD', 'adding new knowledge')
def add_assertion(request, user, frame, text1, text2, activity, rating=1):
    # FIXME: this could happen on user input, so do something more intelligent
    # than an assert.
    
    assert text1 != text2
    raw = RawAssertion.make(user, frame, text1, text2, activity, rating)
    raw.batch = THE_BATCH
    raw.save()
    return raw.assertion

@cached(lambda lang: 'stats_'+lang, cached.day)
def get_stats(lang):
    assertions = Assertion.objects.filter(language=lang)
    assertion_counts = dict(
#        lt0=assertions.filter(score__lt=0).count(),
#        zero=assertions.filter(score=0).count(),
        gt0=assertions.filter(score__gt=0).count(),
#        gt1=assertions.filter(score__gt=1).count(),
        total=assertions.count(),
        )

    concepts = Concept.objects.filter(language=lang)
    concept_counts = dict(
        total=concepts.count(),
        single=concepts.filter(num_assertions=1).count(),
        good=concepts.filter(num_assertions__gt=2).count(),
        )

    return dict(assertion_counts=assertion_counts,
                concept_counts=concept_counts)
