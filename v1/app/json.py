from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
from django.db.models import Q
from django.http import HttpResponse
from django.views.decorators.cache import cache_page
from functools import wraps
import re

from events.models import Activity
from csc.conceptnet4.models import Assertion, Frame, Concept, Relation, Feature

from commons.util import needs_setting, json_view, InputError, get_parameter
from commons.app.queries import _user_exists, add_assertion, get_top_torate
from commons.analysis import get_svd_results, tensor_filename

import urllib

@json_view
def username_available(request):
    return {'exists': _user_exists(request.GET['username'])}

def login_required_POSTok(func):
    func = login_required(func)
    @wraps(func)
    def wrapper(request, *a, **kw):
        if 'username' in request.POST:
            from django.contrib.auth import authenticate, login
            user = authenticate(username=request.POST['username'],
                                password=request.POST['password'])
            if user is not None and user.is_active:
                login(request, user)
            else:
                raise InputError(_('Login failed'))

        return func(request, *a, **kw)
    return wrapper

@login_required_POSTok
@json_view
def add_from_frame(request):
    frame = Frame.objects.get(id=get_parameter(request.POST, 'frame_id', int))
    text1 = get_parameter(request.POST, 'text1')
    text2 = get_parameter(request.POST, 'text2')
    rating = rating_values[get_parameter(request.POST, 'rating')]

    if len(text1) == 0 or len(text2) == 0:
        raise InputError(_('One of the slots was not filled in.'))
    activity_name = get_parameter(request.POST, 'activity')

    user = request.user
    activity, created = Activity.objects.get_or_create(name=activity_name)
    assertion = add_assertion(request, request.user, frame, text1, text2,
    activity, rating)

    return {'text': _('Knowledge accepted.'), 'id': assertion.id}


rating_values = {
    'Good': 1,
    'Bad': -1}

@needs_setting('ENABLE_RATE', 'rate an assertion')
@login_required_POSTok
@json_view
def rate(request):
    user = request.user
    assertion_id = get_parameter(request.POST, 'assertion_id', int)
    rating_value = get_parameter(request.POST, 'rating_value')

    activity, created = Activity.objects.get_or_create(name='commons/rating_button')

    assertion = Assertion.objects.get(id=assertion_id)
    assertion.set_rating(user, rating_values.get(rating_value, 0), activity)

    # FIXME: hard-coding the 10 items.
    get_top_torate.invalidate(assertion.language_id, 10)

    return {'text': _('Statement rated.')}

def category_from_urlcategory(svd, lang, category):
    parts, concepts, features = unpack_urlcategory(lang, category)
    return make_category_failsoft(svd, concepts, features, parts)

def make_category_failsoft(svd, concepts, features, parts):
    assert len(features) == 0 # FIXME: features currently not supported.
    if len(concepts) == 0:
        raise InputError(u'No concepts given.')
    from csc.conceptnet4.analogyspace import make_category
    try:
        return make_category(svd, concepts, features)
    except KeyError, e:
        concept = e.args[0]
        part = parts[concepts.index(concept)]
        raise InputError(u'Not enough known about "%s" to make a category.' % part)

def unpack_urlcategory(lang, category):
    # Split the category URL into slash-separated parts, and url-decode each.
    parts = [urllib.unquote_plus(part) for part in category.split('/') if part]

    # normalize each part
    def normalize(part):
        try:
            if '/' in part:
                raise InputError('features currently not supported')
            return Concept.get(part, lang).text
        except Concept.DoesNotExist:
            raise InputError(_('Nothing known about the concept "%s".') % part)

    # FIXME: assume they're all concepts for now.
    concepts = [normalize(part) for part in parts]
    features = []
    return parts, concepts, features

def canonical_form(normalized_text, lang):
    return Concept.objects.get(language=lang, text=normalized_text).canonical_name

@cache_page(60 * 60)
@json_view
def similar_concepts(request, lang, category):
    # Default to retrieving 10 items.
    count = int(request.GET.get('count', 10))

    svd = get_svd_results(lang)
    cat = category_from_urlcategory(svd, lang, category)
    items = svd.u_distances_to(cat).top_items(count)

    return {
        'similar':
            [{
                'text': canonical_form(item[0], lang),
                'score': item[1],
                } for item in items]
        }

def _split(item):
    a, b = item.split('/')
    if a[0].isupper():
        return [a, b, 1]
    else:
        return [b, a, 2]

