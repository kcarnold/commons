from commons.util import direct_to_template, json_view
from csc.conceptnet.models import Sentence

def main(request, lang):
    return direct_to_template(request, 'exp/main.html')

@json_view
def sentences_matching_regex(request, lang, regex):
    sentences = Sentence.objects.filter(language=lang, text__regex=regex)
    return {'sentences': [
            {
                'id': s.id,
                'text': s.text,
                }
            for s in sentences]}
