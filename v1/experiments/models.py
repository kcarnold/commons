from django.db import models
from csc.conceptnet.models import Language, Sentence, Frequency

import re

class ExpRelationType(models.Model):
    name = models.CharField(max_length=128, unique=True)
    description = models.TextField()

    class Admin:
        pass

class ExpFrame(models.Model):
    type = models.ForeignKey(ExpRelationType)
    language = models.ForeignKey(Language)
    text = models.CharField(max_length=150)
    frequency = models.ForeignKey(Frequency)
    num_slots = models.IntegerField()

    def calc_num_slots(self):
        return len(re.findall('{\d+}', self.text))

    class Admin:
        pass



class ExpConcept(models.Model):
    language = models.ForeignKey(Language)
    text = models.TextField()

    def __unicode__(self):
        return u'<Concept: "%s">' % self.text

    class Admin:
        pass


class SlotContents(models.Model):
    slot = models.IntegerField()
    contents = models.ForeignKey(ExpConcept)

    def __unicode__(self):
        return u'<Slot %s: "%s">' % (self.slot, unicode(self.contents))

    class Admin:
        pass


class ExpAssertion(models.Model):
    frame = models.ForeignKey(ExpFrame)
    parameters = models.ManyToManyField(SlotContents)
    sentence = models.ForeignKey(Sentence)

    def __unicode__(self):
        return u'<Assertion (%s): [%s]>' % (
            unicode(self.type),
            ', '.join([unicode(x) for x in self.parameters.all()]))

    class Admin:
        pass
