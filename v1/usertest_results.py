import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'usertest_data_settings'

from twenty_questions.models import SurveyResultLine
from math import sqrt
import pylab

reverse_fields = ['efficient', 'intuitive']

likert_fields = ["again", "intuitive", "adapt", "teach", "efficient", "enjoy"]

useful_fields = likert_fields + ["elapsed"]

survey_fields = useful_fields + ["starttime", "iphash", "condition", "used"]

#condition_field = "condition"
#elapsed_field = "elapsed"


user_stats = {}

results = SurveyResultLine.objects.filter(res__id__gte=20)

for result in results:
    t = user_stats.get(result.res.id, {})
    t[result.field] = result.value
    user_stats[result.res.id] = t

cond = [{}, {}, {}, {}]
for user_id, user in user_stats.iteritems():
    if user.get("condition", None) == 1:
        cond[1][user_id] = user
    elif user.get("condition", None) == 3:
        cond[3][user_id] = user

cond_survey_stats = {1 : dict( [(x, []) for x in survey_fields] ),
                     3 : dict( [(x, []) for x in survey_fields] )}

for user_id, user in user_stats.iteritems():
    if "condition" in user:
        for field in useful_fields:
            if field in user:
                if field in reverse_fields:
                    cond_survey_stats[user["condition"]][field].append(6 - user[field])
                else:
                    cond_survey_stats[user["condition"]][field].append(user[field])

cond_summary = {1 : dict( [(x, None) for x in survey_fields] ),
                3 : dict( [(x, None) for x in survey_fields] )}

print "field    condition     mean     std. dev     min      max   num "
for cond_num, cond in cond_survey_stats.iteritems():
    for field in useful_fields:
        if len(cond_survey_stats[cond_num][field]) != 0:
            vals = cond_survey_stats[cond_num][field]

            # Remove outliers in elapsed time
            if field == 'elapsed':
                vals = [x for x in vals if x < 3600]

            min_val = min(vals)
            max_val = max(vals)
            mean = float(sum(vals))/len(vals)
            std_dev = pylab.std(vals)
            num = float(len(vals))
            cond_summary[cond_num][field] = (mean, std_dev, num)
            print field, cond_num, mean, std_dev, min_val, max_val, num


print "field    t-score    d.f."
for field in useful_fields:
    t = cond_summary[1][field][0] - cond_summary[3][field][0]
    n_1 = cond_summary[1][field][2]
    n_2 = cond_summary[3][field][2]
    s_1 = (cond_summary[1][field][1])**2 / n_1
    s_2 = (cond_summary[3][field][1])**2 / n_2
    t = t / sqrt(s_1 + s_2)
    df = ((s_1 + s_2)**2) / ( ((s_1)**2/(n_1 - 1)) + ((s_2)**2/(n_2 - 1)) )
    # print stats.ttest_ind(cond_survey_stats[1][field], cond_survey_stats[3][field])
    print field, t, df

'''Plotting code '''
def make_plot(cond_1_means, cond_1_std, cond_2_means, cond_2_std, figname, xlabels, ylabel, yticks):
    pylab.clf()
    print cond_1_means
    print cond_1_std
    print cond_2_means
    print cond_2_std

    N = len(cond_1_means)
    menMeans = cond_1_means
    menStd =  cond_1_std

    ind = pylab.arange(N)  # the x locations for the groups
    width = 0.35       # the width of the bars
    p1 = pylab.bar(ind, menMeans, width, color='gray', ecolor="k", yerr=menStd)

    womenMeans = cond_2_means
    womenStd =  cond_2_std
    p2 = pylab.bar(ind+width, womenMeans, width, color='r', ecolor="k", yerr=womenStd)

    pylab.ylabel(ylabel)
    pylab.title('Scores by Test Condition')
    pylab.xticks(ind+width, xlabels)
    pylab.xlim(-width,len(ind))
    pylab.yticks(yticks)
    pylab.ylim(yticks[0], yticks[-1])

    pylab.legend( (p1[0], p2[0]), ('Manual', '20 Questions'), shadow=True)
    pylab.savefig(figname)


make_plot([cond_summary[1][field][0] for field in likert_fields],
          [cond_summary[1][field][1] / sqrt(cond_summary[1][field][2]) for field in likert_fields],
          [cond_summary[3][field][0] for field in likert_fields],
          [cond_summary[3][field][1] / sqrt(cond_summary[3][field][2]) for field in likert_fields],
          "usertest.png",
          likert_fields,
          "Mean Likert Score",
          pylab.arange(1,6,1))

# This is a ghetto hack to remove the big outlier guy
make_plot([cond_summary[1][field][0] for field in ["elapsed"]],
          [cond_summary[1][field][1] / sqrt(cond_summary[1][field][2]) for field in ["elapsed"]],
          [cond_summary[3][field][0] for field in ["elapsed"]],
          [cond_summary[3][field][1] / sqrt(cond_summary[3][field][2]) for field in ["elapsed"]],
          "usertest_elapsed.png",
          [""],
          "Elapsed Time in Seconds",
          pylab.arange(0,901,100))

pylab.clf()
pylab.plot(cond_survey_stats[1]["elapsed"], 'r-')
pylab.plot(cond_survey_stats[3]["elapsed"], 'y-')
pylab.savefig("elapsed_time")
