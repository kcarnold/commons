from django.db import models
from csc.conceptnet4.models import *
from csc.corpus.models import Language, User

class UserTestQuestion(models.Model):
    text1=models.CharField(max_length=255)
    text2=models.CharField(max_length=255)
    frame=models.ForeignKey(Frame)
    language=models.ForeignKey(Language)
    score=models.FloatField()
    source=models.CharField(max_length=30)
    asked=models.IntegerField(default=0)

    def __unicode__(self):
        return str((self.frame, self.text1, self.text2, self.score))
    def statement_highlight(self):
        return self.frame.text.replace("{1}", "<b>%s</b>" % self.text1)\
               .replace("{2}", "<b>%s</b>" % self.text2).replace("{%}", "")

# These values were used in usertests before November 2009.
VALUES = {
  2: 'Generally true',
  1: 'Sometimes true',
  0: "Don't know / Opinion",
  -1: "Not true",
  -2: "Not true but amusing",
  -3: "Doesn't make sense"
}

# Using these values in the November 2009 user test.
VALUES_nov09 = {
  4: 'Generally true',
  3: 'Generally true (but grammar is bad)',
  2: 'Sometimes true',
  1: 'Sometimes true (but grammar is bad)',
  0: "Don't know / Opinion",
  -1: "Not true",
  -2: "Doesn't make sense"
}
                
class UserTestAnswer(models.Model):
    question = models.ForeignKey(UserTestQuestion)
    user = models.ForeignKey(User)
    value = models.IntegerField()

    def text_value(self):
        if self.is_nov09():
            return VALUES_nov09[self.value]
        else:
            return VALUES[self.value]
    
    def is_nov09(self):
        "Was this from the wonky user test with the different range of values?"
        return (self.id >= 4488) and (self.id < 5350)

    def standardized_value(self):
        text = self.text_value()
        if text.startswith('Generally true'):
            return 2
        elif text.startswith('Sometimes true'):
            return 1
        elif text.startswith("Don't know"):
            return 0
        elif text.startswith("Not true"):
            return -1
        elif text.startswith("Doesn't make sense"):
            return -2
        else:
            raise ValueError("Don't recognize this answer: %r" % text)

    #@staticmethod
    #def export_all():
    #    for a in UserTestAnswer.objects.all():

            
    
