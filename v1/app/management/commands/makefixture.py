#save into anyapp/management/commands/makefixture.py
#or back into django/core/management/commands/makefixture.py
#v0.1 -- current version
#known issues:
#no support for generic relations
#no support for one-to-one relations
from optparse import make_option
from django.core import serializers
from django.core.management.base import BaseCommand
from django.core.management.base import CommandError
from django.core.management.base import LabelCommand
from django.db.models.fields.related import ForeignKey
from django.db.models.fields.related import ManyToManyField
from django.db.models.loading import get_models
import re

DEBUG = False

label_re = re.compile(r'^([\w.]+)(?:\[(.*)\])?')
slice_re = re.compile(r'^(\d*):(\d*)')
list_re = re.compile(r'[\d][\d,]*')

def model_name(m):
    module = m.__module__.split('.')[:-1] # remove .models
    return ".".join(module + [m._meta.object_name])

def int_or_none(a):
    if not a: return None
    return int(a)

class Command(LabelCommand):
    help = 'Output the contents of the database as a fixture of the given format.'
    args = 'modelname[pk] or modelname[id1:id2] repeated one or more times'
    option_list = BaseCommand.option_list + (
        make_option('--skip-related', default=True, action='store_false', dest='propagate',
            help='Specifies if we shall not add related objects.'),
        make_option('--format', default='json', dest='format',
            help='Specifies the output serialization format for fixtures.'),
        make_option('--indent', default=None, dest='indent', type='int',
            help='Specifies the indent level to use when pretty-printing output'),
    )

    def handle_models(self, models, **options):
        format = options.get('format','json')
        indent = options.get('indent',None)
        show_traceback = options.get('traceback', False)
        propagate = options.get('propagate', True)

        # Check that the serialization format exists; this is a shortcut to
        # avoid collating all the objects and _then_ failing.
        if format not in serializers.get_public_serializer_formats():
            raise CommandError("Unknown serialization format: %s" % format)

        try:
            serializers.get_serializer(format)
        except KeyError:
            raise CommandError("Unknown serialization format: %s" % format)

        objects = []
        for model, index in models:
            if isinstance(index, list):
                items = model._default_manager.in_bulk(index).values()
            elif isinstance(index, list):
                items = items = model._default_manager.all()
                items = items.order_by(model._meta.pk.attname)
                items = items[index]
            else:
                raise CommandError("Wrong slice: %s" % slice)
            objects.extend(items)

        all = objects
        if propagate:
            collected = set([(x.__class__, x.pk) for x in all])
            while objects:
                related = []
                for x in objects:
                    if DEBUG:
                        print "Adding %s[%s]" % (model_name(x), x.pk)
                    for f in x.__class__._meta.fields + x.__class__._meta.many_to_many:
                        if isinstance(f, ForeignKey):
                            new = getattr(x, f.name) # instantiate object
                            if new and not (new.__class__, new.pk) in collected:
                                collected.add((new.__class__, new.pk))
                                related.append(new)
                        if isinstance(f, ManyToManyField):
                            for new in getattr(x, f.name).all():
                                if new and not (new.__class__, new.pk) in collected:
                                    collected.add((new.__class__, new.pk))
                                    related.append(new)
                objects = related
                all.extend(objects)

        try:
            return serializers.serialize(format, all, indent=indent)
        except Exception, e:
            if show_traceback:
                raise
            raise CommandError("Unable to serialize database: %s" % e)

    def get_models(self):
        return [(m, model_name(m)) for m in get_models()]

    def handle_label(self, labels, **options):
        parsed = []
        for label in labels:
            m = label_re.match(label)
            if m is None:
                raise CommandError("Couldn't interpret the label '%s' as Model or Model[index]" % label)
            search, index_str = m.groups()
            if index_str: # intentionally doesn't match '[]'
                slice_match = slice_re.match(index_str)
                list_match = list_re.match(index_str)

                if slice_match is not None:
                    start, end = slice_match.groups()
                    index = slice(int_or_none(start), int_or_none(end))
                elif list_match is not None:
                    index = [int(idx) for idx in index_str.split(',')]
                else:
                    raise CommandError("Couldn't interpret the index of '%s' as a slice or a list." % label)
            else:
                index = slice(None, None) # Matches the whole model.

            models = [model for model, name in self.get_models()
                            if name.endswith('.'+search) or name == search]
            if not models:
                raise CommandError("Wrong model: %s" % search)
            if len(models)>1:
                raise CommandError("Ambiguous model name: %s" % search)
            parsed.append((models[0], index))
        return self.handle_models(parsed, **options)

    def list_models(self):
        names = [name for _model, name in self.get_models()]
        raise CommandError('Neither model name nor slice given. Installed model names: \n%s' % ",\n".join(names))

    def handle(self, *labels, **options):
        if not labels:
            self.list_models()

        output = []
        label_output = self.handle_label(labels, **options)
        if label_output:
            output.append(label_output)
        return '\n'.join(output)
