#!/usr/bin/env python
import sys, os.path
sys.path.insert(0, os.path.abspath(os.pardir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'commons.settings')

from django.test import Client
c=Client()

# Make sure search doesn't fail with no query string.
r = c.get('/en/search/', {})

# Make sure set_lang doesn't fail with no lang.
r = c.get('/set_lang/', {})

