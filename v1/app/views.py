from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, Http404
from django.shortcuts import render_to_response, get_object_or_404
from django.core.urlresolvers import reverse
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.utils.translation import ugettext_lazy as _
from django.views.generic.list_detail import object_list

from django.conf import settings
from commons.util import needs_setting
from commons.app.queries import add_assertion, get_stats
from commons.app.multi_object_list import multi_object_list
from csc.corpus.models import Language, User
from events.models import Activity
from csc.conceptnet4.models import Assertion, Frame, Relation, Concept
from voting.models import Vote
from django.contrib.contenttypes.models import ContentType

# name = "commons manual entry"
MANUAL_ENTRY_ACTIVITY_ID = 16

def respond_with(template, request, new_data):
    '''Respond to the request with the given template and data. Uses the data from
    _common_data as a base; new_data can override.'''
    template_data = RequestContext(request, new_data)
    return render_to_response(template, template_data)


def get_language(lang):
    try:
        return Language.get(lang)
    except Language.DoesNotExist:
        raise Http404

# View functions
def main(request, lang=None):
    '''Main page view'''
    if lang is None:
        return HttpResponseRedirect(reverse('main', kwargs=dict(lang=settings.LANGUAGE_CODE)))
#    request.session['django_language'] = lang
    return respond_with('commons/index.html', request, dict(lang=lang))

def search(request, lang):
    '''Same as concept for now, except data is passed in as GET'''
    item = request.GET.get('item', None)
    if not item: return HttpResponseRedirect(reverse('main', kwargs={'lang': lang}))
    return HttpResponseRedirect(reverse('concept', kwargs=dict(lang=lang, concept_name=item)))


def concept(request, lang, concept_name):
    '''View for displaying a concept, specified by text.'''
    if 'format' in request.GET:
        from commons.app.json import concept_info
        return concept_info(request, lang, concept_name)
    lang = get_language(lang)
    try:
        concept = Concept.get(concept_name, lang)
    except Concept.DoesNotExist:
        return respond_with('commons/concept_noinfo.html', request,
                            {'lang': lang.id, 'concept_name': concept_name })

    queryset = concept.get_assertions()
    per_page = int(request.GET.get('perpage', 8))
    return object_list(request, queryset,
                       paginate_by=per_page,
                       template_name='commons/concept.html',
                       template_object_name='assertion',
                       extra_context={'concept_name': concept_name})

def concepts(request, lang):
    import sys
    min_info = int(request.GET.get('min_info', 1))
    max_info = int(request.GET.get('max_info', sys.maxint))
    per_page = int(request.GET.get('perpage', 200))

    queryset = Concept.objects.filter(language=lang,
                                      num_assertions__gte=min_info,
                                      num_assertions__lte=max_info
                                      ).order_by('-num_assertions')
    return object_list(request, queryset,
                       paginate_by=per_page,
                       template_name='commons/concepts.html',
                       template_object_name='concept')


def assertion(request, lang, id):
    '''Display a assertion, specified by id.'''
    if 'format' in request.GET:
        from commons.app.json import assertion_info
        return assertion_info(request, lang, id)
    rel = get_object_or_404(Assertion, id=id, language=lang)
    return respond_with('commons/assertion_detail.html', request, {
            'lang': lang,
            'assertion': rel,
            'ratings': rel.votes.all(),
            })

def set_lang(request):
    '''Set the session language to the language passed in GET headers'''
    lang = request.GET.get('lang', '')
    if lang not in dict(settings.LANGUAGES).keys():
        return HttpResponseBadRequest('unknown language %s' % lang)
    request.session['django_language'] = lang
    return HttpResponseRedirect(reverse('main', kwargs=dict(lang=lang)))

def add_predtypes(request, lang):
    '''List the relation types so the user can choose one to add from.'''
    return respond_with('commons/add_predtypes.html', request, {
            'lang': lang,
            'predtypes': [r for r in
            Relation.objects.filter(description__isnull=False) if not
            r.description.startswith('*')]
            })

@login_required
def add_predtype(request, predtype, lang):
    # Extract relation
    relation = get_object_or_404(Relation, id=predtype)

    # Extract language
    lang = get_language(lang)

    # Extract reasonable examples
    examples = Assertion.useful.filter(relation=relation, language=lang)[:5]

    # Extract frames
    frames = Frame.objects.filter(relation=relation, language=lang, goodness__gt=1)[:5]

    # Render results
    return respond_with('commons/add_predtype_assertion.html', request, {
            'lang': lang.id,
            'predtype': relation,
            'examples': examples,
            'frames': frames
            })