class PartialInference(object):
    def __init__(self, lang, reltype, concept, slot):
        self.lang = lang
        self.reltype = reltype
        self.concept = concept
        self.slot = slot

    @classmethod
    def from_feature(cls, lang, feature, normalize=False):
        reltype, other, slot = _split(feature)
        if normalize:
            concept = Concept.get(other, lang)
        else:
            concept = Concept.objects.get(language=lang, text=other)
        return cls(lang, Relation.objects.get(name=reltype),
                   concept, slot)

    def logic_form(self):
        if self.slot == 1:
            fmt = u'%s(x, %s)'
        else:
            fmt = u'%s(%s, x)'
        return fmt % (self.reltype, self.concept.canonical_name)


    def frame_blank(self):
        '''Express the feature as a frame with a blank. Use the frame from the
        best assertion that it can derive from.'''
        left, frame, right, _ = self.fill_in('___')
        return fill_in_nums(frame, left, right)


    def fill_in(self, concept, question=False):
        if question: left, frame, right, frame_id = self.nl_question()
        else: left, frame, right, frame_id = self.nl()
        if self.slot == 1:
            left = concept
        else:
            right = concept
        return left, frame, right, frame_id

    def nl_question(self):
        # rspeer made this copy that produces questions. We should abstract.
        assertions = Assertion.useful.filter(language=self.lang,
                                             relation=self.reltype)
        if self.slot == 1:
            assertions = assertions.filter(concept2=self.concept)
        else:
            assertions = assertions.filter(concept1=self.concept)

        filtered = assertions.filter(frame__goodness__gte=3)
        try:
            best = filtered[0]
            frame = best.frame.text.replace('{%}', '')
            if self.slot == 1:
                if best.frame.text_question1: frame = best.frame.text_question1
                return None, frame, best.text2, best.frame_id
            else:
                if best.frame.text_question2: frame = best.frame.text_question2
                return best.text1, frame, None, best.frame_id
        except IndexError:
            # No example frame found.
            # Fall back to just getting the best frame for this reltype.
            try:
                frame = Frame.objects.filter(relation=self.reltype,
                                             language=self.lang)[0]
                frame_text = frame.text.replace('{%}', '')
                if self.slot == 1:
                    if frame.text_question1: frame_text = frame.text_question1
                    return None, frame_text, self.concept.canonical_name, frame.id
                else:
                    if frame.text_question2: frame_text = frame.text_question2
                    return self.concept.canonical_name, frame_text, None, frame.id
            except IndexError:
                # Couldn't even find a frame. Fallback on the only thing we got.
                if self.slot == 1:
                    return None, ('{1} %s {2}' % self.reltype.name), self.concept.canonical_name, None
                else:
                    return self.concept.canonical_name, ('{1} %s {2}' % self.reltype.name), None, None

    def nl(self):
        # Try to get a good example frame with this filled in.
        assertions = Assertion.useful.filter(language=self.lang,
                                             relation=self.reltype)
        if self.slot == 1:
            assertions = assertions.filter(concept2=self.concept)
        else:
            assertions = assertions.filter(concept1=self.concept)

        filtered = assertions.filter(frame__goodness__gte=2)
        try:
            best = filtered[0]
            frame = best.frame.text.replace('{%}', '')
            if self.slot == 1:
                return None, frame, best.text2, best.frame_id
            else:
                return best.text1, frame, None, best.frame_id
        except IndexError:
            # No example frame found.
            # Fall back to just getting the best frame for this reltype.
            try:
                frame = Frame.objects.filter(relation=self.reltype,
                                             language=self.lang)[0]
                frame_text = frame.text.replace('{%}', '')
                if self.slot == 1:
                    return None, frame_text, self.concept.canonical_name, frame.id
                else:
                    return self.concept.canonical_name, frame_text, None, frame.id
            except IndexError:
                # Couldn't even find a frame. Fallback on the only thing we got.
                if self.slot == 1:
                    return None, ('{1} %s {2}' % self.reltype.name), self.concept.canonical_name, None
                else:
                    return self.concept.canonical_name, ('{1} %s {2}' % self.reltype.name), None, None

num_re = re.compile(r'\{(\d+)\}')
def fill_in_nums(frame, *a):
    def getter(match):
        return a[int(match.group(1))-1]
    return num_re.sub(getter, frame)

