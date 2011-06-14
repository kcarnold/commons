from django.template import loader, RequestContext
from django.http import Http404, HttpResponse
from django.core.xheaders import populate_xheaders
from django.core.paginator import QuerySetPaginator, InvalidPage
from django.core.exceptions import ObjectDoesNotExist

def multi_object_list(request, querysets, template_name=None, template_loader=loader,
        extra_context=None, context_processors=None, mimetype=None):
    """
    Generic list of objects.  Querysets is a sequence of tuples, where the first element
    of each tuple is the queryset, and the second element is a dictionary specifying the
    parameters for that queryset.  Unused parameters are set to the following default values.
       Defaults:
         name: required, throws error if not present
         paginate_by: don't paginate
         page: get page from HTTP request
         allow_emptys: None


    Templates: ``<app_label>/<model_name>_[<model_name>_]*list.html``
    Context:
        object_contexts
          dict mapping queryname to a dict containing the following keys:
            queryname_list
                list of objects
            is_paginated
                are the results paginated?
            results_per_page
                number of objects per page (if paginated)
            has_next
                is there a next page?
            has_previous
                is there a prev page?
            page
                the current page
            next
                the next page
            previous
                the previous page
            pages
                number of pages, total
            hits
                number of objects, total
            last_on_page
                the result number of the last of object in the
                object_list (1-indexed)
            first_on_page
                the result number of the first object in the
                object_list (1-indexed)
            page_range:
                A list of the page numbers (1-indexed).
    """
    if extra_context is None: extra_context = {}
    object_contexts = {}
    for querytuple in querysets:
        queryset, parameters = querytuple
        queryset = queryset._clone()
        paginate_by = parameters.get('paginate_by', None)
        allow_empty = parameters.get('allow_empty', None)
        if paginate_by:
            paginator = QuerySetPaginator(queryset, paginate_by, allow_empty_first_page=allow_empty)
            page = parameters.get('page', None)
            if not page:
                page = request.GET.get((parameters['name'] + '_page'), 1)
            try:
                page_number = int(page)
            except ValueError:
                if page == 'last':
                    page_number = paginator.num_pages
                else:
                    # Page is not 'last', nor can it be converted to an int.
                    raise Http404
            try:
                page_obj = paginator.page(page_number)
            except InvalidPage:
                raise Http404
            object_context = {
                '%s_list' % parameters['name']: page_obj.object_list,
                'paginator': paginator,
                'page_obj': page_obj,

                # Legacy template context stuff. New templates should use page_obj
                # to access this instead.
                'is_paginated': page_obj.has_other_pages(),
                'results_per_page': paginator.per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'page': page_obj.number,
                'next': page_obj.next_page_number(),
                'previous': page_obj.previous_page_number(),
                'first_on_page': page_obj.start_index(),
                'last_on_page': page_obj.end_index(),
                'pages': paginator.num_pages,
                'hits': paginator.count,
                'page_range': paginator.page_range,
            }
        else:
            object_context = {
                '%s_list' % parameters['name']: queryset,
                'paginator': None,
                'page_obj': None,
                'is_paginated': False,
            }
            if not allow_empty and len(queryset) == 0:
                raise Http404
        object_contexts[parameters['name']] = object_context
    c = RequestContext(request,
        object_contexts
        , context_processors)
    for key, value in extra_context.items():
        if callable(value):
            c[key] = value()
        else:
            c[key] = value
    if not template_name:
        object_names = []
        app_label = ''
        for (queryset, parameters) in querysets:
            model = queryset.model
            app_label = model._meta.app_label
            object_names.append(model._meta.object_name.lower())
        object_name = '_'.join(object_names)
        template_name = "%s/%slist.html" % (app_label, object_name)
    t = template_loader.get_template(template_name)
    return HttpResponse(t.render(c), mimetype=mimetype)
