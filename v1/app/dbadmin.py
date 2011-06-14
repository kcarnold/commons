from django.views.generic.simple import direct_to_template
from django.contrib.auth.decorators import user_passes_test

from csc.conceptnet.models import Assertion, Rating

from datetime import datetime, timedelta

def staff_required(func):
    def is_staff(user):
        return user.is_staff
    return user_passes_test(is_staff)(func)

# Default to the last 3 days' of activity.
default_age = timedelta(days=3)

@staff_required
def recent_activity(request, since=None):
    if since is None:
        since = datetime.now() - default_age
    preds = Assertion.objects.filter(created_on__gt=since).order_by('-created_on')
    ratings = Rating.objects.filter(updated_on__gt=since).order_by('-updated_on')
    return direct_to_template(request, template='admin/recent.html',
                              extra_context = {
            'assertions': preds,
            'ratings': ratings
            })
