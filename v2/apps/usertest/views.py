# Create your views here.
from models import UserTestQuestion, UserTestAnswer, VALUES
from csc.corpus.models import Language
from csc.conceptnet4.models import User
from django.shortcuts import render_to_response
import random

en=Language.get('en')

SOURCES = ['random_verbosity', 'cnet4', 'verbosity']
human_names_jan09 = {
  'random': 'Randomly generated statements',
  'cnet35': 'Statements people have contributed to ConceptNet',
  'cnet35_svd': 'Statements predicted to be true using ConceptNet',
  'cnet35_wordnet_svd': 
    'Statements predicted to be true by combining ConceptNet and WordNet',

SOURCES = ['conceptnet_jan10', 'svd2_jan10', 'ccipca_jan10', 'random_jan10']
human_names = {
  'random_jan10': 'Randomly generated statements',
  'conceptnet_jan10': 'Statements people have contributed to ConceptNet',
  'svd2_jan10': 'Statements predicted to be true (batch algorithm)',
  'ccipca_jan10': 
    'Statements predicted to be true (real-time algorithm)',
}

human_names = {
  'random_verbosity': 'Randomly generated statements',
  'cnet4': 'Statements people have contributed to ConceptNet',
  'verbosity': 'Statements people have contributed using Verbosity'
}

def inferences_from_file(filename):
    f = open(filename)
    got = []
    for line in file:
        line = line.strip()
        if not line: continue
        got.append(eval(line))
    return got

def ask_questions(request):
    questions = []
    # 20 from each source.
    for source in SOURCES:
        questions.extend(UserTestQuestion.objects.filter(
          language=en, source=source).order_by('asked', '?')[:20])
    choices = VALUES.items()
    choices.sort()
    choices.reverse()
    random.shuffle(questions)
    for q in questions:
        q.asked += 1
        q.save()
    return render_to_response('usertest/ask.html', locals())

from sys import maxint
def temp_user(done_before=False):
    prefix = 'usertest10_use_'
    if done_before: prefix = 'usertest10_skip_'
    username = prefix + str(random.randint(0, 10000000))
    password = 'nologin10'
    return User.objects.create_user(username, '', password)

def get_answers(request):
    done_before = request.POST.get('done_before', False)
    user = temp_user(done_before)
    got_answers = {}
    for source in SOURCES: got_answers[human_names[source]] = []
    for key, value in request.POST.items():
        if key.startswith('q_'):
            qid = int(key[2:])
            question = UserTestQuestion.objects.get(id=qid)
            answer = UserTestAnswer(question=question, user=user,
                                    value=int(value))
            got_answers[human_names[question.source]].append(answer)
            answer.save()
    insert_foot = UserTestAnswer.objects.filter(value=-2).order_by('?')[:10]
    return render_to_response('usertest/results.html', locals())

