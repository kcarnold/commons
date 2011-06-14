from commons.util import direct_to_template

class ConsoleExceptionMiddleware:
    def process_exception(self, request, exception):
        import traceback
        import sys
        exc_info = sys.exc_info()
        print "######################## Exception #############################"
        print '\n'.join(traceback.format_exception(*(exc_info or sys.exc_info())))
        print "################################################################"
        #print repr(request)
        #print "################################################################"

#         print 'Press any key within 5 seconds to enter the debugger.'
#         from select import select
#         result = select(
#         import pdb
#         pdb.post_mortem(exc_info[2])


def page_not_found(request):
    return direct_to_template(request, '404.html', status=404)

def server_error(request):
    return direct_to_template(request, '500.html', status=500)
