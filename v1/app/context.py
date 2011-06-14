from django.conf import settings
from django.utils.translation import ugettext_lazy as _


def commons_context(request):
    '''Return the common data we need for responding to a request.'''
    # FIXME: sometimes the request object doesn't get a LANGUAGE_CODE. Default it...
    request_lang = getattr(request, 'LANGUAGE_CODE', 'en')
    return {
        'is_devel': settings.DEVEL,
        'path': request.path,
        'lang': request_lang,  # Specific views should override this.
        'langs': [dict(id=id, name=_(name),
                       is_cur=(request_lang==id))
                  for id, name in settings.LANGUAGES],
	'settings': settings
        }
