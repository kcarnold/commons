from csc.conceptnet.models import Rating
from math import sqrt
import pylab

ratings = Rating.objects.filter(user__username__startswith="20q")
user_ratings = {}

for rating in ratings:
    user_ratings[rating.user.username] = user_ratings.get(rating.user.username, []) + [rating]

'''
for user, ratings in user_ratings:
    for rating in ratings:
        if rating.
'''
