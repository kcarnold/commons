import os
# Override a pure-csc settings
if os.environ.get('DJANGO_SETTINGS_MODULE', 'csc.settings') == 'csc.settings':
    os.environ['DJANGO_SETTINGS_MODULE'] = 'commons.settings'