@json_view
def similar_features(request, lang, category):
    # Default to retrieving 10 items.
    count = int(request.GET.get('count', 10))
    fmt = request.GET.get('format', 'frame_blank')

    svd = get_svd_results(lang)
    cat = category_from_urlcategory(svd, lang, category)
    items = svd.v_distances_to(cat).top_items(count)

    def feature_to_dict(feature_tup, score):
        feature = Feature.from_tuple(feature_tup)
        return dict(
            raw = feature_tup,
            logical = str(feature),
            text = feature.nl_statement('__'),
            score = score
            )

    return {
        'similar':
            [feature_to_dict(feature, score) for (feature, score) in items]
        }


def concept_to_dict(c):
    return dict(
        id=c.id,
        language=c.language_id,
        normalized=c.text,
        num_assertions=c.num_assertions,
        canonical_name=c.canonical_name)

def assertion_to_dict(a):
    return dict(id=a.id, left=concept_to_dict(a.concept1),
                type=a.relation.name, right=concept_to_dict(a.concept2),
                score=a.score, sentence=a.nl_repr())

@json_view
def assertion_info(request, lang, id):
    return assertion_to_dict(get_object_or_404(Assertion, id=id, language=lang))

@json_view
def concept_info(request, lang, concept):
    return concept_to_dict(Concept.get(concept, lang))


def concept_fwd(request, lang, concept):
    return _concept_relations(request, lang, concept, 'fwd')
def concept_rev(request, lang, concept):
    return _concept_relations(request, lang, concept, 'rev')
def concept_all_relations(request, lang, concept):
    return _concept_relations(request, lang, concept, 'all')


@json_view
def _concept_relations(request, lang, concept, filter='all'):
    types = request.GET.get('types', 'All')
    limit = int(request.GET.get('limit', 10))
    concept_obj = Concept.get(concept, lang)
    if filter == 'all':
        assertions = concept_obj.get_assertions(useful_only=True)
    elif filter == 'fwd':
        assertions = concept_obj.get_assertions_forward()
    elif filter == 'rev':
        assertions = concept_obj.get_assertions_reverse()
    else:
        raise TypeError('unknown concept_relations filter: %s' % (filter,))

    if types != 'All':
        relations = [Relation.objects.get(name=t) for t in types.split(',')]
        import operator
        filters = reduce(operator.or_, [Q(relation=rel) for rel in relations])
        assertions = assertions.filter(filters)

    return {'assertions': [assertion_to_dict(a) for a in assertions[:limit]]}


@json_view
def eval_assertion(request, lang, concept1, reltype, concept2):
    c1 = Concept.get(concept1, lang)
    c2 = Concept.get(concept2, lang)

    svd = get_svd_results(lang)

    from csc.conceptnet4.analogyspace import eval_assertion
    lval, rval = eval_assertion(svd, relationtype=reltype, ltext=c1.text, rtext=c2.text)

    return {'lfeat_val': lval,
            'rfeat_val': rval}

from commons.analysis import get_tensor
def get_predictions(lang, concepts):
    count = 100
    tensor = get_tensor(lang)
    svd = get_svd_results(lang)
    cat = make_category_failsoft(svd, concepts, [], concepts)
    items = svd.v_distances_to(cat).top_items(count)

    for feature, score in items:
        for concept in concepts:
            # Exclude items that are already in the database.
            # FIXME: check tensor format
            if (concept, feature) in tensor: continue

            f = Feature.from_tuple(feature)
            prop = f.fill_in(concept)

            # Exclude self-relations.
            if prop.concept1 == prop.concept2: continue

            yield prop, score

def iterlim(iter, lim):
    count = 0
    while count < lim:
        yield iter.next()
        count += 1

@json_view
def predicted(request, lang, category):
    limit = int(request.GET.get('limit', 3))
    parts, concepts, features = unpack_urlcategory(lang, category)
    predictions = get_predictions(lang, concepts)
    predictions_parts = (prop.nl_parts() + (score,) for prop, score in iterlim(predictions, limit))

    return {
        'predictions':
            [dict(left=surface1, frame=frame.text, right=surface2, reltype=frame.relation.name,
                  score=score, frame_id=frame.id)
             for frame, frame_text, surface1, surface2, score in predictions_parts]
        }

def tensor_download(request, lang):
    return HttpResponse(open(tensor_filename(lang), 'rb'), mimetype='application/x-gzip')


@json_view
def category_similarity(request, lang, cat1, cat2):
    from math import sqrt

    svd = get_svd_results(lang)
    cat1_vec = category_from_urlcategory(svd, lang, cat1)
    cat2_vec = category_from_urlcategory(svd, lang, cat2)

    return {
        'similarity':
            cat1_vec*cat2_vec / (sqrt(cat1_vec*cat1_vec) * sqrt(cat2_vec*cat2_vec))
        }