@login_required
def add_from_frame(request, lang, frame, activity=None):
    '''Add a new assertion from a given frame.'''
    frame = get_object_or_404(Frame, id=frame)
    if request.method == 'POST':
        # User gave data. Add it.
        language = get_language(lang)
        lang = language.id
        assert frame.language == language
        text1 = request.POST['field_1']
        text2 = request.POST['field_2']
        rating = request.POST.get('rating', 1)

        if activity is None:
            activity = Activity.objects.get(id=MANUAL_ENTRY_ACTIVITY_ID)

        assertion = add_assertion(request, request.user, frame, text1, text2,
        activity, rating)

        # Clear recently learned.
        from django.core.cache import cache
        cache.delete('recently_learned_'+lang)
        cache.delete('recently_learned_'+lang+'_full')

        return HttpResponseRedirect(reverse('assertion',kwargs=dict(id=assertion.id,
                                                                   lang=lang)))
    else:
        return respond_with('commons/add_assertion.html', request, {'frame': frame})

def username_contributions(request, name):
    return user_contributions(request, get_object_or_404(User, username=name))

def userid_contributions(request, id):
    return user_contributions(request, get_object_or_404(User, id=id))

def user_contributions(request, user):
    '''Show the contributions and ratings from a user.
    Takes a User object; the two functions above give two ways to get one.'''
    per_page = int(request.GET.get('perpage', 25))
    assertion_ctype = ContentType.objects.get_for_model(Assertion)
    # FIXME: join with the events table?
    # FIXME: exclude votes on the user's own statements
    rating_query = Vote.objects.filter(content_type=assertion_ctype, user=user)
    contrib_query = Assertion.useful.filter(rawassertion__creator=user)
    contrib_params = {'name':'contributions', 'paginate_by': per_page,}

    rating_params = {'name': 'ratings', 'paginate_by': per_page}
    return multi_object_list(request,
                             ((contrib_query, contrib_params),
                              (rating_query, rating_params)),
                              template_name='commons/user_contributions.html',
                                extra_context={'tgt_user': user}
                             )

def view_frames(request, lang, page=1, relation=None):
    '''Show all the frames available, with space to add another.
    Only actually shows frames with goodness > 1.'''
    # FIXME: pagination
    # FIXME: filter by pred type
    frames = Frame.objects.filter(language=lang, goodness__gt=1)
    if relation is not None:
        frames = frames.filter(relation_id=relation)
    relations = Relation.objects.all()
    frames = frames.order_by('relation')
    return respond_with('commons/frames.html', request, {'frames': frames,
                                                         'predtypes': relations,
                                                         'lang': lang})

@login_required
@needs_setting('ENABLE_ADD_FRAME', 'add a new frame')
def add_frame(request, lang):
    '''Add a new frame.'''
    # FIXME: check that the user has privs to do this!
    relation = request.POST['predtype']
    text = request.POST['text']
    goodness = request.POST['goodness']
    try:
        relation = int(relation)
        relation = RelationType.objects.get(id=relation)
    except ValueError:
        relation = RelationType.objects.get(name=relation)
    frame = Frame.create(relation=relation, text=text,
                         language=get_language(lang), goodness=int(goodness))
    return HttpResponseRedirect(reverse('view-frames', kwargs=dict(lang=lang)))


def best(request, lang):
    '''List all assertions, highest scores first.'''
    lang = get_language(lang)
    queryset = Assertion.useful.filter(language=lang).order_by('-score')
    per_page = int(request.GET.get('perpage', 20))
    return object_list(request, queryset,
                       paginate_by=per_page,
                       template_name='commons/assertion_list.html',
                       template_object_name='assertion')


def all_sentences(request, lang):
    '''Returns all sentences, highest scores first, in the form:
    assertion_id,score,sentence (utf-8 encoded)
    Pass '?minscore=' to set the minimum score (default 2).'''
    minscore = int(request.GET.get('minscore', 0))
    lang = get_language(lang)

    res = HttpResponse(mimetype='text/csv')
    res['Content-Disposition'] = 'attachment; filename=cnet_minscore_%d.csv' % minscore
    import csv
    writer = csv.writer(res)
    for a in Assertion.useful.filter(language=lang, score__gte=minscore).iterator():
        writer.writerow((a.id, a.score, a.sentence.text.encode('utf-8')))

    return res


def stats(request, lang):
    stats = get_stats(lang)

    return respond_with('commons/stats.html', request,
                        dict(acount=stats['assertion_counts'],
                             ccount=stats['concept_counts']))


@login_required
def feedback(request):
    '''Send feedback to the site admins.'''
    page = request.POST['page']
    data = request.POST['feedback'].strip()
    user = request.user

    try:
        if not data: return

        userdesc = '"%s" (%d)' % (user.username, user.id)

        from django.core.mail import mail_admins
        mail_admins('[commons] Feedback on %s' % page,
                    'Feedback from user '+userdesc+'\n'+
                    'with IP '+request.META['REMOTE_ADDR']+'\n'+
                    'on page "'+page+'":\n\n'+
                    data)
    finally:
        return HttpResponseRedirect(page)
