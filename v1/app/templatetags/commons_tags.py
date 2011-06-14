from django import template
from django.core.urlresolvers import reverse
from django.core.cache import cache
from commons.util import cached

import re

from commons.app.queries import get_top_torate, get_top_concepts,\
get_random_concepts

from csc.conceptnet4.models import Assertion

register = template.Library()

def link(target, text):
    return '<a href="%s">%s</a>' % (target, text)

def link_concept(assertion, text):
    return link(reverse('concept',
                        kwargs={'lang': assertion.language_id,
                                'concept_name': text}),
                text)

# Helper function needed because the cached decorator changes the function signature.
@cached(lambda assertion: "linked_assertion_"+str(assertion.id), 60*60*24)
def _linked_assertion(assertion):
    return assertion.nl_repr(link_concept)

@register.simple_tag
def linked_assertion(assertion):
    """Hyperlink the concepts in a assertion to their respective pages"""
    return _linked_assertion(assertion)

@register.simple_tag
def with_blanks(frame_text):
    """Replace frame blanks {1}, {2} with input boxes."""
    def input_box(match):
        return '<input type="text" name="field_%d" size="10" />' % int(match.group(1))
    return re.sub(r'\{%\}', '', re.sub(r'\{(\d+)\}', input_box, frame_text))

@register.simple_tag
def with_blanks_filled(frame_text, fill_text, slot):
    """Replace frame blanks {1}, {2} with input boxes."""
    def input_box(match):
        if int(match.group(1)) == slot:
            return '<input type="text" name="field_%d" value="%s" size="10" />' % (int(match.group(1)), fill_text)
        else:
            return '<input type="text" name="field_%d" size="10" />' % int(match.group(1))
    return re.sub(r'\{%\}', '', re.sub(r'\{(\d+)\}', input_box, frame_text))

@cached(lambda lang, logged_in: 'recently_learned_'+lang+'_'+logged_in)
def _recently_learned(lang, logged_in):
    recent = Assertion.useful.filter(language=lang).order_by('-created_on')
    if not logged_in:
        recent = recent.filter(score__gt=1, polarity=1)
    recent = recent[:10]
    c = template.Context({'recent': recent, 'lang': lang})
    result = template.loader.get_template('commons/_recent.html').render(c)
    cache.set(cache_key, result, 60) # one minute timeout
    return result


@register.simple_tag
def recently_learned(lang='en', logged_in=False):
    """Get the (hopefully pre-rendered) list of recently-learned assertions"""
    return _recently_learned(lang, logged_in)

@register.inclusion_tag('commons/_cloud.html')
def top_concepts(lang, num=10):
    top_concepts = get_random_concepts(lang, num)
    return {'links': [dict(text=concept.canonical_name,
                           tgt=reverse('concept', kwargs={
                        'lang': lang, 'concept_name': concept.canonical_name}),
                           size=12)
                      for concept in top_concepts]}

@register.inclusion_tag('commons/_assertions_li.html', takes_context=True)
def top_torate(context, lang, num=5):
    return {'assertions': get_top_torate(lang, num),
            'user': context['user']}

vals_to_ratings = {
    None: 'none',
    1: 'Good',
    -1: 'Bad',
    0: 'none'}

@register.inclusion_tag('commons/_rating_commands.html', takes_context=True)
def rating_commands(context, assertion):
    user = context['user']
    if user.is_authenticated():
        user_rating = assertion.get_rating(user)
    else:
        user_rating = 'need_login'
    return dict(id=assertion.id, user_rating=vals_to_ratings.get(user_rating, 'none'))

@register.inclusion_tag('commons/_predlink.html')
def predlink(assertion):
    return {'id': assertion.id, 'lang': assertion.language_id}

@register.inclusion_tag('commons/_userlink.html')
def userlink(user):
    return {'id': user.id,
            'name': user.username}


# From http://www.djangosnippets.org/snippets/93/
@register.filter
def spaces_and_commas(value, _match_re=re.compile(",(?! )")):
    return _match_re.sub(", ", value)
